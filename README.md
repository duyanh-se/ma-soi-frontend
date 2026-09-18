# Ma Sói Frontend

Next.js frontend cho backend NestJS trong thư mục `../werewolf-backend`.

## Chạy local

```powershell
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Frontend mặc định chạy ở `http://localhost:3001` nếu chạy `npm run dev -- --port 3001`. Backend cần chạy tại `http://localhost:3000`.

```powershell
cd ../werewolf-backend
npm run db:up
npm run start:dev
```

## Các màn hình

- Trang chủ: tạo phòng và vào phòng bằng mã phòng. Trong phòng chờ, chủ phòng chọn số lượng từng role cho cả ván rồi lưu cấu hình trước khi bắt đầu; server xáo ngẫu nhiên các role đó khi chia.
- Trang ván chơi: danh sách người chơi, role/phe riêng, tình nhân, lịch sử soi, nhóm Sói, nhật ký chung và các thao tác theo phase.
- UI hiển thị role đang có lượt trong đêm cho toàn phòng; panel hành động chỉ mở cho người có quyền thực hiện lượt đó.

`playerId` được lưu trong `localStorage` theo mã phòng. Đây là cơ chế phát triển tương thích backend hiện tại; khi backend có JWT/session, frontend cần thay phần lưu session này bằng token xác thực.
