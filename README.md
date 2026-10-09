# AMIS Chat Custom Prompts & Slash Shortcuts Extension

Tiện ích mở rộng (Browser Extension) dành cho **Google Chrome, Mozilla Firefox, Microsoft Edge, Brave, Cốc Cốc** giúp tùy chỉnh, bổ sung và ghi đè các phím tắt `/` (Slash Commands) cá nhân trên hệ thống **MISA AMIS AI Chat** (`misajsc.amis.vn`).

---

## 🚀 Tính năng nổi bật

1. **Tìm kiếm & Điều hướng bàn phím hoàn toàn trong Menu `/` của MISA:**
   - Khi gõ `/` trong khung chat, các prompt tùy chỉnh của bạn sẽ xuất hiện ngay trên đầu menu "Danh sách lệnh".
   - **Tìm kiếm tức thì (Search):** Gõ tiếp ký tự (ví dụ: `/p`, `/review`, `/agent`) để lọc nhanh phím tắt.
   - **Phím mũi tên `↑ / ↓`:** Di chuyển lên/xuống mượt mà giữa các lệnh.
   - **Phím `Enter` / `Tab`:** Nhấn Enter để chọn ngay lệnh đang highlight mà không cần chạm vào chuột!
   - Khi Enter/chọn, khung chat sẽ **hiển thị chính xác Phím tắt (Trigger Shortcut)** (ví dụ: `[agent1] `, `/prompt1 `) thay vì tiêu đề.
2. **Cấu hình tối giản chỉ với 2 trường duy nhất:**
   - **Phím tắt (Trigger Shortcut) \***: Nội dung lệnh sẽ được điền vào ô chat khi Enter (ví dụ: `[agent1]`, `/prompt1`, `/review`).
   - **Tiêu đề gợi ý \***: Mô tả hiển thị bên phải phím tắt trong menu gợi ý.
3. **Phím tắt toàn cục `Alt + P`:**
   - Bấm `Alt + P` bất kỳ lúc nào để bật nhanh bảng tìm kiếm Prompt mà không cần rời tay khỏi bàn phím.
4. **Sắp xếp & Đổi thứ tự ưu tiên linh hoạt:**
   - **Kéo thả chuột (Drag & Drop):** Giữ chuột vào biểu tượng `⠿` để kéo thả đổi vị trí các prompt trong bảng.
   - **Nút di chuyển `▲` (Lên) / `▼` (Xuống):** Đẩy từng bước vị trí prompt lên hoặc xuống.
   - **Nút `🔤 Sắp xếp A → Z`:** Sắp xếp toàn bộ phím tắt tự động theo bảng chữ cái A-Z chỉ với 1 click.
   - Thứ tự bạn sắp xếp trong danh sách sẽ là **thứ tự xuất hiện ưu tiên trên đầu menu `/` của MISA**.
5. **Giao diện Quản lý & Xuất/Nhập dữ liệu (Options & Popup):**
   - Thêm mới, sửa, xóa prompt linh hoạt.
   - **Xuất / Nhập JSON (Export / Import):** Dễ dàng sao lưu (backup) hoặc chia sẻ bộ phím tắt cho đồng nghiệp trong team.
6. **⏰ Hẹn giờ gửi tin nhắn tự động (Auto Scheduler & Traced API):**
   - **Tự động bắt (Sniff/Trace) API:** Chỉ cần gửi 1 tin nhắn bình thường trên chat MISA, tiện ích sẽ tự động ghi nhớ Endpoint, Bearer Token và Payload gửi tin nhắn.
   - **Hẹn giờ gửi ngầm:** Đặt giờ hẹn (ví dụ: `21:00`), tiện ích tự động bắn HTTP POST request gửi lệnh (như `/prompt 1`) mà không cần mở tab chat hay đụng vào chuột/bàn phím.
   - **Chạy không cần treo máy (Cloud / Termux):** Có nút **"📋 Copy lệnh cURL"** chứa sẵn Token xác thực để thiết lập vào GitHub Actions Cron hoặc Termux chạy tự động 24/7 khi tắt máy tính.

---

## 📦 Hướng dẫn cài đặt

### 1. Trên Mozilla Firefox
1. Mở Firefox, nhập vào thanh địa chỉ: `about:debugging#/runtime/this-firefox`
2. Bấm vào nút **Load Temporary Add-on... (Tải tiện ích tạm thời...)**
3. Chọn file:
   ```
   ..\amis-chat-prompt-extension\manifest.json
   ```
4. Tiện ích sẽ được nạp thành công ngay lập tức!

### 2. Trên Google Chrome / Microsoft Edge / Brave / Cốc Cốc
1. Mở trình duyệt, truy cập đường dẫn: `chrome://extensions` (hoặc `edge://extensions` trên Edge).
2. Bật công tắc **Developer mode (Chế độ cho nhà phát triển)** ở góc trên bên phải.
3. Nhấp vào nút **Load unpacked (Tải tiện ích đã giải nén)** ở góc trên bên trái.
4. Chọn thư mục:
   ```
   ..\amis-chat-prompt-extension
   ```
5. Ghim (Pin) icon tiện ích lên thanh công cụ trình duyệt.

---

## 🎯 Hướng dẫn sử dụng trên MISA Chat

1. Mở trang chat MISA AMIS: `https://misajsc.amis.vn/chat/...`
2. **Sử dụng phím tắt & Enter:**
   - Click vào khung chat và gõ `/`.
   - Gõ tiếp từ khóa để tìm kiếm (ví dụ `/p1` hoặc `/agent`).
   - Dùng phím mũi tên **`↑` hoặc `↓`** để di chuyển chọn lệnh.
   - Nhấn **`Enter`** hoặc **`Tab`**: Khung chat sẽ tự động điền ngay **Phím tắt (Trigger Shortcut)** đã chọn!
3. **Thêm / Chỉnh sửa Prompt:**
   - Bấm vào icon Extension trên thanh trình duyệt -> Bấm icon ⚙️ (hoặc bấm Quản lý Prompt) để vào trang Cài đặt.
   - Nhập:
     - **Phím tắt (Trigger Shortcut):** Ví dụ `[agent1]` hoặc `/prompt1`
     - **Tiêu đề gợi ý:** Ví dụ `Agent 1 cấu hình cho Working Directory`
   - Nhấn **Lưu Prompt**. Cập nhật tức thì vào khung chat MISA mà không cần tải lại trang!

---

## 👤 Tác giả

- `@lqhuy2`

