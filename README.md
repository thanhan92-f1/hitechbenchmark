# HiTech Benchmark

VPS / Cloud Server / Dedicated Server Benchmarking Platform.

Run with one command:
```bash
curl -sL https://benchmark.codelab.vn/install | bash
# or
bash <(wget -qO- https://benchmark.codelab.vn/install)
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15.x + React 19 + TypeScript + Tailwind CSS |
| Backend API | Next.js App Router API Routes |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis 7 + BullMQ |
| Worker | Node.js + BullMQ worker |
| Proxy | Nginx 1.24 |
| Container | Docker Compose |

## Project Structure

```
hitechbenchmark/
├── apps/
│   ├── web/          # Next.js app (frontend + API)
│   └── worker/       # BullMQ job processor
├── packages/
│   ├── db/           # Prisma schema + seed
│   └── shared/       # Shared TypeScript types
├── scripts/
│   └── benchmark.sh  # Bash benchmark script
├── docker/
│   ├── nginx/        # Nginx config
│   ├── Dockerfile.web
│   └── Dockerfile.worker
├── docker-compose.yml
└── .env.example
```

## Quick Start (Local Dev)

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### 1. Clone & Install

```bash
cp .env.example .env
# Edit .env with your settings

pnpm install
```

### 2. Start Docker services (DB + Redis)

```bash
docker compose up -d database redis
```

### 3. Run database migrations

```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Start development servers

```bash
pnpm dev
```

This starts:
- `apps/web` at http://localhost:3000
- `apps/worker` watching for queue jobs

### 5. Test the install endpoint

```bash
curl http://localhost:3000/install
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/install` | Bash benchmark script |
| GET | `/api/benchmarks` | List public benchmarks |
| POST | `/api/benchmarks` | Submit benchmark |
| GET | `/api/benchmarks/:uuid` | Get public benchmark |
| GET | `/api/benchmarks/private/:token` | Get private benchmark |
| GET | `/api/providers` | List providers |
| GET | `/api/statistics` | Platform statistics |
| GET | `/api/rankings` | Performance rankings |
| GET | `/api/compare?benchmark_ids=a,b` | Compare benchmarks |
| GET | `/api/promotions` | VPS deals |

### Admin Access

Default admin: `admin@hitechbenchmark.com` / `admin123456`

Visit `/admin` after login.

## Production Deployment

```bash
# Build and start all services
docker compose up -d --build

# Run migrations
docker compose exec web pnpm db:migrate:prod
```

## Security Notes

- All benchmark payloads are signed with HMAC-SHA256
- Nonce replay protection prevents duplicate submissions
- Rate limiting on ingest endpoint (10 req/min/IP by default)
- Anti-fake checks at ingest and post-processing
- Private benchmarks never appear in public listings
- Score calculation is server-side only

## Scoring Algorithm

| Category | Weight |
|----------|--------|
| CPU | 30% |
| Disk | 25% |
| Network | 25% |
| Memory | 15% |
| Security | 5% |
