# Plan 08 - DevOps & Deployment

## Mục tiêu

Chuẩn hoá môi trường chạy local/staging/production, có Docker, Nginx, Redis queue, worker, cron, backup và CI/CD.

## Docker Compose

### Service cần có

- `frontend` - Node.js + Next.js 16.1.6.
- `backend` - Node.js API hoặc Laravel/PHP API tuỳ quyết định triển khai.
- `admin` - admin dashboard/module nếu tách riêng khỏi frontend/backend.
- `database` - PostgreSQL/MySQL.
- `redis` - cache/queue.
- `worker` - queue worker.
- `scheduler` - cron/schedule runner.
- `nginx` - Nginx 1.24.0 reverse proxy.

## Nginx

### Route chính

- `/` -> frontend.
- `/api` -> backend.
- `/admin` -> admin dashboard/module.
- `/install` -> backend/static script endpoint.
- WebSocket/SSE endpoint nếu dùng realtime.

### Yêu cầu

- Gzip/Brotli nếu có.
- TLS config.
- HTTP/3 ưu tiên qua Cloudflare; nếu self-host thì cân nhắc Nginx build hỗ trợ QUIC/HTTP/3.
- Upload/body size limit phù hợp.
- Cache static assets.

## Queue & Worker

- Redis queue.
- Horizon dashboard nếu dùng Laravel Horizon.
- Supervisor quản lý worker.
- Retry job có giới hạn.
- Failed jobs monitoring.

## Scheduler/Cronjob

- Cleanup benchmark temp data.
- Refresh statistics cache.
- Recalculate provider summary.
- Cleanup expired API tokens/nonces.
- Backup database.

## CI/CD

### Pipeline đề xuất

1. Install dependencies.
2. Lint frontend/backend.
3. Run tests.
4. Build frontend.
5. Build Docker images.
6. Push image.
7. Deploy staging/production.
8. Run migrations.

## Backup

- Database daily backup.
- Retention policy.
- Offsite backup nếu production.
- Restore guide bắt buộc có.

## Environment Variables

### Backend

- `APP_ENV`
- `APP_KEY`
- `APP_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `QUEUE_CONNECTION`
- `BENCHMARK_SIGNING_SECRET`
- `GEOIP_PROVIDER_KEY`
- `CLOUDFLARE_*` nếu dùng

### Frontend

- `NODE_ENV`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_SITE_URL`

### Admin

- `ADMIN_APP_URL`
- `ADMIN_SESSION_DOMAIN`
- `ADMIN_ALLOWED_ROLES`
- `ADMIN_UPLOAD_MAX_SIZE`

### CDN/Proxy

- `CLOUDFLARE_ZONE_ID`
- `CLOUDFLARE_API_TOKEN`
- `ENABLE_HTTP3`
- `TRUSTED_PROXIES`

## Monitoring

- Health checks.
- Error logs.
- Queue failed jobs.
- API latency.
- Benchmark ingest rate.
- Disk/database usage.
- Node.js/Next.js memory usage.
- Nginx 1.24.0 access/error logs.
- Cloudflare cache hit ratio.

## Output của plan này

- `docker-compose.yml`.
- Dockerfiles.
- Nginx config.
- Supervisor config.
- CI/CD workflow.
- Deployment guide.
- Backup/restore guide.
