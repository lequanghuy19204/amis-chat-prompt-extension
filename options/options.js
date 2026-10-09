/**
 * AMIS Chat Prompts - Options Management Script
 * Chỉ gồm 2 trường: Phím tắt (Trigger Shortcut) & Tiêu đề gợi ý (Title)
 */

const browserAPI = (typeof browser !== 'undefined' && browser.storage) ? browser : (typeof chrome !== 'undefined' && chrome.storage) ? chrome : {
  storage: {
    sync: { get: async () => ({ amis_prompts: DEFAULT_PRESETS, amis_schedules: [{ id: 'sch-1', enabled: true, time: '21:00', repeat: 'daily', message: '/prompt 1' }] }), set: async () => {}, remove: async () => {} },
    local: { get: async () => ({ amis_captured_api: { url: 'https://misajsc.amis.vn/chat/api/business/v1/messages/send/text-box', method: 'POST', textFieldPath: 'content', capturedAt: Date.now() }, amis_recent_requests: [], amis_schedule_logs: [{ id: '1', time: '2026-10-09 21:00:00', message: '/prompt 1', status: 'success', details: 'Thành công (HTTP 200)' }] }), set: async () => {}, remove: async () => {} }
  },
  runtime: { getURL: (p) => '/' + p }
};
let prompts = [], schedules = [];

const DEFAULT_PRESETS = [
  { id: "p-1", trigger: "/goal", title: "goal" },
  { id: "p-2", trigger: "/swe-kham-pha-code", title: "kham-pha-code" },
  { id: "p-3", trigger: "/prompt 3", title: "prompt3.md" },
  { id: "p-4", trigger: "/prompt 2", title: "prompt2.md" },
  { id: "p-5", trigger: "/prompt 1", title: "prompt1.md" }
];

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  document.getElementById('prompt-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-cancel-edit').addEventListener('click', resetForm);
  document.getElementById('list-search').addEventListener('input', (e) => renderTable(e.target.value.trim()));
  document.getElementById('btn-sort-az').addEventListener('click', async () => {
    prompts.sort((a, b) => (a.trigger || '').localeCompare(b.trigger || '', 'vi', { sensitivity: 'base' }));
    await savePrompts(); renderTable(document.getElementById('list-search').value.trim());
    showToast('Đã sắp xếp phím tắt theo thứ tự A → Z');
  });
  document.getElementById('btn-export-json').addEventListener('click', exportJson);
  const importInput = document.getElementById('file-import-input');
  document.getElementById('btn-import-json').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', handleImportJson);

  document.getElementById('btn-reset-default').addEventListener('click', async () => {
    if (confirm('Đặt lại danh sách prompt về mẫu mặc định (amis-prompts-backup.json)?')) {
      let def = DEFAULT_PRESETS;
      try {
        const resp = await fetch(browserAPI.runtime.getURL('amis-prompts-backup.json'));
        if (resp.ok) { const d = await resp.json(); if (Array.isArray(d) && d.length) def = d; }
      } catch (e) {}
      prompts = JSON.parse(JSON.stringify(def));
      await savePrompts(); renderTable('');
      showToast('Đã khôi phục danh sách mẫu mặc định!');
    }
  });

  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'scheduler' || window.location.hash === '#scheduler') switchTab('tab-scheduler');

  // Scheduler Form & Actions
  document.getElementById('scheduler-form').addEventListener('submit', handleSaveSchedule);
  document.getElementById('btn-cancel-schedule-edit').addEventListener('click', resetScheduleForm);
  document.getElementById('btn-test-send-now').addEventListener('click', () => handleTestSend());
  document.getElementById('btn-copy-curl').addEventListener('click', handleCopyCurl);
  document.getElementById('btn-copy-endpoint-url')?.addEventListener('click', () => {
    const url = document.getElementById('api-detail-url')?.textContent;
    if (url && !url.includes('Chưa có')) { navigator.clipboard.writeText(url); showToast('Đã copy Endpoint URL!'); }
  });
  document.getElementById('btn-clear-api').addEventListener('click', handleClearApi);
  document.getElementById('btn-clear-logs').addEventListener('click', handleClearLogs);

  // Manual cURL
  document.getElementById('btn-toggle-manual-curl').addEventListener('click', () => document.getElementById('manual-curl-form').classList.toggle('hidden'));
  document.getElementById('btn-cancel-curl').addEventListener('click', () => document.getElementById('manual-curl-form').classList.add('hidden'));
  document.getElementById('btn-parse-curl').addEventListener('click', handleParseManualCurl);

  // Storage listener for live update
  if (browserAPI.storage && browserAPI.storage.onChanged) {
    browserAPI.storage.onChanged.addListener((changes) => {
      if (changes.amis_captured_api) {
        renderApiStatus(changes.amis_captured_api.newValue);
      }
      if (changes.amis_recent_requests) {
        renderRecentRequests(changes.amis_recent_requests.newValue || []);
      }
      if (changes.amis_schedule_logs) {
        renderSchedulerLogs(changes.amis_schedule_logs.newValue || []);
      }
    });
  }
});

