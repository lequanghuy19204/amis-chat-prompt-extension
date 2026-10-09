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
  window.__AMIS_CAPTURED_API__ = null;

  // Khởi động bộ bắt trace request mạng (API Sniffer)
  initNetworkTracer();

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
    } else if (event.data.action === 'INSERT_AND_SUBMIT') {
      insertAndSubmit(event.data.trigger || event.data.content);
    } else if (event.data.action === 'EXECUTE_SEND_API') {
      handleExecuteSendApi(event.data.customContent, event.data.cachedApi, event.data.requestId);
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

  function insertAndSubmit(trigger) {
    insertTriggerDirectly(trigger);
    setTimeout(() => {
      // 1. Thử click nút gửi của giao diện MISA Chat
      const sendBtn = document.querySelector('button.btn-send, button[title*="Gửi"], button[aria-label*="Gửi"], .send-icon-wrapper, .chat-send-btn, [class*="send"] button');
      if (sendBtn) {
        sendBtn.click();
        return;
      }

      // 2. Fallback: Mô phỏng phím Enter trên TipTap
      const el = document.querySelector('.tiptap.ProseMirror');
      if (el) {
        el.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));
      }
    }, 350);
  }

  /* ============================================================
     BỘ TRACE & BẮT API GỬI TIN NHẮN (NETWORK TRACER)
     ============================================================ */

  function initNetworkTracer() {
    if (window.__AMIS_NETWORK_TRACED__) return;
    window.__AMIS_NETWORK_TRACED__ = true;

    // 1. Hook window.fetch (Hỗ trợ cả String URL và Request Object)
    const origFetch = window.fetch;
    window.fetch = async function (resource, config) {
      try {
        let url = '';
        let method = 'GET';
        let headers = config?.headers;
        let body = config?.body;

        if (typeof resource === 'string') {
          url = resource;
          method = (config?.method || 'GET').toUpperCase();
        } else if (resource && typeof resource === 'object') {
          url = resource.url || '';
          method = (config?.method || resource.method || 'GET').toUpperCase();
          headers = headers || resource.headers;
          if (!body && typeof resource.clone === 'function') {
            try { body = await resource.clone().text(); } catch (e) {}
          }
        }

        if (method === 'POST' || method === 'PUT') {
          inspectAndCaptureRequest(url, method, headers, body);
        }
      } catch (e) {}
      return origFetch.apply(this, arguments);
    };

    // 2. Hook XMLHttpRequest (Bắt Axios / XHR)
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__amis_req = { method: (method || 'GET').toUpperCase(), url: url, headers: {} };
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
      if (this.__amis_req && this.__amis_req.headers) {
        this.__amis_req.headers[header] = value;
      }
      return origSetHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      try {
        if (this.__amis_req && (this.__amis_req.method === 'POST' || this.__amis_req.method === 'PUT')) {
          inspectAndCaptureRequest(this.__amis_req.url, this.__amis_req.method, this.__amis_req.headers, body);
        }
      } catch (e) {}
      return origSend.apply(this, arguments);
    };

    console.log('%c[AMIS Tracer] Network interceptor đã kích hoạt', 'background:#10b981;color:#fff;padding:2px 6px;border-radius:4px');
  }

  function inspectAndCaptureRequest(url, method, rawHeaders, body) {
    if (!url || !method) return;
    const methodUpper = method.toUpperCase();
    if (methodUpper !== 'POST' && methodUpper !== 'PUT') return;

    if (url.match(/\.(png|jpg|jpeg|gif|svg|css|woff2?|js)(\?.*)?$/i)) return;

    let parsedBody = null;
    if (typeof body === 'string') {
      try { parsedBody = JSON.parse(body); } catch (e) { parsedBody = body; }
    } else if (body && typeof FormData !== 'undefined' && body instanceof FormData) {
      parsedBody = {};
      for (const [k, v] of body.entries()) {
        parsedBody[k] = typeof v === 'string' ? v : '[File]';
      }
    } else if (body && typeof body === 'object') {
      parsedBody = body;
    }

    let fullUrl = url;
    try { fullUrl = new URL(url, window.location.href).href; } catch (e) {}
    const headersObj = normalizeHeaders(rawHeaders);

    const urlLower = fullUrl.toLowerCase();
    const isIgnored = urlLower.includes('/log/') ||
                      urlLower.includes('/userbrowsertoken') ||
                      urlLower.includes('/status-new') ||
                      urlLower.includes('/users-info') ||
                      urlLower.includes('/monitor/') ||
                      urlLower.includes('/conversation-members/');

    const isMessageSend = (urlLower.includes('/messages/send') || (parsedBody && parsedBody.conversationId && parsedBody.content !== undefined)) && !isIgnored;

    let textFieldPath = null;
    if (parsedBody && typeof parsedBody === 'object') {
      textFieldPath = findTextFieldInObject(parsedBody);
    }

    const capturedInfo = {
      url: fullUrl,
      method: methodUpper,
      headers: headersObj,
      bodyTemplate: parsedBody || body,
      textFieldPath: textFieldPath || 'content',
      conversationUrl: window.location.href,
      isMessageSend: isMessageSend,
      capturedAt: Date.now()
    };

    // Bất kỳ POST request nào không phải log rác cũng lưu vào Recent Requests
    if (!isIgnored) {
      window.postMessage({
        target: 'AMIS_CONTENT_SCRIPT',
        action: 'RECENT_POST_REQUEST',
        data: capturedInfo
      }, '*');
    }

    // Nếu thỏa điều kiện là request gửi tin nhắn thật sự
    if (isMessageSend) {
      window.__AMIS_CAPTURED_API__ = capturedInfo;

      console.log(
        '%c[AMIS Tracer] 🎯 ĐÃ BẮT ĐƯỢC CHÍNH XÁC API GỬI TIN NHẮN CỦA MISA!',
        'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      );
      console.log('📌 Endpoint:', fullUrl);
      console.log('📌 Headers:', headersObj);
      console.log('📌 Payload Body:', parsedBody || body);

      window.postMessage({
        target: 'AMIS_CONTENT_SCRIPT',
        action: 'CAPTURED_API_REQUEST',
        data: capturedInfo
      }, '*');
    }
  }

  function normalizeHeaders(raw) {
    const res = {};
    if (!raw) return res;
    if (raw instanceof Headers) {
      raw.forEach((val, key) => { res[key] = val; });
    } else if (Array.isArray(raw)) {
      raw.forEach(([k, v]) => { res[k] = v; });
    } else if (typeof raw === 'object') {
      Object.assign(res, raw);
    }
    return res;
  }

  function findTextFieldInObject(obj, prefix = '') {
    if (!obj) return null;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const found = findTextFieldInObject(obj[i], prefix ? `${prefix}.${i}` : `${i}`);
        if (found) return found;
      }
      return null;
    }
    if (typeof obj !== 'object') return null;
    const candidates = ['content', 'message', 'text', 'comment', 'body', 'messageContent', 'plainText', 'prompt', 'query', 'question', 'input', 'userMessage', 'rawText', 'command', 'data'];
    for (const key of candidates) {
      if (key in obj && typeof obj[key] === 'string' && obj[key].trim()) {
        return prefix ? `${prefix}.${key}` : key;
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !prefix.includes('.')) {
        const nested = findTextFieldInObject(v, prefix ? `${prefix}.${k}` : k);
        if (nested) return nested;
      }
    }
    return null;
  }

  function setDeepValue(obj, path, value) {
    if (!obj || !path) return;
    const parts = path.split('.');
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;
  }

  async function handleExecuteSendApi(content, cachedApi, requestId) {
    let api = window.__AMIS_CAPTURED_API__ || cachedApi;

    if (!api || !api.url) {
      // Fallback: nếu chưa có API nhưng có TipTap editor trên trang
      const el = document.querySelector('.tiptap.ProseMirror');
      if (el) {
        console.log('[AMIS API Send] Chưa có API đã lưu, sử dụng mô phỏng giao diện TipTap');
        insertAndSubmit(content);
        window.postMessage({
          target: 'AMIS_CONTENT_SCRIPT',
          action: 'API_SEND_RESULT',
          requestId: requestId,
          result: { success: true, simulated: true, status: 200, statusText: 'Simulated TipTap Submit' }
        }, '*');
        return;
      }

      window.postMessage({
        target: 'AMIS_CONTENT_SCRIPT',
        action: 'API_SEND_RESULT',
        requestId: requestId,
        result: {
          success: false,
          error: 'Chưa bắt được API MISA. Vui lòng mở chat MISA và gửi 1 tin nhắn để hệ thống ghi nhớ.'
        }
      }, '*');
      return;
    }

    try {
      let bodyToSend;
      if (typeof api.bodyTemplate === 'string') {
        try {
          bodyToSend = JSON.parse(api.bodyTemplate);
        } catch (e) {
          bodyToSend = api.bodyTemplate;
        }
      } else {
        bodyToSend = JSON.parse(JSON.stringify(api.bodyTemplate || {}));
      }

      if (bodyToSend && typeof bodyToSend === 'object') {
        let textVal = content;
        if (api.url.includes('/messages/send') && !textVal.startsWith('<p>')) {
          textVal = `<p>${textVal}</p>`;
        }
        if (api.textFieldPath) {
          setDeepValue(bodyToSend, api.textFieldPath, textVal);
        } else {
          bodyToSend.content = textVal;
        }
        if (bodyToSend.messageId !== undefined) {
          bodyToSend.messageId = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      }

      const headersToSend = { ...api.headers };
      delete headersToSend['content-length'];
      delete headersToSend['Content-Length'];
      delete headersToSend['host'];
      delete headersToSend['Host'];

      console.log('[AMIS API Send] 🚀 Đang gửi tin nhắn qua HTTP POST ngầm:', api.url);

      const resp = await fetch(api.url, {
        method: api.method || 'POST',
        headers: headersToSend,
        body: typeof bodyToSend === 'string' ? bodyToSend : JSON.stringify(bodyToSend),
        credentials: 'include'
      });

      const isOk = resp.ok;
      let respSnippet = '';
      try {
        const text = await resp.text();
        respSnippet = text.slice(0, 300);
      } catch (e) {}

      window.postMessage({
        target: 'AMIS_CONTENT_SCRIPT',
        action: 'API_SEND_RESULT',
        requestId: requestId,
        result: {
          success: isOk,
          status: resp.status,
          statusText: resp.statusText,
          response: respSnippet
        }
      }, '*');
    } catch (err) {
      console.error('[AMIS API Send] Lỗi gọi API:', err);
      window.postMessage({
        target: 'AMIS_CONTENT_SCRIPT',
        action: 'API_SEND_RESULT',
        requestId: requestId,
        result: {
          success: false,
          error: err.message
        }
      }, '*');
    }
  }
})();
