# Environment Variables Reference

## Web App (`apps/web/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | — | Full URL of the app (e.g. `https://yourdomain.com`) |
| `NEXTAUTH_SECRET` | Yes | — | Random secret for session signing. Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Yes | — | Public-facing URL (used for share links, OG meta) |
| `REDIS_URL` | Yes | — | Redis connection string (e.g. `redis://redis:6379`) |
| `NEXT_PUBLIC_GA_ID` | No | — | Google Analytics measurement ID |
| `NEXT_PUBLIC_SENTRY_DSN` | No | — | Sentry error tracking DSN |

---

## Worker (`apps/worker/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (same as web) |
| `REDIS_URL` | Yes | — | Redis connection string (same as web) |
| `AI_PROVIDER` | No | `anthropic` | AI provider: `anthropic` \| `openai` \| `azure` \| `groq` \| `together` \| `ollama` \| `lmstudio` \| `disabled` |
| `AI_API_KEY` | Conditional | — | API key. Not required for `ollama` / `lmstudio`. Also reads `ANTHROPIC_API_KEY` as fallback |
| `AI_MODEL` | No | Provider default | Model name override. See [AI Configuration](./ai-configuration.md) for defaults per provider |
| `AI_BASE_URL` | No | Provider default | Base URL override for custom or self-hosted endpoints |
| `AI_MAX_TOKENS` | No | `1024` | Maximum tokens for AI response |
| `AZURE_OPENAI_ENDPOINT` | Azure only | — | e.g. `https://my-resource.openai.azure.com` |
| `AZURE_OPENAI_DEPLOYMENT` | Azure only | `gpt-4o-mini` | Azure deployment name |
| `AZURE_OPENAI_API_VERSION` | Azure only | `2024-10-21` | Azure API version |

---

## Example Files

### `apps/web/.env.example`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitechbenchmark

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-replace-in-production

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# Optional analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_SENTRY_DSN=https://...
```

### `apps/worker/.env.example`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitechbenchmark

# Redis
REDIS_URL=redis://localhost:6379

# AI Analysis Provider
# Options: anthropic | openai | azure | groq | together | ollama | lmstudio | disabled
AI_PROVIDER=disabled

# Uncomment and set for your chosen provider:
# AI_API_KEY=
# AI_MODEL=
# AI_BASE_URL=
# AI_MAX_TOKENS=1024

# Azure OpenAI (only when AI_PROVIDER=azure)
# AZURE_OPENAI_ENDPOINT=
# AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
# AZURE_OPENAI_API_VERSION=2024-10-21
```

---

## Docker Compose Override

In `docker-compose.yml`, environment variables are loaded from the `.env` files:

```yaml
services:
  web:
    env_file: apps/web/.env
  worker:
    env_file: apps/worker/.env
```

You can also use a top-level `.env` file for shared variables (e.g. `POSTGRES_PASSWORD`) referenced in the compose file itself.
