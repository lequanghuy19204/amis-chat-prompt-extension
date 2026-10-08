/**
 * AMIS Chat Prompts - Popup Script
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
let prompts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadPrompts();

  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    renderPrompts(searchInput.value.trim());
  });

  // Open Options Page
  document.getElementById('btn-open-options').addEventListener('click', () => {
    if (browserAPI.runtime.openOptionsPage) {
      browserAPI.runtime.openOptionsPage();
    } else {
      window.open(browserAPI.runtime.getURL('options/options.html'));
    }
  });

  // Toggle Quick Add Form
  const addForm = document.getElementById('quick-add-form');
  const btnAdd = document.getElementById('btn-add-quick');
  const btnCancel = document.getElementById('btn-cancel-add');
  const btnSave = document.getElementById('btn-save-new');

  btnAdd.addEventListener('click', () => {
    addForm.classList.toggle('hidden');
    if (!addForm.classList.contains('hidden')) {
      document.getElementById('new-trigger').focus();
    }
  });

  btnCancel.addEventListener('click', () => {
    addForm.classList.add('hidden');
    clearAddForm();
  });

  btnSave.addEventListener('click', async () => {
    const trigger = document.getElementById('new-trigger').value.trim();
    const title = document.getElementById('new-title').value.trim();

    if (!trigger) {
      alert('Vui lòng nhập Phím tắt (Trigger)!');
      return;
    }

    const newPrompt = {
      id: 'p-' + Date.now(),
      trigger: trigger,
      title: title || ''
    };

    prompts.unshift(newPrompt);
    await savePrompts();
    clearAddForm();
    addForm.classList.add('hidden');
    renderPrompts('');
  });
});

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

async function loadPrompts() {
  try {
    const storage = browserAPI.storage.sync || browserAPI.storage.local;
    const res = await storage.get(['amis_prompts']);
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
      } catch (e) {}

      prompts = initialPrompts;
      await storage.set({ amis_prompts: initialPrompts });
    } else {
      prompts = res.amis_prompts;
    }
    renderPrompts('');
  } catch (err) {
    console.error('Lỗi tải prompts:', err);
  }
}

async function savePrompts() {
  const storage = browserAPI.storage.sync || browserAPI.storage.local;
  await storage.set({ amis_prompts: prompts });
}

function clearAddForm() {
  document.getElementById('new-trigger').value = '';
  document.getElementById('new-title').value = '';
}

function renderPrompts(keyword) {
  const container = document.getElementById('prompts-container');
  const q = keyword.toLowerCase();

  const filtered = prompts.filter(p => {
    if (!q) return true;
    return (p.trigger || '').toLowerCase().includes(q) ||
           (p.title || '').toLowerCase().includes(q);
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Không có prompt nào phù hợp. Bấm "Thêm Prompt Mới" để tạo!
      </div>
    `;
    return;
  }

  filtered.forEach(p => {
    const actualIdx = prompts.findIndex(item => item.id === p.id);
    const item = document.createElement('div');
    item.className = 'prompt-item';
    item.innerHTML = `
      <div class="item-top">
        <span class="item-trigger">${escapeHtml(p.trigger)}</span>
        <div class="item-actions">
          <button class="action-btn btn-up" title="Đẩy lên" ${actualIdx === 0 ? 'disabled' : ''}>▲</button>
          <button class="action-btn btn-down" title="Đẩy xuống" ${actualIdx === prompts.length - 1 ? 'disabled' : ''}>▼</button>
          <button class="action-btn btn-copy" title="Copy phím tắt vào bộ nhớ tạm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="action-btn btn-insert" title="Chèn phím tắt vào khung chat AMIS">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </button>
        </div>
      </div>
      ${p.title ? `<div class="item-title">${escapeHtml(p.title)}</div>` : ''}
    `;

    // Move Up
    item.querySelector('.btn-up')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (actualIdx > 0) {
        const [moved] = prompts.splice(actualIdx, 1);
        prompts.splice(actualIdx - 1, 0, moved);
        await savePrompts();
        renderPrompts(document.getElementById('search-input').value.trim());
      }
    });

    // Move Down
    item.querySelector('.btn-down')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (actualIdx < prompts.length - 1) {
        const [moved] = prompts.splice(actualIdx, 1);
        prompts.splice(actualIdx + 1, 0, moved);
        await savePrompts();
        renderPrompts(document.getElementById('search-input').value.trim());
      }
    });

    // Copy trigger to clipboard
    item.querySelector('.btn-copy').addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(p.trigger);
      const btn = e.currentTarget;
      btn.style.color = '#10b981';
      setTimeout(() => btn.style.color = '', 1000);
    });

    // Insert trigger into active AMIS tab
    item.querySelector('.btn-insert').addEventListener('click', async (e) => {
      e.stopPropagation();
      await insertIntoActiveTab(p.trigger);
    });

    // Click item inserts trigger
    item.addEventListener('click', async () => {
      await insertIntoActiveTab(p.trigger);
    });

    container.appendChild(item);
  });
}

async function insertIntoActiveTab(content) {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;
    const activeTab = tabs[0];

    if (!activeTab.url || !activeTab.url.includes('misajsc.amis.vn')) {
      // Not on AMIS tab, copy to clipboard instead
      await navigator.clipboard.writeText(content);
      alert('Đã copy prompt vào clipboard (Do bạn không ở tab chat AMIS)!');
      return;
    }

    try {
      await browserAPI.tabs.sendMessage(activeTab.id, {
        action: 'INSERT_PROMPT',
        content: content
      });
    } catch (sendErr) {
      if (browserAPI.scripting && browserAPI.scripting.executeScript) {
        await browserAPI.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: (text) => {
            window.postMessage({
              target: 'AMIS_PAGE_SCRIPT',
              action: 'INSERT_PROMPT',
              content: text,
              replaceSlash: true
            }, '*');
          },
          args: [content]
        });
      }
    }

    window.close();
  } catch (err) {
    console.error('Lỗi chèn prompt vào tab:', err);
    await navigator.clipboard.writeText(content);
    alert('Đã copy prompt vào clipboard!');
  }
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
