# Plan 03 - Backend API

## Mục tiêu

Xây REST API cho benchmark, providers, compare, statistics, user dashboard và admin dashboard. Ưu tiên Node.js cho realtime/API gateway nếu triển khai mới; Laravel/PHP vẫn có thể dùng làm backend chính hoặc admin backend.

## Module backend

1. Auth/User.
2. API Token.
3. Benchmark ingest.
4. Benchmark query.
5. Provider management.
6. Compare service.
7. Statistics/ranking.
8. Promotions.
9. Export PDF/JSON.
10. Admin moderation.
11. Admin users/roles.
12. Admin system settings.
13. Admin audit logs.

## Endpoint MVP

### Health

- `GET /api/health`

### Install Script

- `GET /install`
- Trả bash script public.
- Có cache/CDN.

### Benchmark Ingest

- `POST /api/benchmarks`
- Nhận benchmark payload từ script.
- Header cần có:
  - API token hoặc challenge token.
  - timestamp.
  - signature.
- Response:
  - `benchmark_id`
  - `status`
  - `public_url` hoặc `private_url`

### Benchmark Query

- `GET /api/benchmarks`
- Query public benchmark only.
- Filter:
  - country
  - provider
  - ASN
  - CPU
  - RAM
  - virtualization
  - IPv4/IPv6
- `GET /api/benchmarks/{uuid}`
- `GET /api/benchmarks/private/{token}`

### Providers

- `GET /api/providers`
- `GET /api/providers/{slug}`
- `GET /api/providers/{slug}/benchmarks`

### Compare

- `GET /api/compare?benchmark_ids=...`
- `POST /api/compare/history`

### Statistics

- `GET /api/statistics`
- `GET /api/rankings`
- `GET /api/top-vps`
- `GET /api/recent-benchmarks`

### Promotions

- `GET /api/promotions`
- Filter theo country/price/provider.

### User Dashboard

- `GET /api/me`
- `GET /api/me/benchmarks`
- `PATCH /api/me/benchmarks/{uuid}/visibility`
- `POST /api/me/tokens`
- `DELETE /api/me/tokens/{id}`
- `GET /api/me/benchmarks/{uuid}/export/json`
- `GET /api/me/benchmarks/{uuid}/export/pdf`

### Admin

- `GET /api/admin/benchmarks`
- `PATCH /api/admin/benchmarks/{uuid}/status`
- `CRUD /api/admin/providers`
- `CRUD /api/admin/promotions`
- `GET /api/admin/abuse-flags`
- `PATCH /api/admin/abuse-flags/{id}/resolve`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/role`
- `PATCH /api/admin/users/{id}/status`
- `GET /api/admin/api-tokens`
- `DELETE /api/admin/api-tokens/{id}`
- `GET /api/admin/system/settings`
- `PATCH /api/admin/system/settings`
- `GET /api/admin/queue/status`
- `GET /api/admin/audit-logs`

## Admin permissions

- `super_admin`: toàn quyền hệ thống.
- `admin`: quản lý benchmark/provider/promotion/user thông thường.
- `moderator`: duyệt benchmark, xử lý abuse/fake flags.
- `support`: xem benchmark/user/provider, không được xoá dữ liệu quan trọng.

## Admin dashboard chức năng bắt buộc

- Tổng quan hệ thống: benchmark hôm nay, queue, failed jobs, API traffic, provider count.
- Quản lý benchmark: xem raw payload, đổi public/private, flag/unflag, xoá mềm.
- Quản lý provider: logo, website, ASN mapping, country, uptime rating.
- Quản lý promotion/deals: coupon, giá, flash sale, thời gian hiệu lực.
- Quản lý user/API token: khoá/mở user, thu hồi token.
- Duyệt fake/abuse: xem lý do flag, trust score, approve/reject.
- Cấu hình hệ thống: scoring weight, rate limit, Cloudflare/cache, script version.
- Audit log: ghi lại thao tác admin quan trọng.

## Queue Jobs

- `ProcessBenchmarkPayloadJob`
- `DetectProviderJob`
- `EnrichGeoIpJob`
- `CalculateBenchmarkScoreJob`
- `DetectFakeBenchmarkJob`
- `GenerateBenchmarkExportJob`
- `RefreshStatisticsCacheJob`

## Validation chính

- Giới hạn kích thước payload.
- Validate metric ranges.
- Validate timestamp chống replay.
- Verify signature.
- Sanitize hostname/reverse DNS/organization.
- Không cho client tự set score/rank tin cậy.

## Response format chuẩn

- Success:
  - `success: true`
  - `data`
  - `meta` nếu có pagination.
- Error:
  - `success: false`
  - `message`
  - `errors`

## Output của plan này

- API routes.
- Controllers/Services/Requests/Resources.
- OpenAPI/Swagger document.
- Postman collection.
- Queue jobs.
