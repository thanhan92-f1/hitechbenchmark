# Developer Guide

## Monorepo Structure

```
hitechbenchmark/
├── apps/
│   ├── web/                  # Next.js 15 (App Router)
│   │   ├── src/
│   │   │   ├── app/          # Pages + API routes
│   │   │   ├── components/   # React components
│   │   │   └── lib/          # Utilities, auth, db helpers
│   │   └── Dockerfile
│   └── worker/               # BullMQ job processor
│       ├── src/
│       │   ├── jobs/         # Job handler functions
│       │   ├── lib/          # ai-client, utilities
│       │   └── index.ts      # Worker entry point
│       └── Dockerfile
├── packages/
│   ├── db/                   # Prisma schema + generated client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   └── shared/               # Shared types + constants
├── docker/
│   ├── nginx/nginx.conf
│   └── docker-compose.yml
└── docs/
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL 16 via Prisma ORM |
| Auth | NextAuth.js v4 |
| Job Queue | BullMQ + Redis |
| Charts | Recharts |
| AI | Anthropic SDK / OpenAI SDK (multi-provider) |
| Package Manager | pnpm workspaces + Turborepo |
| Language | TypeScript 5 |

---

## Adding a New Feature

### 1. Database change

Add fields to `packages/db/prisma/schema.prisma`, then:

```bash
pnpm --filter @hitechbenchmark/db db:migrate:create -- --name add_my_field
pnpm --filter @hitechbenchmark/db db:migrate
pnpm --filter @hitechbenchmark/db generate
```

### 2. API route

Create `apps/web/src/app/api/my-route/route.ts`:

```typescript
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return apiError('Missing id', 400)

  const item = await db.myModel.findUnique({ where: { id } })
  if (!item) return apiError('Not found', 404)

  return apiResponse(item)
}
```

### 3. Page

Create `apps/web/src/app/my-page/page.tsx`. Server component by default; add `'use client'` for client-side state.

### 4. Background job

Add a job name to `apps/web/src/lib/queue.ts`:

```typescript
export const JOB_NAMES = {
  // ...existing...
  MY_JOB: 'MyJob',
}
```

Create `apps/worker/src/jobs/MyJob.ts`:

```typescript
import { PrismaClient } from '@hitechbenchmark/db'
const prisma = new PrismaClient()

export async function processMyJob({ someId }: { someId: string }) {
  // do work
}
```

Register in `apps/worker/src/index.ts`:

```typescript
case JOB_NAMES.MY_JOB:
  return processMyJob(job.data)
```

Enqueue from anywhere:

```typescript
import { getQueue, JOB_NAMES } from '@/lib/queue'
await getQueue().add(JOB_NAMES.MY_JOB, { someId: '...' }, { priority: 5 })
```

---

## Job Priority Convention

| Priority | Use |
|---|---|
| 1 | Critical (score calculation) |
| 2 | Detection (fake benchmark) |
| 3 | Score finalization |
| 4–5 | Issue detection |
| 6 | AI analysis (can be slow/delayed) |
| 9 | Cache refresh |

---

## Auth & Roles

`apps/web/src/lib/auth.ts` configures NextAuth. Roles: `user`, `admin`.

Protected API routes use `getServerSession`:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'admin') return apiError('Forbidden', 403)
  // ...
}
```

Protected pages use the `middleware.ts` matcher.

---

## UI Components

Located in `apps/web/src/components/ui/`. Minimal custom components built on Tailwind:

- `Badge` — `variant: default | success | warning | error | outline`
- `Card`, `CardHeader`, `CardBody`
- `Button`
- `Input`, `Select`, `Textarea`

---

## Key Utility Functions (`apps/web/src/lib/utils.ts`)

| Function | Purpose |
|---|---|
| `apiResponse(data, meta?)` | Wrap data in `{ success: true, data }` |
| `apiError(message, status)` | Return `{ success: false, error }` with HTTP status |
| `formatRAM(mb)` | `8192 → "8 GB"` |
| `formatDisk(gb)` | `100 → "100 GB"` |
| `formatMbps(n)` | `512.3 → "512.3 Mbps"` |
| `formatMs(n)` | `12.4 → "12.4 ms"` |
| `formatScore(n)` | `78.5 → "78.5"` |
| `getScoreColor(n)` | Returns Tailwind color class by score range |
| `cn(...classes)` | `clsx` + `tailwind-merge` |

---

## AI Analysis Integration

AI analysis is triggered automatically after benchmark scoring. It runs in the background via BullMQ.

To retrigger manually (admin UI or API):

```bash
POST /api/admin/benchmarks/:id/ai-analyze
```

See [AI Configuration](./ai-configuration.md) for provider setup.

The analysis result is stored as `benchmark.aiAnalysis` (JSON) and displayed on the benchmark detail page with tier badge, component analysis, workload recommendations, and bottlenecks.

---

## Performance Issue Detection

`IssueDetectionJob.ts` runs after scoring and checks for:

- CPU steal time (hypervisor contention)
- Disk throttling / fake cache (burst I/O)
- Insufficient RAM
- High latency or low bandwidth
- High load average

Results stored as `benchmark.detectedIssues` (JSON array).

---

## Tools Platform

57 tools organized under `apps/web/src/app/tools/`:

```
tools/
├── ssl/            # SSL certificate checker
├── domain/         # WHOIS, DNS records, propagation
├── ip/             # IP lookup, ASN, reverse DNS, geolocation
├── dev/            # JWT decoder, Base64, JSON formatter, Regex tester, ...
├── web/            # Page speed, screenshot, meta tags, headers, sitemap, ...
└── vietnam/        # Viettel/VNPT ping, VN domain lookup, ...
```

Each tool page at `tools/<category>/<tool>/page.tsx` + API at `api/tools/<tool>/route.ts`.

Tool metadata (icons, descriptions, categories) is in `apps/web/src/lib/tools-data.ts`.

---

## Testing

```bash
# Type check all packages
pnpm type-check

# Run tests (if present)
pnpm test

# Build check
pnpm build
```

Unit tests live next to the files they test (`*.test.ts`).

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes — follow existing patterns, no comments except non-obvious WHY
3. Run `pnpm type-check` before committing
4. Open a PR against `main`