async function loadData() {
  try {
    const storage = browserAPI.storage.sync || browserAPI.storage.local;
    const res = await storage.get(['amis_prompts', 'amis_settings']);
    if (!res.amis_prompts || res.amis_prompts.length === 0) {
      let initial = DEFAULT_PRESETS;
      try {
        const resp = await fetch(browserAPI.runtime.getURL('amis-prompts-backup.json'));
        if (resp.ok) { const d = await resp.json(); if (Array.isArray(d) && d.length) initial = d; }
      } catch (e) {}
      prompts = initial;
      await storage.set({ amis_prompts: initial });
    } else {
      prompts = res.amis_prompts;
    }
    renderTable('');
  } catch (err) { console.error('Lỗi loadData:', err); }
}

async function savePrompts() {
  const storage = browserAPI.storage.sync || browserAPI.storage.local;
  await storage.set({ amis_prompts: prompts });
  const countEl = document.getElementById('prompt-count');
  if (countEl) countEl.textContent = prompts.length;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-id').value;
  const trigger = document.getElementById('prompt-trigger').value.trim();
  const title = document.getElementById('prompt-title').value.trim();
  if (!trigger) return alert('Vui lòng nhập Phím tắt (Trigger Shortcut)!');

  if (editId) {
    const idx = prompts.findIndex(p => p.id === editId);
    if (idx !== -1) { prompts[idx].trigger = trigger; prompts[idx].title = title; showToast('Đã cập nhật prompt thành công!'); }
  } else {
    prompts.unshift({ id: 'p-' + Date.now(), trigger, title });
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
    tr.dataset.id = p.id; tr.dataset.index = actualIdx; tr.draggable = true;
    tr.innerHTML = `
      <td><div class="td-order"><span class="drag-handle" title="Kéo để đổi thứ tự">⠿</span><button class="btn-order btn-up" title="Lên" ${actualIdx === 0 ? 'disabled' : ''}>▲</button><button class="btn-order btn-down" title="Xuống" ${actualIdx === prompts.length - 1 ? 'disabled' : ''}>▼</button></div></td>
      <td><span class="td-trigger">${escapeHtml(p.trigger)}</span></td>
      <td><div class="td-title">${p.title ? escapeHtml(p.title) : '<span style="color:#9ca3af;font-style:italic;">(Không có tiêu đề)</span>'}</div></td>
      <td style="text-align:center;"><div class="td-actions"><button class="btn-action edit" title="Sửa">✏️</button><button class="btn-action delete" title="Xóa">🗑️</button></div></td>
    `;
    tr.querySelector('.btn-up').addEventListener('click', () => movePrompt(actualIdx, actualIdx - 1));
    tr.querySelector('.btn-down').addEventListener('click', () => movePrompt(actualIdx, actualIdx + 1));
    tr.querySelector('.btn-action.edit').addEventListener('click', () => startEditPrompt(p.id));
    tr.querySelector('.btn-action.delete').addEventListener('click', () => deletePrompt(p.id));
    tr.addEventListener('dragstart', (e) => { draggedIndex = actualIdx; tr.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', actualIdx); });
    tr.addEventListener('dragend', () => { tr.classList.remove('is-dragging'); document.querySelectorAll('.drag-target-over').forEach(el => el.classList.remove('drag-target-over')); draggedIndex = null; });
    tr.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (draggedIndex !== actualIdx) tr.classList.add('drag-target-over'); });
    tr.addEventListener('dragleave', () => tr.classList.remove('drag-target-over'));
    tr.addEventListener('drop', (e) => { e.preventDefault(); tr.classList.remove('drag-target-over'); if (draggedIndex !== null && draggedIndex !== actualIdx) movePrompt(draggedIndex, actualIdx); });
    tbody.appendChild(tr);
  });
}

