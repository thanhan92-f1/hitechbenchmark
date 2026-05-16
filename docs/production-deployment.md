# Production Deployment Guide

## Architecture Overview

```text
Internet → Host Nginx + TLS → Host Next.js web process
                                  ↓
                            PostgreSQL 16 in Docker
                                  ↓
                          Host BullMQ worker → Host Redis
```

Docker Compose is intentionally limited to PostgreSQL. Node.js, pnpm, Redis, Nginx, the web app, and the worker run on the host.

## Requirements

- Linux VPS/server with at least 2 vCPU and 2 GB RAM.
- Domain name with DNS pointing to the server.
- Root or sudo access.
- Optional AI provider API key.

The installer supports common Linux package managers: `apt`, `dnf`, `yum`, `pacman`, and `apk`.

## Recommended Installation

Clone the project and run the root installer:

```bash
git clone <repo-url> /opt/hitechbenchmark
cd /opt/hitechbenchmark
bash install.sh
```

The installer asks for:

- Linux service user.
- Domains and primary domain.
- Host web port, default `3000`.
- HTTPS/Certbot preference.
- PostgreSQL password.
- Auth and benchmark signing secrets.
- AI provider settings.
- SMTP settings.
- Seed preference.

Then it:

- Generates root `.env`.
- Installs host Node.js, pnpm, Redis, Nginx, Certbot, Docker, and Compose when needed.
- Starts the PostgreSQL container with `docker compose up -d database`.
- Installs dependencies with pnpm.
- Generates Prisma client, builds the app, applies migrations, and optionally seeds data.
- Creates `hitechbenchmark-web` and `hitechbenchmark-worker` systemd services.
- Writes a host Nginx site and optionally requests a Let's Encrypt certificate.

## Manual Deployment Notes

### Root `.env`

Use one root `.env` only:

```bash
cp .env.example .env
```

Do not create `apps/web/.env` or `apps/worker/.env`.

Required production values include:

```env
NODE_ENV=production
APP_URL=https://yourdomain.com
APP_PORT=3000
POSTGRES_PASSWORD=replace-with-strong-password
DATABASE_URL=postgresql://hitechbench:replace-with-strong-password@localhost:5432/hitechbenchmark
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=replace-with-random-secret
AUTH_SECRET=replace-with-random-secret
BENCHMARK_SIGNING_SECRET=replace-with-random-secret
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
```

Generate secrets with:

```bash
openssl rand -base64 48
```

### PostgreSQL Container

Start PostgreSQL only:

```bash
docker compose up -d database
docker compose logs -f database
```

The database is bound to `127.0.0.1:5432` and is not exposed publicly.

### Host Dependencies

Install Node.js 20 or newer, pnpm 9, Redis, and Nginx on the host. The installer targets Node.js 22 and pnpm 9.15.0.

### Build and Migrate

```bash
pnpm install --frozen-lockfile --prod=false
pnpm db:generate
pnpm build
pnpm db:migrate:prod
pnpm db:seed
```

### Systemd Services

The installer writes systemd services automatically. Typical manual commands are:

```bash
systemctl status hitechbenchmark-web
systemctl status hitechbenchmark-worker
journalctl -u hitechbenchmark-web -f
journalctl -u hitechbenchmark-worker -f
```

The web process should bind only to `127.0.0.1:${APP_PORT}` and be reached through Nginx.

## Nginx and HTTPS

The generated Nginx site proxies public traffic to `127.0.0.1:${APP_PORT}`. A reference configuration is available at `docker/nginx/nginx.conf`.

For HTTPS, the installer can run Certbot. Manual certificate issuance example:

```bash
certbot --nginx -d yourdomain.com --redirect --agree-tos -m admin@yourdomain.com --no-eff-email
```

## Maintenance

### Update Application

```bash
git pull
pnpm install --frozen-lockfile --prod=false
pnpm db:generate
pnpm build
pnpm db:migrate:prod
systemctl restart hitechbenchmark-web hitechbenchmark-worker
```

### View Logs

```bash
journalctl -u hitechbenchmark-web -f
journalctl -u hitechbenchmark-worker -f
docker compose logs -f database
```

### Backup Database

```bash
docker compose exec -T database pg_dump -U hitechbench hitechbenchmark \
  | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
gunzip -c backup-20240101.sql.gz \
  | docker compose exec -T database psql -U hitechbench hitechbenchmark
```

## Security Checklist

- [ ] Root `.env` is mode `600` and readable by the service user only.
- [ ] `NEXTAUTH_SECRET`, `AUTH_SECRET`, and `BENCHMARK_SIGNING_SECRET` are random.
- [ ] PostgreSQL password is strong.
- [ ] PostgreSQL is bound to `127.0.0.1:5432` only.
- [ ] Redis is bound to localhost or firewalled from the internet.
- [ ] Nginx terminates HTTPS and redirects HTTP to HTTPS.
- [ ] Firewall allows only required public ports, usually `80` and `443`.
- [ ] Admin users use MFA and strong passwords.

## Monitoring

Health check:

```bash
curl https://yourdomain.com/api/health
```

Host service health:

```bash
systemctl is-active hitechbenchmark-web
systemctl is-active hitechbenchmark-worker
redis-cli ping
docker compose ps database
```

For production monitoring, consider UptimeRobot or Better Stack for uptime and Sentry for application errors.

## Scaling

The worker is stateless. For higher throughput, run additional host worker services or move Redis/PostgreSQL to managed services. Keep the public web process behind Nginx, and keep database and Redis private.
