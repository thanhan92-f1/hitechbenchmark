# Plan 02 - Database Schema

## Mục tiêu

Thiết kế database đủ cho benchmark, provider, user, compare, promotions, ranking và tracking lịch sử.

## Bảng chính

### `users`

- `id`
- `name`
- `email`
- `password`
- `role` enum: `user`, `admin`
- `created_at`, `updated_at`

### `api_tokens`

- `id`
- `user_id`
- `name`
- `token_hash`
- `last_used_at`
- `expires_at`
- `created_at`, `updated_at`

### `benchmarks`

- `id`
- `uuid`
- `user_id` nullable
- `provider_id` nullable
- `asn_id` nullable
- `country_id` nullable
- `visibility` enum: `public`, `private`
- `status` enum: `pending`, `processing`, `completed`, `failed`, `flagged`
- `hostname`
- `os_name`
- `os_version`
- `kernel`
- `architecture`
- `virtualization`
- `cpu_model`
- `cpu_cores`
- `cpu_threads`
- `cpu_frequency_mhz`
- `ram_total_mb`
- `swap_total_mb`
- `disk_total_gb`
- `uptime_seconds`
- `load_average`
- `ipv4`
- `ipv6`
- `reverse_dns`
- `city`
- `region`
- `raw_payload` JSON
- `public_slug`
- `private_token_hash`
- `created_at`, `updated_at`

### `benchmark_results`

- `id`
- `benchmark_id`
- `category` enum: `disk`, `cpu`, `memory`, `network`, `security`
- `metric_name`
- `metric_value`
- `unit`
- `metadata` JSON
- `created_at`, `updated_at`

### `providers`

- `id`
- `name`
- `slug`
- `website_url`
- `logo_url`
- `country_id` nullable
- `asn_id` nullable
- `uptime_rating`
- `avg_score`
- `benchmark_count`
- `metadata` JSON
- `created_at`, `updated_at`

### `asns`

- `id`
- `asn_number`
- `name`
- `organization`
- `country_id` nullable
- `metadata` JSON
- `created_at`, `updated_at`

### `countries`

- `id`
- `code`
- `name`
- `region`
- `created_at`, `updated_at`

### `promotions`

- `id`
- `provider_id`
- `title`
- `description`
- `coupon_code`
- `price`
- `currency`
- `country_id` nullable
- `starts_at`
- `ends_at`
- `is_active`
- `created_at`, `updated_at`

### `compare_history`

- `id`
- `user_id` nullable
- `benchmark_ids` JSON
- `provider_ids` JSON
- `compare_type`
- `created_at`, `updated_at`

## Bảng bổ sung nên có

### `admin_audit_logs`

- `id`
- `admin_user_id`
- `action`
- `entity_type`
- `entity_id`
- `old_values` JSON
- `new_values` JSON
- `ip_address`
- `user_agent`
- `created_at`

### `roles`

- `id`
- `name`
- `description`
- `permissions` JSON
- `created_at`, `updated_at`

### `system_settings`

- `id`
- `key`
- `value` JSON
- `group`
- `is_public`
- `created_at`, `updated_at`

### `benchmark_scores`

- `id`
- `benchmark_id`
- `cpu_score`
- `disk_score`
- `memory_score`
- `network_score`
- `security_score`
- `total_score`
- `rank_snapshot`
- `score_version`
- `created_at`, `updated_at`

### `benchmark_locations`

- `id`
- `benchmark_id`
- `test_location`
- `download_mbps`
- `upload_mbps`
- `ping_ms`
- `jitter_ms`
- `metadata` JSON
- `created_at`, `updated_at`

### `abuse_flags`

- `id`
- `benchmark_id`
- `reason`
- `severity`
- `status`
- `metadata` JSON
- `created_at`, `updated_at`

## Index khuyến nghị

- `benchmarks.uuid` unique.
- `benchmarks.public_slug` unique.
- `benchmarks.visibility, status, created_at`.
- `benchmarks.provider_id, created_at`.
- `benchmarks.asn_id, created_at`.
- `providers.slug` unique.
- `asns.asn_number` unique.
- `benchmark_results.benchmark_id, category`.
- `benchmark_scores.total_score`.
- `admin_audit_logs.admin_user_id, created_at`.
- `roles.name` unique.
- `system_settings.key` unique.

## Quy tắc dữ liệu

- Lưu raw payload để audit, nhưng không hiển thị dữ liệu nhạy cảm.
- IPv4/IPv6 có thể mask một phần nếu cần privacy.
- Private benchmark không được xuất hiện trong public query.
- Score/ranking nên lưu version để sau này đổi thuật toán.
- Mọi thao tác admin quan trọng phải ghi `admin_audit_logs`.
- Role/permission cần đủ để phân quyền `super_admin`, `admin`, `moderator`, `support`.

## Output của plan này

- Migration files.
- Seeders country/provider mẫu.
- ERD database.
- SQL schema bàn giao.
