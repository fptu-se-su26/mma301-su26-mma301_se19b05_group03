# STE Mobile

Ứng dụng di động (Expo + React Native) cho **Môi trường học tập thông minh (STE)** của sinh viên FPT University. App dùng chung REST API với backend Express trong thư mục `../backend`.

## Tính năng

- Đăng nhập bằng tài khoản STE (JWT lưu an toàn qua `expo-secure-store`).
- **Bảng tin**: xem bài viết học vụ/sự kiện, mở chi tiết, thả cảm xúc.
- **Thông báo**: đọc thông báo toàn hệ thống và theo học phần.
- **Tài liệu**: lọc theo học phần, tìm kiếm và mở tài liệu.
- **Nhóm**: xem nhóm của tôi, khám phá nhóm, xem chi tiết, gửi yêu cầu tham gia, rời nhóm.
- **Cá nhân**: thông tin tài khoản, truy cập bộ câu hỏi ôn tập, đăng xuất.
- **Bộ câu hỏi**: làm bài trắc nghiệm và xem kết quả kèm đáp án đúng.

## Cấu hình API

Địa chỉ backend đọc từ `expo.extra.apiBaseUrl` trong `app.json`:

```json
"extra": { "apiBaseUrl": "http://localhost:5000/api" }
```

Sửa giá trị này theo môi trường chạy:

- **Máy ảo Android**: `http://10.0.2.2:5000/api`
- **Thiết bị thật / Expo Go**: `http://<IP-LAN-của-máy>:5000/api` (ví dụ `http://192.168.1.10:5000/api`)
- **iOS simulator / web**: `http://localhost:5000/api`

## Chạy app

```bash
npm install
npx expo start
```

Mở bằng Expo Go, Android emulator hoặc iOS simulator. Đảm bảo backend đang chạy và `apiBaseUrl` trỏ đúng.

## Tài khoản mẫu

Sau khi seed backend (`npm run seed`), đăng nhập với mật khẩu `Fptu@2026`, ví dụ sinh viên `thuannmhe161234@fpt.edu.vn`.
