# HiTech Benchmark

VPS, cloud server, and dedicated server benchmarking platform.

Run the benchmark client with one command:

```bash
curl -sL https://benchmark.codelab.vn/install | bash
# or
bash <(wget -qO- https://benchmark.codelab.vn/install)
```

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend API | Next.js App Router API routes |
| Database | PostgreSQL 16 in Docker Compose |
| Cache and queue | Host Redis 7, BullMQ |
| Worker | Host Node.js BullMQ worker |
| AI analysis | Anthropic, OpenAI, Groq, Together AI, Ollama, LM Studio |
| Proxy | Host Nginx |
| Package manager | pnpm workspaces, Turborepo |

## Deployment Model

- One root `.env` is used by the web app, worker, Prisma, and scripts.
- Docker Compose runs PostgreSQL only.
- Node.js web, BullMQ worker, Redis, and Nginx run directly on the host.
- `install.sh` configures host packages, `.env`, PostgreSQL, systemd services, and Nginx.

## Project Structure

```text
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
│   └── nginx/        # Host Nginx reference config
├── docs/
├── install.sh        # Production installer
├── docker-compose.yml
└── .env.example
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 20 or newer.
- pnpm 9 or newer.
- Docker and Docker Compose for PostgreSQL.
- Redis running on the host.

### 1. Configure and install

```bash
cp .env.example .env
pnpm install
```

Edit `.env` for local passwords, secrets, and optional integrations.

### 2. Start PostgreSQL

```bash
docker compose up -d database
```

### 3. Prepare the database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. Start development services

```bash
pnpm dev
```

This starts the web app at [http://localhost:3000](http://localhost:3000) and the worker in watch mode.

## Production Installation

Run the interactive installer from the repository root:

```bash
bash install.sh
```

The installer asks for domains, port, HTTPS, database password, AI settings, SMTP settings, and seed preference. It then installs host Node.js/pnpm/Redis/Nginx/Docker as needed, starts PostgreSQL, builds the app, applies migrations, and creates systemd services.

## Common Commands

```bash
pnpm dev                 # run web and worker in development
pnpm build               # build all packages/apps
pnpm type-check          # type-check all packages/apps
pnpm db:migrate          # apply development migrations
pnpm db:migrate:prod     # apply production migrations
pnpm docker:dev          # start PostgreSQL container only
```

Production service logs:

```bash
journalctl -u hitechbenchmark-web -f
journalctl -u hitechbenchmark-worker -f
```

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/install` | Bash benchmark script |
| `GET` | `/api/benchmarks` | List public benchmarks |
| `POST` | `/api/benchmarks` | Submit benchmark |
| `GET` | `/api/benchmarks/:uuid` | Get public benchmark |
| `GET` | `/api/benchmarks/private/:token` | Get private benchmark |
| `GET` | `/api/providers` | List providers |
| `GET` | `/api/statistics` | Platform statistics |
| `GET` | `/api/rankings` | Performance rankings |
| `GET` | `/api/compare?benchmark_ids=a,b` | Compare benchmarks |
| `GET` | `/api/promotions` | VPS deals |

## Admin Access

Default seeded admin account: `admin@hitechbenchmark.com` / `admin123456`.

Visit `/admin` after login.

## Security Notes

- All benchmark payloads are signed with HMAC-SHA256.
- Nonce replay protection prevents duplicate submissions.
- Rate limiting protects benchmark ingest and auth endpoints.
- Anti-fake checks run at ingest and post-processing.
- Private benchmarks never appear in public listings.
- Score calculation is server-side only.
- PostgreSQL is bound to `127.0.0.1:5432` by Docker Compose.

## Scoring Algorithm

| Category | Weight |
| --- | --- |
| CPU | 30% |
| Disk | 25% |
| Network | 25% |
| Memory | 15% |
| Security | 5% |

## Documentation

| Guide | Description |
| --- | --- |
| [Local Development](docs/local-development.md) | Setup dev environment from scratch |
| [Production Deployment](docs/production-deployment.md) | Host Node.js + PostgreSQL container setup |
| [Developer Guide](docs/developer-guide.md) | Architecture, patterns, adding features |
| [AI Configuration](docs/ai-configuration.md) | Multi-provider AI setup |
| [Environment Variables](docs/environment-variables.md) | Root `.env` variables |
| [API Reference](docs/api-reference.md) | Full REST API documentation |