function exportJson() {
  const dl = document.createElement('a');
  dl.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
  dl.download = `amis-prompts-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(dl); dl.click(); dl.remove();
  showToast('Đã xuất file JSON thành công!');
}

function handleImportJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) return alert('File JSON phải là một mảng danh sách prompts!');
      const valid = imported.filter(item => item && item.trigger);
      if (!valid.length) return alert('File JSON không đúng cấu trúc (phải có trigger)!');
      const mode = confirm(`Tìm thấy ${valid.length} prompts.\n\nNhấn OK để GỘP vào danh sách hiện tại.\nNhấn Cancel để GHI ĐÈ toàn bộ.`);
      if (mode) {
        const exist = new Set(prompts.map(p => p.trigger));
        valid.forEach(p => { if (!exist.has(p.trigger)) prompts.push(p); });
      } else { prompts = valid; }
      await savePrompts(); renderTable('');
      showToast(`Đã nạp ${valid.length} prompts thành công!`);
    } catch (err) { alert('Lỗi đọc file JSON: ' + err.message); }
  };
  reader.readAsText(file); e.target.value = '';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg; toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function escapeHtml(str) {
  return str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
}

/* ============================================================
   XỬ LÝ TAB & HẸN GIỜ (SCHEDULER & API MANAGEMENT)
   ============================================================ */

let currentCapturedApi = null;

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== tabId));
  if (tabId === 'tab-scheduler') {
    loadSchedulerData();
  }
}

async function loadSchedulerData() {
  const localRes = await browserAPI.storage.local.get(['amis_captured_api', 'amis_recent_requests', 'amis_schedule_logs']);
  const syncStore = browserAPI.storage.sync || browserAPI.storage.local;
  const syncRes = await syncStore.get(['amis_schedules', 'amis_schedule_config']);

  let list = syncRes.amis_schedules;
  if (!Array.isArray(list)) {
    list = syncRes.amis_schedule_config ? [{ id: 'sch-1', ...syncRes.amis_schedule_config }] : [
      { id: 'sch-1', enabled: true, time: '21:00', repeat: 'daily', message: '/prompt 1' }
    ];
    await syncStore.set({ amis_schedules: list });
  }
  schedules = list;
  renderSchedulesTable();
  renderQuickTags();
  renderApiStatus(localRes.amis_captured_api);
  renderRecentRequests(localRes.amis_recent_requests || []);
  renderSchedulerLogs(localRes.amis_schedule_logs || []);
}

function renderSchedulesTable() {
  const tbody = document.getElementById('schedules-table-body'), countEl = document.getElementById('schedules-count');
  if (countEl) countEl.textContent = schedules.length;
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!schedules.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#9ca3af;">Chưa có lịch hẹn nào. Hãy thêm ở bên trái!</td></tr>';
    return;
  }
  schedules.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align:center;"><label class="toggle-container" style="justify-content:center;"><input type="checkbox" class="sch-toggle" ${s.enabled ? 'checked' : ''}><span class="toggle-slider"></span></label></td>
      <td><span style="font-family:monospace;font-weight:700;font-size:13px;color:#1e1b4b;">⏰ ${escapeHtml(s.time)}</span></td>
      <td><span style="font-size:12px;color:#4b5563;">${s.repeat === 'once' ? '1 lần' : 'Hàng ngày'}</span></td>
      <td><span class="td-trigger">${escapeHtml(s.message)}</span></td>
      <td style="text-align:center;"><div class="td-actions"><button class="btn-action test" title="Gửi thử">🚀</button><button class="btn-action edit" title="Sửa">✏️</button><button class="btn-action delete" title="Xóa">🗑️</button></div></td>
    `;
    tr.querySelector('.sch-toggle').addEventListener('change', () => toggleSchedule(s.id));
    tr.querySelector('.test').addEventListener('click', () => handleTestSend(s.message));
    tr.querySelector('.edit').addEventListener('click', () => startEditSchedule(s.id));
    tr.querySelector('.delete').addEventListener('click', () => deleteSchedule(s.id));
    tbody.appendChild(tr);
  });
}

