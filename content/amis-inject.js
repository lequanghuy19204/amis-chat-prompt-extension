/**
 * AMIS Chat Custom Prompts - Main World Injected Script
 * Chạy trực tiếp trong Page Context của https://misajsc.amis.vn/*
 * Hook trực tiếp vào TipTap Suggestion / Slash Command của MISA một lần duy nhất
 */

(function () {
  if (window.__AMIS_PROMPT_INJECTED__) return;
  window.__AMIS_PROMPT_INJECTED__ = true;

  console.log('[AMIS Prompts] Injected Script v1.3.0 initialized');

  window.__AMIS_CUSTOM_PROMPTS__ = [];

  // Lắng nghe dữ liệu từ Content Script
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.target !== 'AMIS_PAGE_SCRIPT') return;

    if (event.data.action === 'SET_PROMPTS' || event.data.action === 'INIT_CUSTOM_PROMPTS') {
      window.__AMIS_CUSTOM_PROMPTS__ = event.data.prompts || [];
      console.log('[AMIS Prompts] Đã cập nhật', window.__AMIS_CUSTOM_PROMPTS__.length, 'prompts vào Page Context');
      // Nếu editor chưa hook thì hook, nếu đã hook rồi thì không re-register để tránh giật/đóng menu
      const el = document.querySelector('.tiptap.ProseMirror');
      if (el && el.editor && !el.editor.__amis_slash_hooked__) {
        hookTipTapEditor();
      }
    } else if (event.data.action === 'INSERT_PROMPT') {
      insertTriggerDirectly(event.data.trigger || event.data.content);
    }
  });

  // Báo cho Content Script biết Page Script đã sẵn sàng
  window.postMessage({ target: 'AMIS_CONTENT_SCRIPT', action: 'PAGE_SCRIPT_READY' }, '*');

  /**
   * Hook vào TipTap Slash Command của MISA (CHỈ CHẠY 1 LẦN DUY NHẤT TRÊN MỖI EDITOR INSTANCE)
   */
  function hookTipTapEditor() {
    const el = document.querySelector('.tiptap.ProseMirror');
    if (!el || !el.editor || el.editor.isDestroyed) {
      return false;
    }

    const ed = el.editor;

    // ĐÃ HOOK RỒI THÌ TUYỆT ĐỐI KHÔNG CHẠY LẠI
    // (Tránh unregister plugin làm Tippy popover bị destroy/biến mất ngay khi vừa mở)
    if (ed.__amis_slash_hooked__) {
      return true;
    }

    const slashExt = ed.extensionManager?.extensions?.find(x => x.name === 'slashCommand');
    if (!slashExt || !slashExt.options?.suggestion) {
      return false;
    }

    // Đánh dấu editor này đã hook
    ed.__amis_slash_hooked__ = true;

    // Lưu lại hàm gốc của MISA
    if (!slashExt.options.suggestion._origItems) {
      slashExt.options.suggestion._origItems = slashExt.options.suggestion.items;
      slashExt.options.suggestion._origCommand = slashExt.options.suggestion.command;
    }

    // Ghi đè hàm items: Tự động lấy danh sách custom prompts và đưa lên đầu
    slashExt.options.suggestion.items = function ({ query }) {
      try {
        let orig = [];
        if (typeof slashExt.options.suggestion._origItems === 'function') {
          orig = slashExt.options.suggestion._origItems.call(this, { query }) || [];
        }
        const q = (query || '').toLowerCase().trim();
        const customList = window.__AMIS_CUSTOM_PROMPTS__ || [];

        // Lọc custom prompts theo query hiện tại
        const matchedCustom = customList
          .filter(p => !q || (p.trigger && p.trigger.toLowerCase().includes(q)) || (p.title && p.title.toLowerCase().includes(q)))
          .map(p => ({
            command: p.trigger.endsWith(' ') ? p.trigger : p.trigger + ' ',
            description: p.title || '',
            payload: p.trigger.trim(),
            isCustom: true
          }));

        // Trả về custom prompts trước, sau đó là các lệnh gốc của MISA
        return [...matchedCustom, ...(Array.isArray(orig) ? orig : [])];
      } catch (err) {
        console.error('[AMIS Prompts] Lỗi trong items():', err);
        return [];
      }
    };

    // Ghi đè hàm command khi người dùng chọn lệnh (Enter hoặc Click)
    slashExt.options.suggestion.command = function ({ editor, range, props }) {
      try {
        if (props && props.isCustom) {
          const trigger = (props.command || props.payload || '').trim();
          editor.chain().focus().deleteRange(range).insertContent([
            { type: 'text', text: trigger, marks: [{ type: 'bold' }] },
            { type: 'text', text: ' ' }
          ]).run();
        } else if (typeof slashExt.options.suggestion._origCommand === 'function') {
          slashExt.options.suggestion._origCommand.call(this, { editor, range, props });
        }
      } catch (err) {
        console.error('[AMIS Prompts] Lỗi trong command():', err);
      }
    };

    // Tái đăng ký plugin DUY NHẤT 1 LẦN để TipTap áp dụng items mới
    try {
      ed.unregisterPlugin('slashCommand');
      const [newPlugin] = slashExt.config.addProseMirrorPlugins.call({
        name: slashExt.name,
        options: slashExt.options,
        storage: slashExt.storage,
        editor: ed,
        type: slashExt.type
      });

      if (newPlugin) {
        ed.registerPlugin(newPlugin);
        console.log('[AMIS Prompts] Đã hook TipTap Slash Command thành công (Active & Persistent)');
        return true;
      }
    } catch (err) {
      console.error('[AMIS Prompts] Lỗi đăng ký plugin:', err);
    }

    return false;
  }

  // Khởi động: Thử hook cho đến khi editor xuất hiện (tối đa 20 lần = 10s)
  let attempts = 0;
  const initTimer = setInterval(() => {
    attempts++;
    if (hookTipTapEditor() || attempts >= 20) {
      clearInterval(initTimer);
    }
  }, 500);

  // Khi người dùng chuyển cuộc hội thoại khác trong MISA, kiểm tra hook nếu có editor mới
  document.addEventListener('click', () => {
    setTimeout(() => {
      const el = document.querySelector('.tiptap.ProseMirror');
      if (el && el.editor && !el.editor.__amis_slash_hooked__) {
        hookTipTapEditor();
      }
    }, 400);
  });

  function insertTriggerDirectly(trigger) {
    if (!trigger) return;
    const el = document.querySelector('.tiptap.ProseMirror');
    if (!el) return;
    el.focus();
    const cleanTrigger = trigger.trim();

    if (el.editor && !el.editor.isDestroyed) {
      el.editor.commands.clearContent();
      try {
        el.editor.chain().focus().insertContent([
          { type: 'text', text: cleanTrigger, marks: [{ type: 'bold' }] },
          { type: 'text', text: ' ' }
        ]).run();
      } catch (e) {
        el.editor.chain().focus().insertContent(cleanTrigger + ' ').run();
      }
    } else {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, cleanTrigger + ' ');
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
})();
