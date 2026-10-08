/**
 * AMIS Chat Prompts - Options Management Script
 * Chỉ gồm 2 trường: Phím tắt (Trigger Shortcut) & Tiêu đề gợi ý (Title)
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
let prompts = [];
let settings = {
  enableSlashOverride: true
};

const DEFAULT_PRESETS = [
  {
    id: 'p-agent1',
    trigger: '[agent1]',
    title: 'Agent 1 được cấu hình cho Working Directory.'
  },
  {
    id: 'p-agent2',
    trigger: '[agent2]',
    title: 'Agent 2 được cấu hình cho Working Directory.'
  },
  {
    id: 'p-agent3',
    trigger: '[agent3]',
    title: 'Agent 3 được cấu hình cho Working Directory.'
  },
  {
    id: 'p-prompt1',
    trigger: '/prompt1',
    title: 'Prompt 1 tùy chỉnh cá nhân'
  },
  {
    id: 'p-review',
    trigger: '/review',
    title: 'Review Code theo Clean Code & SOLID'
  },
  {
    id: 'p-spec',
    trigger: '/misa-speckit:swe-lap-ke-hoach',
    title: 'Tạo plan.md từ spec.md bằng Agent Team'
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  // Form submit (Add or Edit)
  const form = document.getElementById('prompt-form');
  form.addEventListener('submit', handleFormSubmit);

  // Cancel edit
  document.getElementById('btn-cancel-edit').addEventListener('click', resetForm);

  // Search in list
  document.getElementById('list-search').addEventListener('input', (e) => {
    renderTable(e.target.value.trim());
  });

  // Settings checkboxes
  document.getElementById('setting-slash-override').addEventListener('change', async (e) => {
    settings.enableSlashOverride = e.target.checked;
    await saveSettings();
  });

  // Sort A-Z
  document.getElementById('btn-sort-az').addEventListener('click', async () => {
    prompts.sort((a, b) => (a.trigger || '').localeCompare(b.trigger || '', 'vi', { sensitivity: 'base' }));
    await savePrompts();
    renderTable(document.getElementById('list-search').value.trim());
    showToast('Đã sắp xếp phím tắt theo thứ tự A → Z');
  });

  // Export JSON
  document.getElementById('btn-export-json').addEventListener('click', exportJson);

  // Import JSON
  const importInput = document.getElementById('file-import-input');
  document.getElementById('btn-import-json').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', handleImportJson);

  // Reset default
  document.getElementById('btn-reset-default').addEventListener('click', async () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại danh sách prompt về mẫu mặc định? Các prompt tự thêm sẽ bị ghi đè.')) {
      prompts = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
      await savePrompts();
      renderTable('');
      showToast('Đã khôi phục danh sách mẫu mặc định!');
    }
  });
});

async function loadData() {
  try {
    const storage = browserAPI.storage.sync || browserAPI.storage.local;
    const res = await storage.get(['amis_prompts', 'amis_settings']);
    prompts = res.amis_prompts || DEFAULT_PRESETS;
    if (res.amis_settings) {
      settings = Object.assign(settings, res.amis_settings);
    }

    document.getElementById('setting-slash-override').checked = settings.enableSlashOverride !== false;

    renderTable('');
  } catch (err) {
    console.error('Lỗi loadData:', err);
  }
}

async function savePrompts() {
  const storage = browserAPI.storage.sync || browserAPI.storage.local;
  await storage.set({ amis_prompts: prompts });
  document.getElementById('prompt-count').textContent = prompts.length;
}

async function saveSettings() {
  const storage = browserAPI.storage.sync || browserAPI.storage.local;
  await storage.set({ amis_settings: settings });
  showToast('Đã lưu cấu hình hoạt động');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-id').value;
  const trigger = document.getElementById('prompt-trigger').value.trim();
  const title = document.getElementById('prompt-title').value.trim();

  if (!trigger) {
    alert('Vui lòng nhập Phím tắt (Trigger Shortcut)!');
    return;
  }

  if (editId) {
    // Update existing
    const idx = prompts.findIndex(p => p.id === editId);
    if (idx !== -1) {
      prompts[idx].trigger = trigger;
      prompts[idx].title = title;
      showToast('Đã cập nhật prompt thành công!');
    }
  } else {
    // Add new
    const newPrompt = {
      id: 'p-' + Date.now(),
      trigger: trigger,
      title: title
    };
    prompts.unshift(newPrompt);
    showToast('Đã thêm prompt mới thành công!');
  }

  await savePrompts();
  resetForm();
  renderTable('');
}

function resetForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('prompt-trigger').value = '';
  document.getElementById('prompt-title').value = '';
  document.getElementById('form-title').textContent = 'Thêm Prompt Mới';
  document.getElementById('btn-save-prompt').textContent = 'Lưu Prompt';
  document.getElementById('btn-cancel-edit').classList.add('hidden');
}

function startEditPrompt(id) {
  const p = prompts.find(item => item.id === id);
  if (!p) return;

  document.getElementById('edit-id').value = p.id;
  document.getElementById('prompt-trigger').value = p.trigger;
  document.getElementById('prompt-title').value = p.title;

  document.getElementById('form-title').textContent = 'Chỉnh Sửa Prompt';
  document.getElementById('btn-save-prompt').textContent = 'Cập nhật';
  document.getElementById('btn-cancel-edit').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deletePrompt(id) {
  const p = prompts.find(item => item.id === id);
  if (!p) return;

  if (confirm(`Bạn có chắc muốn xóa prompt "${p.title}" (${p.trigger})?`)) {
    prompts = prompts.filter(item => item.id !== id);
    await savePrompts();
    renderTable('');
    showToast('Đã xóa prompt');
  }
}

let draggedIndex = null;

async function movePrompt(fromIdx, toIdx) {
  if (fromIdx < 0 || fromIdx >= prompts.length || toIdx < 0 || toIdx >= prompts.length) return;
  const [moved] = prompts.splice(fromIdx, 1);
  prompts.splice(toIdx, 0, moved);
  await savePrompts();
  renderTable(document.getElementById('list-search').value.trim());
  showToast('Đã cập nhật thứ tự prompt');
}

function renderTable(keyword) {
  const tbody = document.getElementById('prompts-table-body');
  const countEl = document.getElementById('prompt-count');
  const q = keyword.toLowerCase();

  const filtered = prompts.filter(p => {
    if (!q) return true;
    return (p.trigger || '').toLowerCase().includes(q) ||
           (p.title || '').toLowerCase().includes(q);
  });

  countEl.textContent = filtered.length;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 30px; color: #9ca3af;">
          Không có prompt nào phù hợp
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(p => {
    const actualIdx = prompts.findIndex(item => item.id === p.id);
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    tr.dataset.index = actualIdx;
    tr.draggable = true;

    tr.innerHTML = `
      <td>
        <div class="td-order">
          <span class="drag-handle" title="Giữ chuột kéo để đổi thứ tự">⠿</span>
          <button class="btn-order btn-up" title="Di chuyển lên" ${actualIdx === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn-order btn-down" title="Di chuyển xuống" ${actualIdx === prompts.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
      </td>
      <td><span class="td-trigger">${escapeHtml(p.trigger)}</span></td>
      <td>
        <div class="td-title">${p.title ? escapeHtml(p.title) : '<span style="color: #9ca3af; font-style: italic;">(Không có tiêu đề)</span>'}</div>
      </td>
      <td style="text-align: center;">
        <div class="td-actions">
          <button class="btn-action edit" title="Sửa prompt">✏️</button>
          <button class="btn-action delete" title="Xóa prompt">🗑️</button>
        </div>
      </td>
    `;

    // Nút di chuyển lên / xuống
    tr.querySelector('.btn-up').addEventListener('click', () => movePrompt(actualIdx, actualIdx - 1));
    tr.querySelector('.btn-down').addEventListener('click', () => movePrompt(actualIdx, actualIdx + 1));

    // Nút sửa & xóa
    tr.querySelector('.btn-action.edit').addEventListener('click', () => startEditPrompt(p.id));
    tr.querySelector('.btn-action.delete').addEventListener('click', () => deletePrompt(p.id));

    // Kéo thả (HTML5 Drag and Drop)
    tr.addEventListener('dragstart', (e) => {
      draggedIndex = actualIdx;
      tr.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', actualIdx);
    });

    tr.addEventListener('dragend', () => {
      tr.classList.remove('is-dragging');
      document.querySelectorAll('.drag-target-over').forEach(el => el.classList.remove('drag-target-over'));
      draggedIndex = null;
    });

    tr.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex !== actualIdx) {
        tr.classList.add('drag-target-over');
      }
    });

    tr.addEventListener('dragleave', () => {
      tr.classList.remove('drag-target-over');
    });

    tr.addEventListener('drop', (e) => {
      e.preventDefault();
      tr.classList.remove('drag-target-over');
      if (draggedIndex !== null && draggedIndex !== actualIdx) {
        movePrompt(draggedIndex, actualIdx);
      }
    });

    tbody.appendChild(tr);
  });
}

function exportJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `amis-prompts-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Đã xuất file JSON thành công!');
}

function handleImportJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        const valid = imported.filter(item => item && item.trigger);
        if (valid.length === 0) {
          alert('File JSON không đúng cấu trúc (phải có trường trigger)!');
          return;
        }

        const mode = confirm(`Tìm thấy ${valid.length} prompts trong file.\n\nNhấn OK để GỘP thêm vào danh sách hiện tại.\nNhấn Cancel để GHI ĐÈ toàn bộ danh sách cũ.`);
        if (mode) {
          const existingTriggers = new Set(prompts.map(p => p.trigger));
          valid.forEach(p => {
            if (!existingTriggers.has(p.trigger)) {
              prompts.push(p);
            }
          });
        } else {
          prompts = valid;
        }

        await savePrompts();
        renderTable('');
        showToast(`Đã nạp ${valid.length} prompts thành công!`);
      } else {
        alert('File JSON phải là một mảng danh sách prompts!');
      }
    } catch (err) {
      alert('Lỗi đọc file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
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