async function saveSchedules() {
  const syncStore = browserAPI.storage.sync || browserAPI.storage.local;
  await syncStore.set({ amis_schedules: schedules });
  renderSchedulesTable();
}

async function toggleSchedule(id) {
  const s = schedules.find(x => x.id === id);
  if (!s) return;
  s.enabled = !s.enabled;
  await saveSchedules();
  showToast(s.enabled ? `Đã BẬT hẹn giờ ${s.time}` : `Đã TẮT hẹn giờ ${s.time}`);
}

function startEditSchedule(id) {
  const s = schedules.find(x => x.id === id);
  if (!s) return;
  document.getElementById('edit-schedule-id').value = s.id;
  document.getElementById('schedule-time').value = s.time || '21:00';
  document.getElementById('schedule-repeat').value = s.repeat || 'daily';
  document.getElementById('schedule-message').value = s.message || '/prompt 1';
  document.getElementById('schedule-form-title').textContent = '✏️ Chỉnh Sửa Hẹn Giờ';
  document.getElementById('btn-save-schedule').textContent = 'Cập nhật';
  document.getElementById('btn-cancel-schedule-edit').classList.remove('hidden');
}

function resetScheduleForm() {
  document.getElementById('edit-schedule-id').value = '';
  document.getElementById('schedule-time').value = '21:00';
  document.getElementById('schedule-repeat').value = 'daily';
  document.getElementById('schedule-message').value = '/prompt 1';
  document.getElementById('schedule-form-title').textContent = '➕ Thêm Hẹn Giờ Mới';
  document.getElementById('btn-save-schedule').textContent = 'Lưu Lịch Hẹn';
  document.getElementById('btn-cancel-schedule-edit').classList.add('hidden');
}

async function deleteSchedule(id) {
  const s = schedules.find(x => x.id === id);
  if (!s) return;
  if (confirm(`Xóa lịch hẹn giờ "${s.time}" (${s.message})?`)) {
    schedules = schedules.filter(x => x.id !== id);
    await saveSchedules();
    if (document.getElementById('edit-schedule-id').value === id) resetScheduleForm();
    showToast('Đã xóa lịch hẹn');
  }
}

async function handleSaveSchedule(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-schedule-id').value, time = document.getElementById('schedule-time').value, repeat = document.getElementById('schedule-repeat').value, message = document.getElementById('schedule-message').value.trim();
  if (!time) return alert('Vui lòng chọn giờ gửi!');
  if (!message) return alert('Vui lòng nhập nội dung muốn gửi!');
  if (editId) {
    const s = schedules.find(x => x.id === editId);
    if (s) { s.time = time; s.repeat = repeat; s.message = message; }
    showToast(`Đã cập nhật hẹn giờ lúc ${time}`);
  } else {
    schedules.push({ id: 'sch-' + Date.now(), enabled: true, time, repeat, message });
    showToast(`Đã thêm hẹn giờ lúc ${time}`);
  }
  await saveSchedules();
  resetScheduleForm();
}

async function handleTestSend(customMsg) {
  const message = (typeof customMsg === 'string' && customMsg.trim()) ? customMsg.trim() : (document.getElementById('schedule-message').value.trim() || '/prompt 1');
  showToast(`Đang gửi thử "${message}" qua API...`);
  try {
    const tabs = await browserAPI.tabs.query({ url: '*://misajsc.amis.vn/*' });
    if (!tabs || !tabs.length) return alert('Không tìm thấy tab MISA Chat nào đang mở!\nVui lòng mở trang chat misajsc.amis.vn trước khi test.');
    const resp = await browserAPI.tabs.sendMessage(tabs[0].id, { action: 'TEST_SEND_API', message, cachedApi: currentCapturedApi });
    if (resp && resp.success) { showToast(`🎉 Gửi thử thành công (HTTP ${resp.status || 200})! Hãy kiểm tra chat MISA.`); }
    else { alert(`Gửi thất bại: ${(resp && resp.error) || 'Lỗi không xác định'}`); }
    loadSchedulerData();
  } catch (err) { alert('Không thể kết nối với tab MISA Chat. Hãy tải lại tab chat MISA và thử lại: ' + err.message); }
}

