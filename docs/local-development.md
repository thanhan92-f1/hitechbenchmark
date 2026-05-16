# Local Development Setup

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20+ | Host runtime for web and worker. |
| pnpm | 9+ | Use `npm install -g pnpm` if needed. |
| Docker + Compose | Latest | PostgreSQL container only. |
| Redis | 7+ | Run on the host, not in Compose. |
| Git | Any | Source control. |

## Quick Start

```bash
git clone <repo-url> hitechbenchmark
cd hitechbenchmark
cp .env.example .env
pnpm install
docker compose up -d database
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Use the root `.env` file only. The default local values are:

```env
APP_URL=http://localhost:3000
APP_PORT=3000
DATABASE_URL=postgresql://hitechbench:password@localhost:5432/hitechbenchmark
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
AI_PROVIDER=disabled
```

Do not create `apps/web/.env.local` or `apps/worker/.env` for this project.

## Infrastructure

Docker Compose starts PostgreSQL only:

```bash
docker compose up -d database
docker compose logs -f database
```

Run Redis locally through your OS package manager, Docker outside this Compose file, or a managed Redis service. The app expects `REDIS_URL=redis://localhost:6379` by default.

## Project Structure

```text
hitechbenchmark/
├── apps/
│   ├── web/          # Next.js 15 frontend + API routes
│   └── worker/       # BullMQ background job processor
├── packages/
│   ├── db/           # Prisma schema + generated client
│   └── shared/       # Shared types and utilities
├── docker/           # Host Nginx reference config
├── docs/
├── install.sh        # Production installer
└── docker-compose.yml # PostgreSQL container only
```

## Common Commands

```bash
pnpm dev                         # start web and worker
pnpm --filter @hitechbenchmark/web dev
pnpm --filter @hitechbenchmark/worker dev
pnpm db:migrate                  # apply migrations
pnpm db:migrate:prod             # deploy migrations
pnpm db:seed                     # seed sample data
pnpm type-check                  # TypeScript checks
pnpm build                       # production build
pnpm docker:dev                  # start PostgreSQL only
```

## Running AI Analysis Locally

For local development with AI, Ollama is the simplest no-key option:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2
```

Then set root `.env`:

```env
AI_PROVIDER=ollama
AI_MODEL=llama3.2
AI_BASE_URL=http://localhost:11434/v1
```

Or use a hosted provider:

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_...
AI_MODEL=llama-3.1-8b-instant
```

## Submitting a Test Benchmark

```bash
curl -X POST http://localhost:3000/api/benchmarks \
  -H "Content-Type: application/json" \
  -d @docs/test-benchmark-payload.json
```

See [API Reference](./api-reference.md) for the full payload schema.

## Troubleshooting

### Port already in use

```bash
netstat -ano | findstr :3000   # Windows
lsof -i :3000                  # Linux/macOS
```

### Prisma client not generated

```bash
pnpm db:generate
```

### pnpm workspace link errors

```bash
pnpm install --force
```

### Worker not picking up jobs

- Verify Redis is running: `redis-cli ping`.
- Check `REDIS_URL` in root `.env`.
- Check worker output from `pnpm --filter @hitechbenchmark/worker dev`.
