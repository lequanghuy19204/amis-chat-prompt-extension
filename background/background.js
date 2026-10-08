/**
 * AMIS Chat Custom Prompts - Background Service Worker
 * Cross-browser compatibility (Chrome / Edge / Firefox)
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const DEFAULT_PROMPTS = [
  {
    id: 'p-code-review',
    trigger: '/review',
    title: 'Review Code (Clean Code & SOLID)',
    description: 'Yêu cầu AI review mã nguồn theo tiêu chuẩn chất lượng',
    content: 'Bạn là chuyên gia Senior Software Engineer. Hãy review đoạn mã nguồn sau theo tiêu chuẩn Clean Code, SOLID và bảo mật:\n- Kiểm tra tính đúng đắn và các edge cases (null, boundary, concurrency).\n- Đánh giá khả năng tối ưu hiệu năng và memory leak.\n- Đề xuất giải pháp refactor cụ thể nếu phát hiện vấn đề:\n\n',
    tags: ['dev', 'review']
  },
  {
    id: 'p-spec',
    trigger: '/spec',
    title: 'Phân tích yêu cầu & Lập Spec Task',
    description: 'Tạo tài liệu đặc tả chức năng và phân rã task chi tiết',
    content: 'Hãy đóng vai Tech Lead, phân tích yêu cầu nghiệp vụ sau và viết tài liệu spec task chi tiết:\n1. Tóm tắt mục tiêu tính năng\n2. Phân rã danh sách công việc (Sub-tasks) kèm ước tính độ phức tạp\n3. Thiết kế luồng dữ liệu (Data flow) và API Contract (nếu có)\n4. Danh sách các trường hợp ngoại lệ (Edge Cases) cần lưu ý:\n\n',
    tags: ['spec', 'plan']
  },
  {
    id: 'p-unittest',
    trigger: '/unittest',
    title: 'Viết Unit Test & Test Cases',
    description: 'Sinh bộ test cases đầy đủ bao gồm happy path và edge cases',
    content: 'Hãy viết bộ Unit Test toàn diện cho hàm/module sau:\n- Bao phủ toàn bộ các luồng (Branch coverage, Statement coverage).\n- Kiểm tra các trường hợp biên, giá trị null/undefined, rỗng, ngoại lệ.\n- Sử dụng Mock/Stub chuẩn mực cho các dependency bên ngoài:\n\n',
    tags: ['test', 'dev']
  },
  {
    id: 'p-fixbug',
    trigger: '/fixbug',
    title: 'Truy vết & Sửa lỗi (Root Cause Analysis)',
    description: 'Phân tích log lỗi, giải thích nguyên nhân gốc và đưa ra cách sửa',
    content: 'Dưới đây là thông tin lỗi/exception gặp phải. Hãy phân tích giúp tôi:\n1. Nguyên nhân gốc rễ (Root Cause) gây ra lỗi là gì?\n2. Đề xuất phương án sửa triệt để kèm đoạn code đã sửa.\n3. Hướng dẫn cách phòng ngừa lỗi tương tự tái diễn:\n\n',
    tags: ['debug', 'fix']
  },
  {
    id: 'p-custom-1',
    trigger: '/prompt1',
    title: 'Prompt Tùy Chỉnh Mẫu 1',
    description: 'Ví dụ prompt 1 tùy chỉnh của bạn',
    content: 'Đây là nội dung Prompt 1 mẫu do bạn tùy chỉnh. Bạn có thể thay đổi nội dung này trong phần Cài đặt của Extension!',
    tags: ['custom']
  }
];

browserAPI.runtime.onInstalled.addListener(async (details) => {
  try {
    const storage = browserAPI.storage.sync || browserAPI.storage.local;
    const data = await storage.get(['amis_prompts', 'amis_settings']);

    if (!data.amis_prompts || data.amis_prompts.length === 0) {
      await storage.set({
        amis_prompts: DEFAULT_PROMPTS,
        amis_settings: {
          enableSlashOverride: true,
          enableQuickButton: true,
          enableFloatingMenu: true,
          shortcutPrefix: '/'
        }
      });
      console.log('[AMIS Prompts] Đã khởi tạo danh sách prompt mặc định');
    }
  } catch (err) {
    console.error('[AMIS Prompts] Lỗi khởi tạo storage:', err);
  }
});
