# Plan 09 - Testing & Acceptance

## Mục tiêu

Đảm bảo hệ thống đúng yêu cầu, ổn định, bảo mật và có tiêu chí nghiệm thu rõ ràng.

## Test Backend

### Unit Test

- Services tính score.
- Provider detection.
- Signed payload verification.
- Payload validation.
- Visibility public/private.

### Feature/API Test

- `POST /api/benchmarks`.
- `GET /api/benchmarks` chỉ trả public result.
- `GET /api/benchmarks/private/{token}`.
- Provider APIs.
- Compare APIs.
- Statistics/ranking APIs.
- User token APIs.

## Test Frontend

### UI Test

- Trang chủ responsive.
- Copy command hoạt động.
- Dark/light mode.
- Filter recent benchmark.
- Provider list/detail.
- Compare charts.
- User dashboard.
- Admin dashboard render đúng trên desktop/tablet.
- Chart.js/ApexCharts.js hiển thị dữ liệu đúng.
- Open Graph metadata đúng cho trang benchmark/provider/compare.
- Các plugin admin như Select2, SweetAlert2, toastr, Dropzone, Quill hoạt động nếu được dùng.

### E2E Test

- User chạy benchmark mẫu -> có result URL.
- Public benchmark xuất hiện trong recent list.
- Private benchmark không xuất hiện public.
- So sánh 2 benchmark.
- Export JSON/PDF.
- Admin đăng nhập, duyệt benchmark flagged, cập nhật provider, tạo promotion.

## Test Script

### Distro Test

- Ubuntu.
- Debian.
- CentOS.
- AlmaLinux.
- Rocky Linux.

### Kịch bản

- Dependency đã có sẵn.
- Dependency chưa có.
- Không có quyền root.
- Network timeout.
- FIO/sysbench thiếu hoặc fail.
- Public mode.
- Private mode.

## Security Test

- Payload thiếu signature bị reject.
- Timestamp cũ bị reject.
- Nonce replay bị reject.
- Rate limit hoạt động.
- XSS từ hostname/reverse DNS không render.
- Private URL không thể đoán dễ.

## Performance Test

- Ingest nhiều benchmark đồng thời.
- Query recent benchmarks.
- Ranking/statistics cache.
- Worker queue throughput.
- Frontend load time.
- Next.js 16.1.6 build/start ổn định trên Node.js.
- Turbopack/Webpack build không lỗi.
- Cloudflare cache/HTTP/3 không làm sai route API/admin.

## Tiêu chí nghiệm thu MVP

- Chạy được 1 lệnh bash benchmark.
- Thu thập system/network/disk/cpu/memory cơ bản.
- Gửi result lên API thành công.
- Có public/private result.
- Public result hiển thị website.
- Private result không hiển thị public.
- Có trang recent benchmarks.
- Có provider list cơ bản.
- Có admin dashboard cơ bản để quản lý benchmark/provider/promotion.
- Có Docker setup local.
- Có API document.

## Tiêu chí nghiệm thu bản hoàn chỉnh

- Đầy đủ dashboard user/admin.
- Admin có role/permission, audit log, abuse/fake review, queue/cache monitor.
- Đầy đủ compare/ranking/search/provider/deals.
- Có anti-fake và signed payload.
- Có realtime update.
- Có worker queue và retry job.
- Có CI/CD, Nginx, backup, deployment guide.
- Có security guide.
- Có test report.

## Output của plan này

- Test plan.
- Automated tests.
- Manual QA checklist.
- Acceptance checklist.
- Test report bàn giao.
