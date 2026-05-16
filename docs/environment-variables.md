# Environment Variables Reference

HiTech Benchmark uses one root `.env` file. Do not create app-specific env files under `apps/web` or `apps/worker`.

Start from the template:

```bash
cp .env.example .env
```

Production installs can also generate `.env` interactively:

```bash
bash install.sh
```

## Runtime Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | `production` | Runtime environment. |
| `APP_URL` | Yes | `http://localhost:3000` | Public application URL. |
| `APP_PORT` | Yes | `3000` | Host Node.js web port bound to `127.0.0.1`. |
| `CERTBOT_EMAIL` | HTTPS | — | Email used by Certbot and admin notices. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. Docker Compose exposes PostgreSQL on `127.0.0.1:5432`. |
| `POSTGRES_PASSWORD` | Yes | `password` | PostgreSQL password used by Docker Compose. |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Host Redis connection string. |
| `QUEUE_CONNECTION` | Yes | `redis` | Queue backend. |

## Authentication and Security

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXTAUTH_URL` | Yes | same as `APP_URL` | Public URL used by NextAuth. |
| `NEXTAUTH_SECRET` | Yes | — | Random session signing secret. |
| `AUTH_SECRET` | Yes | — | Auth.js-compatible secret. |
| `BENCHMARK_SIGNING_SECRET` | Yes | — | HMAC secret for benchmark payload signatures. |
| `WEBAUTHN_RP_ID` | MFA | domain | WebAuthn relying party ID. |
| `WEBAUTHN_ORIGIN` | MFA | `APP_URL` | WebAuthn origin. |

Generate production secrets with:

```bash
openssl rand -base64 48
```

## Public Web Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | `APP_URL` | Public site URL for links and metadata. |
| `NEXT_PUBLIC_API_URL` | Yes | `APP_URL` | Public API base URL. |
| `NEXT_PUBLIC_WS_URL` | Yes | `ws://localhost:3000` | Public WebSocket URL. Use `wss://domain` behind HTTPS. |
| `NEXT_PUBLIC_SITE_NAME` | No | `HiTech Benchmark` | Display site name. |
| `SCRIPT_VERSION` | No | `1.0.0` | Benchmark client version. |
| `NEXT_PUBLIC_GA_ID` | No | — | Google Analytics measurement ID. |
| `NEXT_PUBLIC_SENTRY_DSN` | No | — | Public Sentry DSN. |
| `CDN_URL` | No | — | Optional CDN base URL. |

## OAuth Providers

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret. |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth client ID. |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth client secret. |

## Email

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `EMAIL_SERVER_HOST` | Email | — | SMTP host. |
| `EMAIL_SERVER_PORT` | Email | `587` | SMTP port. |
| `EMAIL_SERVER_USER` | Email | — | SMTP username. |
| `EMAIL_SERVER_PASSWORD` | Email | — | SMTP password. |
| `EMAIL_SERVER_SECURE` | Email | `false` | Use TLS directly on connect. |
| `EMAIL_FROM` | Email | `HiTech Benchmark <noreply@domain>` | Sender address. |

## AI Analysis

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `AI_PROVIDER` | No | `disabled` | `anthropic`, `openai`, `azure`, `groq`, `together`, `ollama`, `lmstudio`, or `disabled`. |
| `AI_API_KEY` | Provider-dependent | — | API key for non-local providers. |
| `ANTHROPIC_API_KEY` | Anthropic fallback | — | Optional Anthropic-specific key. |
| `AI_MODEL` | No | provider default | Model override. |
| `AI_BASE_URL` | No | provider default | Custom API base URL. |
| `AI_MAX_TOKENS` | No | `1024` | Maximum generated tokens. |
| `AZURE_OPENAI_ENDPOINT` | Azure | — | Azure OpenAI endpoint. |
| `AZURE_OPENAI_DEPLOYMENT` | Azure | `gpt-4o-mini` | Azure deployment name. |
| `AZURE_OPENAI_API_VERSION` | Azure | `2024-10-21` | Azure API version. |

## GeoIP, Admin, and Limits

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GEOIP_PROVIDER` | No | `ipapi` | GeoIP provider. |
| `GEOIP_API_KEY` | No | — | GeoIP API key when required. |
| `TRUSTED_PROXIES` | No | — | Trusted proxy CIDRs. |
| `CLOUDFLARE_ZONE_ID` | No | — | Cloudflare zone ID. |
| `CLOUDFLARE_API_TOKEN` | No | — | Cloudflare API token. |
| `ENABLE_HTTP3` | No | `false` | HTTP/3 feature flag. |
| `ADMIN_APP_URL` | No | `${APP_URL}/admin` | Admin URL. |
| `ADMIN_ALLOWED_ROLES` | No | `super_admin,admin,moderator,support` | Roles allowed in admin. |
| `ADMIN_UPLOAD_MAX_SIZE` | No | `5242880` | Upload size limit in bytes. |
| `RATE_LIMIT_BENCHMARK_INGEST` | No | `10` | Benchmark submissions per window. |
| `RATE_LIMIT_WINDOW_SECONDS` | No | `60` | Rate limit window length. |

## Docker Compose

`docker-compose.yml` only reads root `.env` for PostgreSQL settings. It does not run Node.js, Redis, or Nginx.

```bash
docker compose up -d database
```