function renderRecentRequests(recents) {
  const box = document.getElementById('recent-requests-box'), list = document.getElementById('recent-requests-list');
  if (!box || !list) return;
  if (!recents || !recents.length) return box.classList.add('hidden');
  box.classList.remove('hidden'); list.innerHTML = '';
  recents.forEach(r => {
    const item = document.createElement('div');
    item.style.cssText = 'background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;';
    item.innerHTML = `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;"><span style="font-weight:700;color:#4f46e5;font-family:monospace;">${r.method || 'POST'}</span> <span style="color:#111827;font-family:monospace;">${escapeHtml(r.url)}</span></div><button class="btn btn-outline btn-sm btn-use" style="padding:2px 8px;font-size:11px;flex-shrink:0;">✅ Dùng API này</button>`;
    item.querySelector('.btn-use').addEventListener('click', async () => {
      await browserAPI.storage.local.set({ amis_captured_api: r });
      renderApiStatus(r); showToast('Đã chọn request này làm API gửi tin nhắn!');
    });
    list.appendChild(item);
  });
}

async function handleParseManualCurl() {
  const curlText = document.getElementById('manual-curl-input').value.trim();
  if (!curlText) return alert('Vui lòng dán lệnh cURL vào ô text!');
  const parsed = parseCurlCommand(curlText);
  if (!parsed) return alert('Không thể phân tích cú pháp lệnh cURL này. Hãy kiểm tra định dạng!');
  await browserAPI.storage.local.set({ amis_captured_api: parsed });
  renderApiStatus(parsed);
  document.getElementById('manual-curl-form').classList.add('hidden');
  document.getElementById('manual-curl-input').value = '';
  showToast('🎉 Đã phân tích và lưu cấu hình API thành công!');
}

