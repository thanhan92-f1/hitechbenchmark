# Production Deployment Guide

## Architecture Overview

```
Internet → Nginx (reverse proxy + TLS)
                ↓
         Next.js Web App  ←→  PostgreSQL 16
                ↓
         BullMQ Worker    ←→  Redis 7
```

All services run as Docker containers managed by `docker compose`.

---

## Requirements

- VPS/server with at least 2 vCPU, 2 GB RAM
- Docker Engine 24+ and Docker Compose v2
- Domain name with DNS pointed to the server
- (Optional) Anthropic/OpenAI API key for AI analysis

---

## Deployment Steps

### 1. Clone the repository

```bash
git clone <repo-url> /opt/hitechbenchmark
cd /opt/hitechbenchmark
```

### 2. Configure environment

```bash
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env
```

Edit `apps/web/.env`:

```env
DATABASE_URL=postgresql://hitechbenchmark:STRONG_PASSWORD@postgres:5432/hitechbenchmark
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
REDIS_URL=redis://redis:6379
```

Edit `apps/worker/.env`:

```env
DATABASE_URL=postgresql://hitechbenchmark:STRONG_PASSWORD@postgres:5432/hitechbenchmark
REDIS_URL=redis://redis:6379
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
```

### 3. Configure Nginx

Edit `docker/nginx/nginx.conf` — replace `yourdomain.com` with your domain.

For HTTPS (recommended), use Certbot:

```bash
# Install certbot on the host
apt install certbot

# Get certificate
certbot certonly --standalone -d yourdomain.com

# Certificates are in /etc/letsencrypt/live/yourdomain.com/
# Mount them into the nginx container (see docker-compose.yml volumes)
```

### 4. Build and start

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### 5. Run database migrations

```bash
docker compose exec web pnpm --filter @hitechbenchmark/db db:migrate:deploy
```

### 6. Create admin user

```bash
docker compose exec web node -e "
const { PrismaClient } = require('@hitechbenchmark/db');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
prisma.user.create({
  data: {
    email: 'admin@yourdomain.com',
    password: bcrypt.hashSync('your-password', 10),
    role: 'admin',
    isVerified: true,
  }
}).then(u => console.log('Created:', u.email)).finally(() => prisma.\$disconnect());
"
```

---

## Docker Compose Reference

```yaml
# docker/docker-compose.yml (production)
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: hitechbenchmark
      POSTGRES_USER: hitechbenchmark
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    env_file: apps/web/.env
    depends_on: [postgres, redis]
    ports: ["3000:3000"]

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    restart: always
    env_file: apps/worker/.env
    depends_on: [postgres, redis]

  nginx:
    image: nginx:alpine
    restart: always
    ports: ["80:80", "443:443"]
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [web]

volumes:
  postgres_data:
  redis_data:
```

---

## Maintenance

### Update to latest version

```bash
git pull
docker compose -f docker/docker-compose.yml up -d --build
docker compose exec web pnpm --filter @hitechbenchmark/db db:migrate:deploy
```

### View logs

```bash
docker compose logs -f web
docker compose logs -f worker
docker compose logs -f nginx
```

### Backup database

```bash
docker compose exec postgres pg_dump -U hitechbenchmark hitechbenchmark \
  | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore database

```bash
gunzip -c backup-20240101.sql.gz \
  | docker compose exec -T postgres psql -U hitechbenchmark hitechbenchmark
```

---

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is random (min 32 chars)
- [ ] Database password is strong
- [ ] Nginx serves HTTPS only (HTTP redirects to HTTPS)
- [ ] Ports 5432 (PostgreSQL) and 6379 (Redis) are not exposed to the internet
- [ ] Server firewall allows only 80 and 443
- [ ] Automatic security updates enabled (`unattended-upgrades`)
- [ ] Admin accounts use strong passwords

---

## Monitoring

### Health checks

```bash
# Web app
curl https://yourdomain.com/api/health

# Worker job queue (via Redis)
docker compose exec redis redis-cli info stats | grep processed
```

### Resource usage

```bash
docker stats
```

For production monitoring, consider:
- **Uptime monitoring**: UptimeRobot, Betterstack (free tier available)
- **Error tracking**: Sentry (`NEXT_PUBLIC_SENTRY_DSN`)
- **Metrics**: Prometheus + Grafana (add to docker-compose.yml)

---

## Scaling

The worker is stateless and can be scaled horizontally:

```bash
docker compose up -d --scale worker=3
```

BullMQ handles distributed job processing automatically via Redis.

For high traffic, consider:
- Moving PostgreSQL to a managed service (RDS, Supabase, Neon)
- Moving Redis to a managed service (Upstash, Redis Cloud)
- Deploying the web app to Vercel/Railway and only self-hosting the worker
