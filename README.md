<div align="center">

# ⚡ AMIS Chat Custom Prompts & Slash Shortcuts

<p align="center">
  <b>Tiện ích mở rộng trình duyệt chuyên nghiệp giúp tùy biến Slash Commands (<code>/</code>), quản lý Prompt cá nhân và tự động hẹn giờ gửi tin nhắn trên MISA AMIS AI Chat.</b>
</p>

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](https://github.com/lequanghuy19204/amis-chat-prompt-extension/releases/tag/v1.1.0)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg?style=for-the-badge)](manifest.json)
[![Chrome](https://img.shields.io/badge/Chrome-Supported-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://google.com/chrome)
[![Firefox](https://img.shields.io/badge/Firefox-Supported-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://mozilla.org/firefox)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-@lqhuy2-4f46e5.svg?style=for-the-badge)](https://github.com/lequanghuy19204)

<br/>

[📦 Tải Bản Cài Đặt (v1.1.0)](https://github.com/lequanghuy19204/amis-chat-prompt-extension/releases/latest) •
[🚀 Tính Năng](#-tính-năng-nổi-bật) •
[📥 Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt) •
[🎯 Cách Sử Dụng](#-hướng-dẫn-sử-dụng) •
[🏗️ Kiến Trúc Kỹ Thuật](#-kiến-trúc-kỹ-thuật)

</div>

---

## 🌟 Tổng Quan

**AMIS Chat Custom Prompts & Shortcuts** là Web Extension thế hệ mới (Manifest V3) tương thích chéo giữa **Google Chrome, Mozilla Firefox, Microsoft Edge, Brave, Cốc Cốc**. 

Extension can thiệp trực tiếp vào bộ soạn thảo **TipTap ProseMirror** của hệ thống **MISA AMIS AI Chat** (`misajsc.amis.vn`), cho phép tích hợp prompt tùy chỉnh vào native menu, điều hướng hoàn toàn bằng bàn phím và tự động hóa hẹn giờ gửi tin nhắn thông qua cơ chế API sniffing ngầm.

---

## 🚀 Tính Năng Nổi Bật

### 1. ⌨️ Điều Hướng Menu `/` Bằng Bàn Phím Hoàn Toàn (Native Integration)
- **Tự động đưa lên đầu:** Khi gõ `/` trong khung chat MISA, danh sách prompt cá nhân xuất hiện ngay trên đầu danh mục gợi ý.
- **Tìm kiếm tức thì (Real-time Filter):** Gõ tiếp ký tự (ví dụ: `/p`, `/agent`, `/review`) để lọc nhanh.
- **Phím mũi tên `↑ / ↓`:** Di chuyển mượt mà giữa các mục trong popup gợi ý của MISA.
- **Phím `Enter` / `Tab`:** Nhấn Enter để chọn ngay lệnh đang highlight mà không cần chạm chuột.
- **Chèn chuẩn Trigger Shortcut:** Khi Enter, khung chat tự động điền chính xác Trigger Shortcut (ví dụ: `[agent1] `, `/prompt 1 `) in đậm kèm dấu cách.

### 2. ⏰ Quản Lý Đa Lịch Hẹn Giờ Tự Động (Auto Scheduler)
- **Thêm, sửa, xóa đa lịch hẹn:** Tạo nhiều lịch hẹn với khung giờ và nội dung khác nhau.
- **Bật / Tắt độc lập:** Mỗi lịch có công tắc Toggle riêng biệt để kích hoạt khi cần.
- **Tần suất linh hoạt:** Hỗ trợ lặp lại **Hàng ngày (Daily)** hoặc chạy **Một lần duy nhất (Once - tự tắt sau khi gửi)**.
- **Nút Gửi Thử (Test Send 🚀):** Thử nghiệm gửi ngay tin nhắn vào chat MISA để kiểm tra.

### 3. 🌐 Tự Động Bắt (Trace / Sniff) API MISA Chat
- **Không cần cấu hình thủ công:** Chỉ cần gửi 1 tin nhắn bất kỳ trên MISA Chat, extension tự động trích xuất:
  - Endpoint: `https://misajsc.amis.vn/chat/api/business/v1/messages/send/text-box`
  - Bearer Token & Session Cookie
  - Cấu trúc Payload chuẩn MISA
- **Gửi ngầm hoàn toàn:** Đến giờ hẹn, extension gọi HTTP POST ngầm mà không cần mở tab chat, không chiếm con trỏ chuột hay bàn phím.

### 4. ☁️ Giải Pháp Gửi KHÔNG CẦN TREO MÁY (Cloud / Termux)
- **Nút `[📋 Copy lệnh cURL]`:** Sao chép lệnh cURL chứa đầy đủ Token xác thực.
- **Tích hợp GitHub Actions Cron:** Thiết lập workflow chạy 21:00 hàng ngày trên đám mây GitHub hoàn toàn miễn phí mà có thể **tắt máy tính hoàn toàn**.
- **Chạy trên Termux Android:** Lên lịch `crontab` trên điện thoại Android luôn kết nối Wi-Fi.

### 5. 🎛️ Quản Lý Prompt Linh Hoạt (Options & Popup)
- **Cấu hình tối giản 2 trường:** `Phím tắt (Trigger Shortcut) *` và `Tiêu đề gợi ý (không bắt buộc)`.
- **Sắp xếp thứ tự ưu tiên:** Kéo thả chuột (HTML5 Drag & Drop), nút di chuyển `▲ / ▼` và nút tự động `🔤 Sắp xếp A → Z`.
- **Sao lưu & Chia sẻ:** Xuất và nhập dữ liệu file JSON (Export / Import).
- **Phím tắt toàn cục `Alt + P`:** Bật nhanh Modal tìm kiếm prompt ở bất kỳ màn hình nào.

---

## 📥 Hướng Dẫn Cài Đặt

### Cách 1: Tải file Zip phát hành sẵn (Khuyên dùng)
1. Tải bản mới nhất tại: **[GitHub Releases (v1.1.0)](https://github.com/lequanghuy19204/amis-chat-prompt-extension/releases/latest)**.
2. Giải nén file `amis-chat-prompt-extension-v1.1.0.zip` vào một thư mục trên máy.
3. Làm theo hướng dẫn trình duyệt bên dưới.

### Cách 2: Cài đặt từ mã nguồn (Developer Mode)

#### 🌐 Trên Google Chrome / Microsoft Edge / Brave / Cốc Cốc
1. Mở trình duyệt, truy cập: `chrome://extensions/` (hoặc `edge://extensions/`).
2. Bật công tắc **Developer mode (Chế độ cho nhà phát triển)** ở góc trên bên phải.
3. Nhấp vào nút **Load unpacked (Tải tiện ích đã giải nén)** ở góc trên bên trái.
4. Chọn thư mục tiện ích:
   ```
   E:\Tool\amis-chat-prompt-extension
   ```
5. Ghim (Pin) icon tiện ích lên thanh công cụ trình duyệt.

#### 🦊 Trên Mozilla Firefox
1. Mở Firefox, nhập vào thanh địa chỉ: `about:debugging#/runtime/this-firefox`.
2. Bấm vào nút **Load Temporary Add-on... (Tải tiện ích tạm thời...)**.
3. Chọn file `manifest.json` trong thư mục tiện ích:
   ```
   ..\amis-chat-prompt-extension\manifest.json
   ```
4. Tiện ích sẽ được kích hoạt ngay lập tức!

---

## 🎯 Hướng Dẫn Sử Dụng

### 1. Sử dụng Phím tắt Slash (`/`) trên MISA Chat
```
[ Khung Chat MISA ]
  └─ Gõ: /
      ├─ Gợi ý: [agent1]           Agent cấu hình Working Directory
      ├─ Gợi ý: /prompt 1          Khám phá mã nguồn & kiến trúc
      └─ Gợi ý: /goal              Mục tiêu dự án
```
1. Click vào khung chat MISA (`https://misajsc.amis.vn/chat/...`) và gõ `/`.
2. Nhập từ khóa để lọc lệnh (ví dụ `/p1` hoặc `/goal`).
3. Dùng phím **`↑` hoặc `↓`** để di chuyển chọn lệnh.
4. Nhấn **`Enter`** hoặc **`Tab`** để chèn lệnh trực tiếp.

### 2. Thiết lập Hẹn Giờ Gửi Tin Nhắn Tự Động
1. Bấm icon tiện ích trên thanh trình duyệt -> Chọn **Cài đặt ⚙️** -> Chọn tab **⏰ Hẹn Giờ Gửi Tin Nhắn**.
2. Nhập giờ hẹn (ví dụ: `21:00`), tần suất (Hàng ngày hoặc 1 lần), và nội dung (ví dụ: `/prompt 1`).
3. Bấm **Lưu Lịch Hẹn**.
4. Bật công tắc **Toggle** tương ứng với lịch bạn muốn chạy.

### 3. Thiết lập Chạy Cloud KHÔNG CẦN TREO MÁY
1. Mở tab chat MISA và gửi 1 tin nhắn để extension bắt API.
2. Vào trang Cài đặt -> Bấm nút **`[📋 Copy lệnh cURL]`**.
3. Tạo file `.github/workflows/auto-send.yml` trong repository GitHub cá nhân (Private):
   ```yaml
   name: MISA Scheduled Message
   on:
     schedule:
       - cron: '0 14 * * *' # 14:00 UTC = 21:00 giờ Việt Nam
     workflow_dispatch:
   jobs:
     send:
       runs-on: ubuntu-latest
       steps:
         - name: Send API Request
           run: |
             # Dán lệnh cURL đã copy vào đây
   ```

---

## 🏗️ Kiến Trúc Kỹ Thuật

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 MISA AMIS Chat Web Page                     │
  │               (https://misajsc.amis.vn)                     │
  └──────────────┬──────────────────────────────┬───────────────┘
                 │                              │
                 ▼                              ▼
      [ Page Context / Main World ]    [ Isolated Context ]
      content/amis-inject.js           content/amis-prompts.js
      ├─ Hook TipTap ProseMirror       ├─ chrome.storage.local
      │  (slashExt.suggestion)         ├─ Modal Alt+P Picker
      ├─ Network Sniffer               ├─ Scheduler Engine
      │  (fetch & XHR Interceptor)     └─ PostMessage Bridge
      └─ Auto messageId & <p> format
                 │                              │
                 └──────────────┬───────────────┘
                                ▼
                 [ Options & Popup Dashboard ]
                 options/ (Quản lý Prompt & Hẹn giờ)
                 popup/   (Thao tác nhanh trên Toolbar)
```

- **ProseMirror Plugin Re-registration Guard:** Sử dụng cờ `editor.__amis_slash_hooked__` để tránh vòng lặp đăng ký lại plugin, ngăn chặn triệt để hiện tượng giật/đóng popover Tippy.js của MISA.
- **Deep Network Interceptor:** Can thiệp cả `window.fetch` và `XMLHttpRequest.prototype` để tự động bóc tách header xác thực JWT và cấu trúc tin nhắn.
- **Storage Architecture:** Sử dụng `chrome.storage.local` để lưu trữ token lớn, vượt qua giới hạn 8KB của `storage.sync`.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
amis-chat-prompt-extension/
├── manifest.json                 # Manifest V3 (Chrome, Firefox, Edge)
├── amis-prompts-backup.json      # Bộ dữ liệu prompt mẫu mặc định
├── README.md                     # Tài liệu hướng dẫn dự án
├── icons/                        # Bộ icon tiện ích (16px, 48px, 128px)
├── content/
│   ├── amis-inject.js            # Main World: Hook TipTap & Network Tracer
│   ├── amis-prompts.js           # Isolated World: Storage bridge & Scheduler
│   └── amis-prompts.css          # Giao diện Modal Alt+P Quick Picker
├── options/
│   ├── options.html              # Trang quản lý Prompt & Hẹn giờ gửi
│   ├── options.js                # Logic Dashboard quản lý
│   └── options.css               # Giao diện Dashboard 50/50 hiện đại
└── popup/
    ├── popup.html                # Popup thanh công cụ trình duyệt
    ├── popup.js                  # Logic tìm kiếm nhanh & trạng thái hẹn giờ
    └── popup.css                 # Giao diện popup tối giản
```

---

## 💻 Trình Duyệt Hỗ Trợ

| Trình duyệt | Hệ điều hành | Trạng thái hỗ trợ |
| :--- | :--- | :---: |
| **Google Chrome** | Windows, macOS, Linux | ✅ Hoàn toàn tương thích |
| **Mozilla Firefox** | Windows, macOS, Linux | ✅ Hoàn toàn tương thích |
| **Microsoft Edge** | Windows, macOS, Linux | ✅ Hoàn toàn tương thích |
| **Brave Browser** | Windows, macOS, Linux | ✅ Hoàn toàn tương thích |
| **Cốc Cốc** | Windows, macOS | ✅ Hoàn toàn tương thích |

---

## 👤 Tác Giả & Bản Quyền

- **Tác giả:** [`@lqhuy2`](https://github.com/lequanghuy19204)
- **Repository:** [https://github.com/lequanghuy19204/amis-chat-prompt-extension](https://github.com/lequanghuy19204/amis-chat-prompt-extension)
- **Giấy phép:** [MIT License](LICENSE)

<div align="center">
  <sub>Phát triển bởi <b>@lqhuy2</b> dành cho cộng đồng người dùng MISA AMIS.</sub>
</div>
