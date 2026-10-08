/**
 * AMIS Chat Custom Prompts - Content Script
 * Chạy trên https://misajsc.amis.vn/*
 */

(function () {
  console.log('[AMIS Prompts] Content Script v1.2.0 đã nạp');

  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  let customPrompts = [];
  let extensionSettings = {
    enableSlashOverride: true
  };

  // State biến cho Modal Quick Picker (khai báo trên cùng để tránh Temporal Dead Zone)
  let modalBackdrop = null;
  let modalSearchInput = null;
  let modalListContainer = null;
  let filteredModalPrompts = [];
  let selectedModalIndex = 0;

  const DEFAULT_PRESETS = [
    {
      "id": "p-1791474171733",
      "trigger": "/goal",
      "title": "goal"
    },
    {
      "id": "p-1791474086141",
      "trigger": "/swe-kham-pha-code",
      "title": "kham-pha-code"
    },
    {
      "id": "p-1791473326288",
      "trigger": "/prompt 3",
      "title": "prompt3.md"
    },
    {
      "id": "p-1791473259238",
      "trigger": "/prompt 2",
      "title": "prompt2.md"
    },
    {
      "id": "p-1791473246090",
      "trigger": "/prompt 1",
      "title": "prompt1.md"
    }
  ];

  // 1. Inject script vào Main World
  injectPageScript();

  // 2. Nạp dữ liệu từ storage
  loadPromptsAndSettings();

  // 3. Lắng nghe thay đổi Storage
  if (browserAPI.storage && browserAPI.storage.onChanged) {
    browserAPI.storage.onChanged.addListener((changes) => {
      if (changes.amis_prompts) {
        customPrompts = changes.amis_prompts.newValue || [];
        sendPromptsToPageScript();
      }
      if (changes.amis_settings) {
        extensionSettings = Object.assign(extensionSettings, changes.amis_settings.newValue || {});
      }
    });
  }

  // 4. Lắng nghe tín hiệu từ Page Script (amis-inject.js)
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.target !== 'AMIS_CONTENT_SCRIPT') return;

    if (event.data.action === 'PAGE_SCRIPT_READY') {
      sendPromptsToPageScript();
    }
  });

  // 5. Dọn dẹp nút toolbar cũ nếu có
  document.querySelectorAll('.amis-quick-prompt-btn').forEach(b => b.remove());

  // 6. Khởi tạo Modal Quick Picker (Alt + P)
  initPromptModal();

  // 7. Nhận message từ Popup
  if (browserAPI.runtime && browserAPI.runtime.onMessage) {
    browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg && msg.action === 'INSERT_PROMPT') {
        executeInsertPrompt(msg.content);
        if (sendResponse) sendResponse({ success: true });
        return true;
      }
    });
  }

  /* ============================================================
     HÀM XỬ LÝ CHÍNH
     ============================================================ */

  function injectPageScript() {
    try {
      const script = document.createElement('script');
      script.src = browserAPI.runtime.getURL('content/amis-inject.js');
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
    } catch (err) {
      console.error('[AMIS Prompts] Lỗi inject script:', err);
    }
  }

  async function loadPromptsAndSettings() {
    try {
      const storage = browserAPI.storage.sync || browserAPI.storage.local;
      const res = await storage.get(['amis_prompts', 'amis_settings']);
      if (!res.amis_prompts || res.amis_prompts.length === 0) {
        let initialPrompts = DEFAULT_PRESETS;
        try {
          const resp = await fetch(browserAPI.runtime.getURL('amis-prompts-backup.json'));
          if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              initialPrompts = data;
            }
          }
        } catch (fetchErr) {
          // Fallback to DEFAULT_PRESETS
        }

        customPrompts = initialPrompts;
        await storage.set({
          amis_prompts: initialPrompts,
          amis_settings: extensionSettings
        });
      } else {
        customPrompts = res.amis_prompts;
      }
      if (res.amis_settings) {
        extensionSettings = Object.assign(extensionSettings, res.amis_settings);
      }
      sendPromptsToPageScript();
    } catch (err) {
      console.error('[AMIS Prompts] Lỗi nạp dữ liệu:', err);
    }
  }

  function sendPromptsToPageScript() {
    window.postMessage({
      target: 'AMIS_PAGE_SCRIPT',
      action: 'SET_PROMPTS',
      prompts: customPrompts
    }, '*');
  }

  function executeInsertPrompt(trigger) {
    if (!trigger) return;
    window.postMessage({
      target: 'AMIS_PAGE_SCRIPT',
      action: 'INSERT_PROMPT',
      trigger: trigger
    }, '*');
  }

  /* ============================================================
     MODAL QUICK PROMPT PICKER (ALT + P)
     ============================================================ */

  function initPromptModal() {
    // Phím tắt Alt + P mở modal
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        openPromptModal();
      }
    });

    if (document.querySelector('.amis-prompt-modal-backdrop')) return;

    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'amis-prompt-modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="amis-prompt-modal">
        <div class="amis-modal-header">
          <h3 class="amis-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#4f46e5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Chọn Phím Tắt / Prompt
          </h3>
          <button class="amis-modal-close-btn" title="Đóng (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="amis-modal-search-wrapper">
          <input type="text" class="amis-modal-search-input" placeholder="Gõ để tìm kiếm theo phím tắt hoặc tiêu đề..." autofocus>
        </div>
        <div class="amis-modal-list"></div>
        <div class="amis-modal-footer">
          <span>Dùng phím <b>↑ / ↓</b> để chọn, <b>Enter</b> để chèn, <b>Esc</b> để đóng</span>
          <a class="amis-modal-footer-link" id="amis-open-options-link">⚙️ Quản lý Prompt</a>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    modalSearchInput = modalBackdrop.querySelector('.amis-modal-search-input');
    modalListContainer = modalBackdrop.querySelector('.amis-modal-list');

    modalBackdrop.querySelector('.amis-modal-close-btn').addEventListener('click', closePromptModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closePromptModal();
    });

    modalBackdrop.querySelector('#amis-open-options-link').addEventListener('click', (e) => {
      e.preventDefault();
      browserAPI.runtime.openOptionsPage ? browserAPI.runtime.openOptionsPage() : window.open(browserAPI.runtime.getURL('options/options.html'));
    });

    modalSearchInput.addEventListener('input', () => {
      renderModalList(modalSearchInput.value.trim());
    });

    modalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePromptModal();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateModal(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateModal(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredModalPrompts[selectedModalIndex]) {
          executeInsertPrompt(filteredModalPrompts[selectedModalIndex].trigger);
          closePromptModal();
        }
      }
    });
  }

  function openPromptModal() {
    if (!modalBackdrop) initPromptModal();
    modalBackdrop.classList.add('is-open');
    modalSearchInput.value = '';
    renderModalList('');
    setTimeout(() => modalSearchInput.focus(), 100);
  }

  function closePromptModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('is-open');
      const editorEl = document.querySelector('.tiptap.ProseMirror');
      if (editorEl) editorEl.focus();
    }
  }

  function renderModalList(keyword) {
    const q = keyword.toLowerCase();
    filteredModalPrompts = customPrompts.filter(p => {
      if (!q) return true;
      return (p.trigger || '').toLowerCase().includes(q) ||
             (p.title || '').toLowerCase().includes(q);
    });

    selectedModalIndex = 0;
    modalListContainer.innerHTML = '';

    if (filteredModalPrompts.length === 0) {
      modalListContainer.innerHTML = `
        <div class="amis-modal-empty">
          Không tìm thấy prompt nào phù hợp với từ khóa "${escapeHtml(keyword)}".<br>
          Bấm <b>⚙️ Quản lý Prompt</b> ở dưới để thêm mới!
        </div>
      `;
      return;
    }

    filteredModalPrompts.forEach((prompt, idx) => {
      const card = document.createElement('div');
      card.className = 'amis-prompt-card' + (idx === 0 ? ' is-active' : '');
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="amis-prompt-card-top">
          <span class="amis-prompt-card-trigger">${escapeHtml(prompt.trigger || '')}</span>
          <span class="amis-prompt-card-title">${escapeHtml(prompt.title || '')}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        executeInsertPrompt(prompt.trigger);
        closePromptModal();
      });

      modalListContainer.appendChild(card);
    });
  }

  function navigateModal(direction) {
    if (filteredModalPrompts.length === 0) return;
    const cards = modalListContainer.querySelectorAll('.amis-prompt-card');
    if (cards.length === 0) return;

    cards[selectedModalIndex]?.classList.remove('is-active');
    selectedModalIndex = (selectedModalIndex + direction + cards.length) % cards.length;
    cards[selectedModalIndex]?.classList.add('is-active');
    cards[selectedModalIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
