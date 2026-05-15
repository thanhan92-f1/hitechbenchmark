# Local Development Setup

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker + Docker Compose | Latest | For PostgreSQL + Redis |
| Git | Any | |

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> hitechbenchmark
cd hitechbenchmark
pnpm install

# 2. Start infrastructure
docker compose -f docker/docker-compose.dev.yml up -d

# 3. Configure environment
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env

# 4. Run database migrations
pnpm --filter @hitechbenchmark/db db:migrate

# 5. Seed initial data (optional)
pnpm --filter @hitechbenchmark/db db:seed

# 6. Start all services
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### `apps/web/.env.local`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitechbenchmark

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Redis (for BullMQ job queues)
REDIS_URL=redis://localhost:6379
```

### `apps/worker/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitechbenchmark
REDIS_URL=redis://localhost:6379

# AI Provider (optional for local dev — set to disabled to skip AI analysis)
AI_PROVIDER=disabled
# AI_PROVIDER=anthropic
# AI_API_KEY=sk-ant-...
```

---

## Project Structure

```
hitechbenchmark/
├── apps/
│   ├── web/          # Next.js 15 frontend + API routes
│   └── worker/       # BullMQ background job processor
├── packages/
│   ├── db/           # Prisma schema + client (@hitechbenchmark/db)
│   └── shared/       # Shared types and utilities
├── docker/           # Docker Compose files + nginx config
├── docs/             # This documentation
└── plan/             # Feature planning documents
```

---

## Common Commands

```bash
# Start all (web + worker)
pnpm dev

# Start only web
pnpm --filter @hitechbenchmark/web dev

# Start only worker
pnpm --filter @hitechbenchmark/worker dev

# Database
pnpm --filter @hitechbenchmark/db db:migrate       # apply migrations
pnpm --filter @hitechbenchmark/db db:migrate:create # create new migration
pnpm --filter @hitechbenchmark/db db:studio        # Prisma Studio GUI

# Type checking
pnpm type-check

# Build
pnpm build
```

---

## Docker Services (Dev)

```yaml
# docker/docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: hitechbenchmark
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

---

## Running with AI Analysis Locally

For local development with AI, the easiest option is Ollama (free, no API key):

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2

# Set in apps/worker/.env:
AI_PROVIDER=ollama
AI_MODEL=llama3.2
```

Or use a paid provider with a small model:

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_...
AI_MODEL=llama-3.1-8b-instant
```

---

## Submitting a Test Benchmark

The benchmark client script sends data to `POST /api/benchmarks`. For local testing, you can POST JSON directly:

```bash
curl -X POST http://localhost:3000/api/benchmarks \
  -H "Content-Type: application/json" \
  -d @docs/test-benchmark-payload.json
```

See [API Reference](./api-reference.md) for the full payload schema.

---

## Troubleshooting

**Port already in use**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000   # Windows
lsof -i :3000                  # Linux/Mac
```

**Prisma client not generated**
```bash
pnpm --filter @hitechbenchmark/db generate
```

**pnpm workspace link errors**
```bash
pnpm install --force
```

**Worker not picking up jobs**
- Verify Redis is running: `docker compose ps`
- Check `REDIS_URL` in `apps/worker/.env` matches the running Redis
