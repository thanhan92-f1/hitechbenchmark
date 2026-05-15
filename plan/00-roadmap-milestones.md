# Plan 00 - Roadmap & Milestones

## Mục tiêu

Xây dựng nền tảng benchmark VPS/Cloud Server/Dedicated Server có khả năng chạy 1 lệnh bash, thu thập thông số máy chủ, đồng bộ kết quả lên website, hỗ trợ public/private result, so sánh provider và xếp hạng hiệu năng.

## Milestone 1 - Foundation

### Công việc Milestone 1

- Khởi tạo monorepo/source structure.
- Chọn stack chính ưu tiên Node.js: Next.js 16.1.6 frontend, React, Tailwind CSS, Turbopack, Node.js API/realtime hoặc Laravel/PHP API nếu cần.
- Xác định admin panel bắt buộc: có thể dùng Next.js/React hoặc Laravel Livewire/Alpine.js/Bootstrap cho quản trị nội bộ.
- Cấu hình Docker Compose cho app, database, redis, nginx.
- Thiết kế database schema bản đầu.
- Tạo API skeleton và health check.

### Kết quả bàn giao Milestone 1

- Source structure rõ ràng.
- Docker chạy được môi trường local.
- API `/health` hoạt động.
- Tài liệu setup local.

## Milestone 2 - Benchmark MVP

### Công việc Milestone 2

- Tạo bash install script tại endpoint `/install`.
- Script detect OS, CPU, RAM, disk, network cơ bản.
- API nhận benchmark result.
- Lưu benchmark public/private.
- Trang hiển thị chi tiết benchmark.

### Kết quả bàn giao Milestone 2

- Chạy được lệnh:
  - `bash <(wget -qO- https://benchmark.codelab.vn/install)`
  - `curl -sL https://benchmark.codelab.vn/install | bash`
- Có link public/private result.
- Có dữ liệu benchmark mẫu trong database.

## Milestone 3 - Website Public

### Công việc Milestone 3

- Trang chủ bằng Next.js 16.1.6 + React + Tailwind CSS.
- Danh sách VPS vừa test.
- Filter theo country/provider/ASN/CPU/RAM/virtualization/IP.
- Providers page.
- Realtime update cho benchmark mới.
- Tích hợp Chart.js/ApexCharts.js cho biểu đồ public.
- Tối ưu SEO/Open Graph, Priority Hints và Cloudflare cache.

### Kết quả bàn giao Milestone 3

- UI responsive, dark/light mode.
- Public benchmark hiển thị realtime.
- Thống kê tổng quan hoạt động.
- Public frontend chạy trên Node.js/Next.js, build bằng Turbopack/Webpack theo cấu hình.

## Milestone 4 - Benchmark nâng cao

### Công việc Milestone 4

- Disk benchmark: DD, FIO, IOPS, latency.
- CPU benchmark: sysbench, compression, single/multi score.
- Memory benchmark: read/write/latency.
- Network benchmark nhiều location.
- GeoIP, ASN, ISP, BGP enrichment.

### Kết quả bàn giao Milestone 4

- Kết quả benchmark đầy đủ theo yêu cầu.
- Worker xử lý enrichment và scoring.
- Output benchmark dạng text + JSON.

## Milestone 5 - Provider, Compare, Ranking

### Công việc Milestone 5

- Trang so sánh VPS/provider.
- Bar chart, radar chart, line chart.
- Ranking algorithm.
- Provider auto-detection.
- Search provider theo ASN/IP/country/keyword/virtualization.

### Kết quả bàn giao Milestone 5

- So sánh nhiều benchmark/provider.
- Ranking hiệu năng rõ ràng.
- Provider profile có điểm trung bình, ASN, country, website, logo.

## Milestone 6 - User & Admin Dashboard

### Công việc Milestone 6

- User auth.
- Token/API key.
- Lịch sử benchmark theo user.
- Toggle public/private.
- Export PDF/JSON.
- Admin dashboard đầy đủ cho providers, promotions, benchmarks, abuse flags.
- Admin quản lý users, roles, API tokens, benchmark visibility, fake detection review, system settings, cache/queue trạng thái.
- Admin UI có thể dùng Next.js/React hoặc Laravel Livewire + Alpine.js + Bootstrap + jQuery plugins.

### Kết quả bàn giao Milestone 6

- User dashboard sử dụng được.
- Admin dashboard có quyền quản trị đầy đủ theo role.
- Export hoạt động.
- Có audit log thao tác admin quan trọng.

## Milestone 7 - Security & Production

### Công việc Milestone 7

- Signed payload.
- API rate limit.
- Anti fake benchmark detection.
- Input sanitize/validation.
- Cloudflare support.
- CI/CD, backup, cron cleanup.

### Kết quả bàn giao Milestone 7

- Production deployment guide.
- Security guide.
- Backup/restore guide.
- Test report và checklist nghiệm thu.
