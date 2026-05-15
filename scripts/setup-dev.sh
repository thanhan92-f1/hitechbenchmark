#!/usr/bin/env bash
# Quick dev setup: create env files, apply DB migrations, seed data
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== HiTech Benchmark Dev Setup ==="

# 1. Create apps/web/.env.local if missing
WEB_ENV="$ROOT/apps/web/.env.local"
if [ ! -f "$WEB_ENV" ]; then
  echo "Creating $WEB_ENV ..."
  SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  cat > "$WEB_ENV" <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitechbenchmark
AUTH_SECRET=$SECRET
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
EOF
  echo "  Created with random AUTH_SECRET"
else
  echo "  $WEB_ENV already exists, skipping"
fi

# 2. Create apps/worker/.env if missing
WORKER_ENV="$ROOT/apps/worker/.env"
if [ ! -f "$WORKER_ENV" ]; then
  echo "Creating $WORKER_ENV ..."
  cat > "$WORKER_ENV" <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitechbenchmark
REDIS_URL=redis://localhost:6379
AI_PROVIDER=disabled
EOF
  echo "  Created (AI disabled by default)"
else
  echo "  $WORKER_ENV already exists, skipping"
fi

# 3. Create root .env for Prisma CLI (db scripts load from ../../.env)
ROOT_ENV="$ROOT/.env"
if [ ! -f "$ROOT_ENV" ]; then
  echo "Creating $ROOT_ENV for Prisma CLI ..."
  cat > "$ROOT_ENV" <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitechbenchmark
EOF
fi

echo ""
echo "=== Installing dependencies ==="
cd "$ROOT" && pnpm install

echo ""
echo "=== Applying database migrations ==="
cd "$ROOT" && pnpm --filter @hitechbenchmark/db db:migrate:prod

echo ""
echo "=== Seeding database ==="
cd "$ROOT" && pnpm --filter @hitechbenchmark/db db:seed

echo ""
echo "=== Done! ==="
echo ""
echo "Admin account: admin@hitechbenchmark.com / admin123456"
echo "Start development: pnpm dev"
echo "Open: http://localhost:3000"
