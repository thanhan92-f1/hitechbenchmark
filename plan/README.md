# Kế hoạch triển khai Hitech Benchmark

Tài liệu này chia yêu cầu trong `yeucau.md` thành các plan nhỏ để triển khai theo từng phần, giảm rủi ro và dễ nghiệm thu.

## Stack đề xuất

- Ưu tiên runtime/build: Node.js.
- Frontend chính: Next.js 16.1.6 + React + JavaScript/TypeScript + Tailwind CSS.
- Build tooling: Turbopack cho Next.js; Webpack cho legacy/admin assets khi cần.
- UI/Admin có thể dùng: Bootstrap, jQuery 3.5.1, Alpine.js, Livewire, Select2, SweetAlert2, toastr 2.1.4, Dropzone 5.7.6, Quill.
- Chart/graphics: Chart.js, ApexCharts.js.
- Backend: Laravel/PHP API hoặc Node.js/NestJS API; ưu tiên Node.js cho frontend/API realtime, Laravel dùng tốt cho admin nội bộ nếu chọn hệ Laravel.
- Database: PostgreSQL/MySQL.
- Realtime: Redis + WebSocket/SSE
- Queue: Redis Queue + Horizon/Supervisor
- Benchmark Script: Bash + JSON payload
- DevOps: Docker Compose + Nginx 1.24.0 + Ubuntu + Cloudflare CDN/HTTP/3 + CI/CD

## Ghi chú ưu tiên công nghệ

- Ưu tiên triển khai giao diện bằng Node.js ecosystem: Next.js 16.1.6, React, Tailwind CSS, Turbopack.
- Các thư viện Vue.js 2.6.12, Alpine.js, Livewire, Bootstrap, jQuery dùng cho admin panel hoặc legacy widget nếu cần, không trộn vào public frontend khi không cần thiết.
- Admin dashboard là module bắt buộc, có quyền quản trị benchmark, provider, promotion, user, token, abuse/fake flags và cấu hình hệ thống.

## Danh sách plan

1. `00-roadmap-milestones.md` - Roadmap tổng thể và mốc bàn giao.
2. `01-architecture.md` - Kiến trúc hệ thống và module chính.
3. `02-database-schema.md` - Thiết kế database/schema.
4. `03-backend-api.md` - Backend REST API, auth, queue.
5. `04-frontend-ui.md` - Frontend UI, dashboard, trang chính.
6. `05-benchmark-script-worker.md` - Bash benchmark script và worker xử lý.
7. `06-provider-ranking-compare.md` - Provider, ranking, compare, search.
8. `07-security-anti-fake.md` - Bảo mật, signed payload, anti-fake.
9. `08-devops-deployment.md` - Docker, deploy, Nginx, backup.
10. `09-testing-acceptance.md` - Kiểm thử và tiêu chí nghiệm thu.

## Thứ tự triển khai khuyến nghị

1. Chốt kiến trúc và schema.
2. Xây backend API lõi.
3. Xây benchmark script gửi dữ liệu mẫu.
4. Xây frontend hiển thị kết quả.
5. Bổ sung provider/ranking/compare.
6. Xây admin dashboard đầy đủ.
7. Gia cố bảo mật, anti-fake, queue.
8. Hoàn thiện DevOps, test, tài liệu bàn giao.
