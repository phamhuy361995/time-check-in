# Tempo — Time Check-in

Ứng dụng check in/out, theo dõi ngày công và thu nhập, xây dựng với React, Node.js, Express, MySQL và Tailwind CSS.

## Yêu cầu

- Node.js 20+
- MySQL 8+

## Cài đặt

```bash
npm install
Copy-Item .env.example .env
```

Cập nhật tài khoản MySQL trong `.env`. API sẽ tự tạo database `tempo_checkin` và các bảng khi tài khoản có quyền. Nếu tài khoản không có quyền tạo database, chạy thủ công [server/schema.sql](server/schema.sql) trước.

Khởi động frontend và backend cùng lúc:

```bash
npm run dev:all
```

- Web: `http://localhost:5173`
- API: `http://localhost:3001`
- Kiểm tra kết nối: `http://localhost:3001/api/health`

## Tính năng

- Check in để bắt đầu một phiên làm việc và check out để kết thúc.
- Bộ đếm thời gian theo thời gian thực.
- Tổng thời gian, mục tiêu trong ngày và biểu đồ 7 ngày.
- Phiên làm việc và cài đặt được lưu trong MySQL.
- Một ngày được tính công khi đạt ngưỡng tùy chỉnh, mặc định tối thiểu 6 giờ.
- Cấu hình chu kỳ công theo ngày bắt đầu/kết thúc hàng tháng, ví dụ 26 → 25.
- Chọn ngày tham gia dự án trước mỗi lần check in; ngày này được lưu cùng phiên làm việc.
- Cấu hình một khoản income cố định và phân bổ đều cho các ngày tham gia dự án trong kỳ.
- Giao diện responsive từ điện thoại đến desktop.

## API chính

- `GET /api/sessions`: danh sách phiên làm việc.
- `POST /api/sessions/check-in`: bắt đầu phiên, body gồm `projectDate` theo định dạng `YYYY-MM-DD`.
- `POST /api/sessions/check-out`: kết thúc phiên hiện tại.
- `GET /api/settings`, `PUT /api/settings`: đọc/cập nhật cấu hình tính công.
- `GET /api/payroll-summary?period=2026-09`: tổng hợp ngày công của kỳ.

## Deploy frontend và backend trên Vercel

Dự án dùng hai Vercel Project từ cùng một Git repository:

1. **Backend Project**
   - Framework Preset: `Express`.
   - Root Directory: thư mục gốc repository.
   - Entrypoint: `server.js` (Vercel tự nhận diện).
   - Không cấu hình Build Command hay Output Directory.
   - Environment Variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`, `DB_SSL_CA` (nếu provider yêu cầu), `DB_CONNECTION_LIMIT`, `DB_IDLE_TIMEOUT`, `DB_CONNECT_TIMEOUT`, `APP_TIMEZONE_OFFSET_MINUTES`, `CLIENT_ORIGINS`.
   - Không cần `PORT` và `DB_AUTO_MIGRATE` trên Vercel. Chạy `server/schema.sql` vào database trước khi deploy.

2. **Frontend Project**
   - Framework Preset: `Vite`.
   - Root Directory: thư mục gốc repository.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
   - Environment Variable: `VITE_API_URL=https://<backend-project>.vercel.app`.

3. Quay lại Backend Project và đặt:

```env
CLIENT_ORIGINS=https://<frontend-project>.vercel.app
```

Nếu có nhiều frontend domain hoặc Preview URL, phân cách bằng dấu phẩy. Sau khi đổi Environment Variables, redeploy cả project liên quan. Frontend sẽ gọi `${VITE_API_URL}/api/...`; local development vẫn dùng Vite proxy khi `VITE_API_URL` để trống.
