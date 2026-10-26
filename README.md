# Web In Ấn Thái Nguyên

Web đặt in online: khách chọn sản phẩm (standee, tờ rơi, biển quảng cáo), tải file, xem kết quả kiểm tra file + mockup, đặt in và theo dõi tiến độ. Có thêm dịch vụ đặt thiết kế. Admin quản lý đơn, tiến độ, thanh toán và bảng giá.

## Công nghệ

- Next.js 15 (App Router, TypeScript), Tailwind CSS 4
- PostgreSQL + Prisma
- Auth.js: email/mật khẩu, Google, Facebook
- Kiểm tra file: `sharp` cho ảnh, `poppler-utils` (`pdfinfo`, `pdfimages`, `pdffonts`, `pdftoppm`) cho PDF
- File lưu trên ổ đĩa server (`STORAGE_DIR`), gói gọn trong `src/lib/storage.ts` để sau này chuyển sang R2/S3

## Chạy trên máy

Cần Node 22, PostgreSQL và `poppler-utils` (Ubuntu: `sudo apt install poppler-utils`, macOS: `brew install poppler`).

```bash
cp .env.example .env        # sửa DATABASE_URL, AUTH_SECRET (npx auth secret)
npm install
npx prisma migrate dev      # tạo bảng
npm run db:seed             # 3 sản phẩm giá ảo + tài khoản admin trong .env
npm run dev
```

Mở http://localhost:3000. Đăng nhập admin bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env`, vào mục **Quản trị**.

## Chạy bằng Docker (VPS)

```bash
cp .env.example .env   # điền AUTH_SECRET, khóa Google/Facebook, thông tin ngân hàng
docker compose up -d --build
docker compose exec web npm run db:seed
```

## Đăng nhập Google / Facebook

Điền `AUTH_GOOGLE_ID/SECRET`, `AUTH_FACEBOOK_ID/SECRET` trong `.env`. Nút đăng nhập nhanh chỉ hiện khi đã có khóa. URL callback cần khai báo:

- Google: `https://<tên-miền>/api/auth/callback/google`
- Facebook: `https://<tên-miền>/api/auth/callback/facebook`

## Bảng giá

Giá hiện tại là **giá ảo**. Admin sửa ở `/admin/san-pham`: kích thước, đơn giá, chất liệu, gia công, giảm giá theo số lượng, ngưỡng DPI, lề xén. Giá luôn được tính lại ở server khi đặt đơn (`src/lib/pricing.ts`).

## Kiểm tra file

`src/lib/filecheck.ts` kiểm tra theo khổ in khách chọn:

| Mục | Cách đo |
| --- | --- |
| Độ phân giải | Số pixel ÷ kích thước in (ảnh); DPI ảnh nhúng ÷ tỷ lệ phóng trang (PDF) |
| Kích thước & tỷ lệ | So tỷ lệ file với khổ in, có và không có lề xén; phát hiện file ngược hướng |
| Lề xén | Sản phẩm có `bleedMm` > 0 thì kiểm tra file đã chừa lề chưa |
| Hệ màu | CMYK đạt, RGB cảnh báo |
| Font | PDF có font chưa nhúng là lỗi |

Khách có thể tải lại file hoặc tick xác nhận để bỏ qua cảnh báo; đơn được đánh dấu để admin biết.

Mockup (`src/lib/mockup.ts`) hiện được dựng bằng SVG. Khi có ảnh chụp thật (khung standee, mặt tiền...), thay nền SVG bằng ảnh và tọa độ vùng in.

## Thanh toán

Đơn hiển thị mã VietQR (theo `BANK_BIN`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`), nội dung chuyển khoản là mã đơn. Admin xác nhận tay ở trang chi tiết đơn.
