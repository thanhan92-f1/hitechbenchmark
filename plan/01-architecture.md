# Plan 01 - Architecture

## Mục tiêu

Thiết kế kiến trúc web benchmark tách rõ frontend, backend, worker, script và hạ tầng để dễ mở rộng.

## Kiến trúc tổng quan

```text
User VPS
  -> Bash Benchmark Script
  -> Backend REST API
  -> Queue/Worker
  -> Database + Cache
  -> Frontend Website
  -> Public/Private Result URL
```

## Thành phần chính

### 1. Frontend

- Ưu tiên Node.js ecosystem.
- Next.js 16.1.6 + React + JavaScript/TypeScript.
- Tailwind CSS.
- Turbopack cho development/build mặc định; Webpack cho legacy asset pipeline nếu cần.
- Dark/light mode.
- Responsive desktop/mobile.
- Chart library: Chart.js hoặc ApexCharts.js; có thể dùng Recharts/ECharts nếu phù hợp.
- Realtime: WebSocket/SSE.
- SEO/social: Open Graph, metadata, sitemap, robots.
- Performance: Priority Hints, image optimization, route-level cache.

### 1.1 Admin UI

- Admin dashboard là module bắt buộc.
- Ưu tiên triển khai chung bằng Next.js/React để đồng nhất frontend.
- Phương án thay thế nếu dùng hệ Laravel mạnh: Laravel Livewire + Alpine.js + Bootstrap.
- Thư viện admin/legacy được phép dùng: jQuery 3.5.1, Select2, SweetAlert2, toastr 2.1.4, Dropzone 5.7.6, Quill, Moment.js 2.29.1, Popper, Hammer.js 2.0.7, core-js 3.8.3.
- Vue.js 2.6.12 chỉ dùng cho widget/legacy admin nếu có lý do rõ ràng, không khuyến nghị trộn vào public Next.js app.

### 2. Backend API

- Ưu tiên Node.js cho API realtime/service mới nếu cần đồng nhất với Next.js.
- Laravel/PHP API vẫn là lựa chọn hợp lệ cho REST API, admin, queue và hệ sinh thái Livewire.
- REST endpoints cho benchmark, providers, compare, statistics.
- Auth user và API token.
- Rate limit theo IP/token.
- Validation request nghiêm ngặt.

### 3. Benchmark Script

- Bash script chạy trên VPS user.
- Detect distro: Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux.
- Auto install dependencies.
- Menu public/private benchmark.
- Sinh JSON payload và gửi về API.

### 4. Worker System

- Queue jobs để xử lý tác vụ nặng:
  - Parse benchmark result.
  - Enrich GeoIP/ASN/BGP.
  - Tính score/ranking.
  - Fake detection.
  - Export PDF.
- Redis Queue + Horizon/Supervisor.

### 5. Database

- PostgreSQL hoặc MySQL.
- Lưu users, benchmarks, benchmark_results, providers, ASNs, countries, promotions, compare_history, API tokens.

### 6. Cache/CDN

- Redis cache cho statistics/ranking/provider summary.
- CDN cache cho trang public result và static assets.
- Cloudflare support.
- HTTP/3 qua Cloudflare/Nginx layer nếu hạ tầng hỗ trợ.

### 7. Web Server/Reverse Proxy

- Nginx 1.24.0 làm reverse proxy.
- Route `/` tới Next.js frontend.
- Route `/api` tới backend API.
- Route `/admin` tới admin app/module.
- Route `/install` tới endpoint script benchmark.

## Luồng Public Benchmark

1. User chạy command install.
2. Script hỏi chọn Public Benchmark.
3. Script thu thập system/network/disk/cpu/memory/security.
4. Script ký payload hoặc lấy challenge token.
5. Backend nhận payload, validate, lưu benchmark pending.
6. Worker enrich dữ liệu, tính score, publish realtime event.
7. Frontend hiển thị trong danh sách VPS vừa test và ranking.

## Luồng Private Benchmark

1. User chọn Private Benchmark.
2. Backend lưu `visibility = private`.
3. Không hiển thị ở public list/ranking.
4. Backend trả private URL có token/hash khó đoán.
5. User có thể share link riêng.

## Quy tắc thiết kế

- API không tin dữ liệu từ script tuyệt đối.
- Benchmark raw data cần lưu để audit.
- Score được tính bởi backend/worker, không lấy score từ client làm dữ liệu tin cậy.
- Public/private phải được enforce ở query layer.
- Mọi endpoint ghi dữ liệu phải có validation, rate limit, signed payload.

## Output của plan này

- Sơ đồ kiến trúc.
- Quyết định stack.
- Danh sách module.
- Luồng dữ liệu public/private.