function parseCurlCommand(curlStr) {
  if (!curlStr || !curlStr.includes('curl')) return null;
  const urlMatch = curlStr.match(/curl\s+(?:-[A-Za-z]+\s+)*['"]?(https?:\/\/[^\s'"\\]+)/i);
  if (!urlMatch) return null;
  const methodMatch = curlStr.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
  const headers = {}, headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi;
  let hMatch;
  while ((hMatch = headerRegex.exec(curlStr)) !== null) {
    const colonIdx = hMatch[1].indexOf(':');
    if (colonIdx !== -1) headers[hMatch[1].slice(0, colonIdx).trim()] = hMatch[1].slice(colonIdx + 1).trim();
  }
  let body = null;
  const bodyMatch = curlStr.match(/(?:--data-raw|--data|-d)\s+('([^']*)'|"([^"]*)")/i);
  if (bodyMatch) {
    const raw = bodyMatch[2] !== undefined ? bodyMatch[2] : bodyMatch[3];
    try { body = JSON.parse(raw); } catch (e) { body = raw; }
  }
  return { url: urlMatch[1], method: methodMatch ? methodMatch[1] : 'POST', headers, bodyTemplate: body, textFieldPath: 'content', capturedAt: Date.now(), source: 'manual_curl' };
}

function renderQuickTags() {
  const container = document.getElementById('quick-prompt-tags');
  if (!container) return;
  container.innerHTML = '';
  prompts.slice(0, 8).forEach(p => {
    const tag = document.createElement('span');
    tag.className = 'quick-tag'; tag.textContent = p.trigger; tag.title = p.title || p.trigger;
    tag.addEventListener('click', () => {
      document.getElementById('schedule-message').value = p.trigger;
      showToast(`Đã chọn prompt: ${p.trigger}`);
    });
    container.appendChild(tag);
  });
}

function renderApiStatus(api) {
  currentCapturedApi = api;
  const badge = document.getElementById('api-status-badge'), title = document.getElementById('api-status-title'), desc = document.getElementById('api-status-desc'), copyBtn = document.getElementById('btn-copy-curl');
  if (api && api.url) {
    badge.className = 'status-banner status-ready'; badge.querySelector('.status-icon').textContent = '🟢';
    title.textContent = 'ĐÃ SẴN SÀNG: Bắt được API MISA Chat!';
    desc.textContent = 'Hệ thống đã lưu đầy đủ thông tin gửi tin nhắn ngầm (Token, Cookie, Endpoint).';
    document.getElementById('api-detail-url').textContent = api.url;
    document.getElementById('api-detail-method').textContent = api.method || 'POST';
    document.getElementById('api-detail-field').textContent = api.textFieldPath || 'content';
    document.getElementById('api-detail-time').textContent = api.capturedAt ? new Date(api.capturedAt).toLocaleString('vi-VN') : 'Vừa xong';
    copyBtn.disabled = false;
  } else {
    badge.className = 'status-banner status-waiting'; badge.querySelector('.status-icon').textContent = '🟡';
    title.textContent = 'CHƯA BẮT ĐƯỢC API GỬI TIN NHẮN';
    desc.textContent = 'Mở chat MISA (misajsc.amis.vn) và gửi 1 tin nhắn bất kỳ để tiện ích tự động lưu cấu hình.';
    document.getElementById('api-detail-url').textContent = 'Chưa có (hãy gửi 1 tin trên MISA)';
    document.getElementById('api-detail-time').textContent = 'Chưa có';
    copyBtn.disabled = true;
  }
}

function renderSchedulerLogs(logs) {
  const tbody = document.getElementById('schedule-logs-body');
  if (!tbody) return;
  if (!logs || !logs.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#9ca3af;">Chưa có lịch sử gửi tin nhắn nào</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  logs.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(log.time)}</td><td><span class="td-trigger">${escapeHtml(log.message)}</span></td><td style="text-align:center;"><span class="badge-status ${log.status === 'success' ? 'badge-success' : 'badge-error'}">${log.status === 'success' ? 'Thành công' : 'Thất bại'}</span></td><td style="color:#4b5563;font-size:12px;">${escapeHtml(log.details || '')}</td>`;
    tbody.appendChild(tr);
  });
}

function handleCopyCurl() {
  if (!currentCapturedApi || !currentCapturedApi.url) return alert('Chưa có thông tin API để tạo lệnh cURL!');
  const api = currentCapturedApi, msg = document.getElementById('schedule-message').value.trim() || '/prompt 1';
  let bodyToSend;
  try { bodyToSend = typeof api.bodyTemplate === 'string' ? JSON.parse(api.bodyTemplate) : JSON.parse(JSON.stringify(api.bodyTemplate || {})); } catch (e) { bodyToSend = {}; }
  if (bodyToSend && typeof bodyToSend === 'object') {
    let textVal = msg;
    if (api.url.includes('/messages/send') && !textVal.startsWith('<p>')) textVal = `<p>${textVal}</p>`;
    if (api.textFieldPath) {
      const parts = api.textFieldPath.split('.');
      let curr = bodyToSend;
      for (let i = 0; i < parts.length - 1; i++) { if (!curr[parts[i]]) curr[parts[i]] = {}; curr = curr[parts[i]]; }
      curr[parts[parts.length - 1]] = textVal;
    } else { bodyToSend.content = textVal; }
    if (bodyToSend.messageId) bodyToSend.messageId = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let curl = `curl -X ${api.method || 'POST'} "${api.url}" \\\n`;
  for (const [k, v] of Object.entries(api.headers || {})) {
    if (!['content-length', 'host'].includes(k.toLowerCase())) curl += `  -H "${k}: ${String(v).replace(/"/g, '\\"')}" \\\n`;
  }
  curl += `  -d '${(typeof bodyToSend === 'string' ? bodyToSend : JSON.stringify(bodyToSend)).replace(/'/g, "'\\''")}'`;
  navigator.clipboard.writeText(curl);
  showToast('📋 Đã copy lệnh cURL vào clipboard!');
}

async function handleClearApi() {
  if (confirm('Xóa thông tin API đã bắt? Bạn sẽ cần gửi 1 tin nhắn mới trên MISA để tiện ích bắt lại.')) {
    await browserAPI.storage.local.remove(['amis_captured_api']);
    renderApiStatus(null);
    showToast('Đã xóa API đã lưu');
  }
}

async function handleClearLogs() {
  await browserAPI.storage.local.remove(['amis_schedule_logs']);
  renderSchedulerLogs([]);
  showToast('Đã xóa nhật ký');
}
