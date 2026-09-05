# Tempo — Time Check-in

Ứng dụng check in/out, theo dõi ngày công và thu nhập, xây dựng với React, Node.js, Express, Supabase PostgreSQL và Tailwind CSS.

## Yêu cầu

- Node.js 22
- Một Supabase Project

## Cài đặt

```bash
npm install
npm --prefix backend install
Copy-Item .env.example .env
```

Cập nhật `POSTGRES_URL` và `POSTGRES_URL_NON_POOLING` trong `.env`. Có thể chạy [backend/schema.sql](backend/schema.sql) bằng Supabase SQL Editor; khi chạy local, `POSTGRES_AUTO_MIGRATE=true` cũng sẽ tự tạo/cập nhật các bảng.

Khởi động frontend và backend cùng lúc:

```bash
npm run dev:all
```

- Web: `http://localhost:5173`
- API: `http://localhost:3001`
- Kiểm tra kết nối: `http://localhost:3001/api/health`

## Tính năng

- Check in để bắt đầu một phiên làm việc và check out để kết thúc.
- Bổ sung phiên còn thiếu hoặc cập nhật giờ check in/out của phiên đã hoàn thành.
- Đánh dấu từng phiên là ngày dự án hoặc ngoài dự án. Ngày ngoài dự án vẫn cộng giờ làm nhưng không tham gia tính income.
- Bộ đếm thời gian theo thời gian thực, tổng thời gian, mục tiêu trong ngày và biểu đồ 7 ngày.
- Phiên làm việc và cài đặt được lưu trong Supabase PostgreSQL.
- Một ngày được tính công khi đạt ngưỡng tùy chỉnh, mặc định tối thiểu 6 giờ.
- Cấu hình chu kỳ công theo ngày bắt đầu/kết thúc hàng tháng, ví dụ 26 → 25.
- Cấu hình một khoản income cố định và phân bổ đều cho các ngày có tham gia dự án trong kỳ.
- Giao diện responsive từ điện thoại đến desktop.

## Cấu trúc frontend

```text
src/
├── components/
│   ├── dashboard/   # Check-in, tổng thời gian, biểu đồ và mục tiêu
│   ├── layout/      # Header, sidebar, mobile drawer và thông báo
│   └── sessions/    # Danh sách và form bổ sung/cập nhật phiên
├── config/          # Cấu hình điều hướng
├── pages/           # Overview, History, Statistics và Payroll
├── utils/           # Hàm xử lý thời gian và định dạng
├── api.js           # API client
└── App.jsx          # State, API actions và điều phối page
```

## API chính

- `GET /api/sessions`: danh sách phiên làm việc.
- `POST /api/sessions`: bổ sung một phiên đã hoàn thành; body gồm `date`, `checkIn`, `checkOut`, `isProjectDay`.
- `PUT /api/sessions/:id`: cập nhật thời gian và trạng thái ngày dự án của một phiên đã hoàn thành.
- `POST /api/sessions/check-in`: bắt đầu phiên; body gồm `projectDate` và `isProjectDay`.
- `POST /api/sessions/check-out`: kết thúc phiên hiện tại.
- `GET /api/settings`, `PUT /api/settings`: đọc/cập nhật cấu hình tính công.
- `GET /api/payroll-summary?period=2026-09`: tổng hợp ngày công và income của kỳ.

API từ chối phiên có giờ check out trước giờ check in, thời gian trong tương lai, hoặc trùng với một phiên đã có.

## Deploy frontend và backend trên Vercel

Dự án dùng hai Vercel Project từ cùng một Git repository:

1. **Backend Project**
   - Framework Preset: `Express`.
   - Root Directory: `backend`.
   - Entrypoint: `app.js` (Vercel tự nhận diện).
   - Không cấu hình Build Command hay Output Directory.
   - Runtime database URL: `POSTGRES_URL` từ Supabase Transaction pooler.
   - Migration URL: `POSTGRES_URL_NON_POOLING`.
   - Các biến còn lại: `POSTGRES_POOL_MAX`, `POSTGRES_IDLE_TIMEOUT`, `POSTGRES_CONNECT_TIMEOUT`, `POSTGRES_SSL_MODE=require`, `POSTGRES_SSL_CA` (chỉ cần cho `verify-full`), `APP_TIMEZONE_OFFSET_MINUTES`, `CLIENT_ORIGINS`.
   - Không cần `PORT` và `POSTGRES_AUTO_MIGRATE` trên Vercel. Chạy `backend/schema.sql` trong Supabase SQL Editor trước khi deploy.

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

### Cấu hình build cho Backend Project

- Node.js Version: `22.x` (đồng thời được cố định bằng `engines.node` trong `backend/package.json`).
- Framework Preset: `Express`.
- Build Command: để trống và tắt `Override`.
- Output Directory: để trống và tắt `Override`.
- Install Command: để Vercel tự động chọn `npm install`.

Express được Vercel tự động đóng gói từ `backend/app.js`, vì vậy không chạy `node app.js`, `npm run server` hay `npm run build` làm Build Command của Backend Project. Có thể kiểm tra cú pháp các file server trước khi deploy:

```bash
npm run build:server
```

Deploy production bằng Vercel CLI:

```bash
npx vercel --cwd backend --prod
```

Nếu log dừng ở lỗi nội bộ `Cannot read properties of undefined (reading 'fsPath')`, kiểm tra Backend Project đang dùng Root Directory `backend`, Framework Preset `Express`, đồng thời xóa mọi Build Command/Output Directory đã override rồi chọn **Redeploy without cache**. Frontend Project vẫn dùng Root Directory là thư mục gốc, preset `Vite`, lệnh `npm run build` và output `dist`.
