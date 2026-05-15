# HiTech Benchmark — Advanced Features Roadmap

> **Legend:** ✅ Done · 🔄 In Progress · 🔲 Planned · ⭐ Priority Next

---

## Milestones 1–7 (Already Implemented)

| Feature | Status |
|---------|--------|
| Monorepo structure (pnpm + Turborepo) | ✅ |
| Prisma schema + PostgreSQL | ✅ |
| Docker Compose + Nginx | ✅ |
| BullMQ Worker (6 jobs) | ✅ |
| NextAuth.js v5 — Credentials | ✅ |
| **OAuth: Google + GitHub** | ✅ |
| API routes: benchmarks, providers, rankings, compare, stats | ✅ |
| User APIs: /me, /me/benchmarks, /me/tokens, visibility toggle | ✅ |
| Admin panel (benchmarks, users, flags, promotions, audit-logs, settings) | ✅ |
| Frontend: home, benchmarks list/detail, providers, compare, deals, rankings | ✅ |
| Search page /search (hostname, CPU, IP, ISP, org) | ✅ |
| Score charts (Radar, Bar, Network speed) | ✅ |
| Export JSON | ✅ |
| Anti-fake system (HMAC, nonce, IP check, trust score) | ✅ |
| Rate limiting (Redis-based) | ✅ |
| Security headers (CSP, HSTS, Permissions-Policy) | ✅ |
| CI/CD GitHub Actions + Dockerfiles | ✅ |
| Dashboard: visibility toggle + API token manager | ✅ |

---

## XV. Advanced Features

### 1. AI Performance Analysis ⭐
**Status:** 🔲  
**Description:** Integrate Claude API to analyze benchmark results and provide natural language feedback.

- [ ] Call Claude API with benchmark metrics as context
- [ ] Classify VPS tier: weak / average / strong / enterprise
- [ ] Detect bottlenecks: CPU steal, disk throttling, bad routing, overselling
- [ ] Suggest suitable workloads: web hosting, Docker, Kubernetes, game server, database, AI inference, streaming, VPN, proxy, backup storage
- [ ] Store AI analysis in DB (`ai_analysis` JSON field on Benchmark)
- [ ] Display on benchmark detail page
- [ ] Admin can regenerate analysis

**Files to create/modify:**
- `apps/web/src/lib/ai-analysis.ts` — Claude API integration
- `apps/worker/src/jobs/AiAnalysisJob.ts` — background job
- `packages/db/prisma/schema.prisma` — add `aiAnalysis Json?` to Benchmark
- `apps/web/src/app/benchmarks/[uuid]/page.tsx` — display AI section

---

### 2. Realtime Live Benchmark ⭐
**Status:** 🔲  
**Description:** WebSocket streaming of benchmark progress while the bash script runs.

- [ ] WebSocket server in Next.js (`/api/ws/benchmark/[uuid]`)
- [ ] Benchmark script publishes progress to Redis pub/sub
- [ ] Worker subscribes and forwards to WebSocket clients
- [ ] Live UI: CPU%, RAM%, network throughput, disk IO progress bars
- [ ] Progress steps: `connecting → system_info → cpu_bench → disk_bench → network_test → done`

**Files to create:**
- `apps/web/src/app/api/ws/benchmark/[uuid]/route.ts`
- `apps/web/src/components/benchmark/LiveProgress.tsx`
- `scripts/benchmark.sh` — add progress event publishing

---

### 3. Global Latency Map ⭐
**Status:** 🔲  
**Description:** Interactive world map showing ping latency from the benchmarked VPS to global regions.

- [ ] Use `react-simple-maps` or Leaflet for world map
- [ ] Overlay heatmap from `locations[]` ping data
- [ ] Color-code by ping: green (<20ms), yellow (20–80ms), orange (80–150ms), red (>150ms)
- [ ] Traceroute visualization (hop-by-hop path)
- [ ] BGP route visualization (optional, via RIPE API)

**Files to create:**
- `apps/web/src/components/benchmark/LatencyMap.tsx`
- `apps/web/src/components/benchmark/TracerouteView.tsx`

---

### 4. Smart Provider Detection
**Status:** ✅ (basic ASN-based), 🔲 (advanced)  

Currently detects provider via ASN lookup. Enhancements needed:
- [ ] IP range database (AWS, GCP, Azure, Oracle, Cloudflare, Akamai)
- [ ] Reverse DNS pattern matching (ec2.amazonaws.com, cloud.google.com)
- [ ] BGP prefix lookup (via bgp.tools API)
- [ ] Tencent Cloud, Alibaba Cloud, OVH, Contabo detection
- [ ] Confidence score for detection

**Files to modify:**
- `apps/worker/src/jobs/DetectProviderJob.ts`
- `apps/web/src/lib/provider-detection.ts` (create)

---

### 5. Benchmark Anti-Fake System
**Status:** ✅ (core implemented)  

Already implemented: HMAC signature, nonce replay protection, IP mismatch, RAM/disk sanity checks, trust score.

Advanced enhancements:
- [ ] CPU benchmark consistency check (cross-validate sysbench vs compression)
- [ ] Disk speed plausibility bounds per virtualization type
- [ ] Speedtest result cross-validation (download vs upload ratio)
- [ ] VM tampering detection (DMI data spoofing)
- [ ] Benchmark token binding (token hash → IP lock)

---

### 6. VPS Stability Test
**Status:** 🔲  

- [ ] Extended stress test modes: 1h / 6h / 24h (user opt-in)
- [ ] CPU stress with temperature monitoring
- [ ] RAM stability (memtest-style)
- [ ] Disk endurance (write amplification detection)
- [ ] Network packet loss monitor over time
- [ ] Store stability results as separate `StabilityTest` model
- [ ] Cron-based re-run for registered VPS

---

### 7. Historical Monitoring
**Status:** 🔲  

- [ ] `MonitoredServer` model — user registers a VPS for periodic benchmarking
- [ ] Cron benchmarks: daily / weekly / monthly
- [ ] Performance timeline chart (score over time)
- [ ] Degradation detection (score drops >10% → alert)
- [ ] Noisy neighbor detection (performance variance spikes)
- [ ] Email/webhook alert on degradation

**Files to create:**
- `packages/db/prisma/schema.prisma` — `MonitoredServer`, `MonitoringResult`
- `apps/worker/src/jobs/ScheduledBenchmarkJob.ts`
- `apps/web/src/app/dashboard/monitoring/page.tsx`

---

### 8. Public Ranking System
**Status:** ✅ (basic rankings page exists)  

Enhancements:
- [ ] Top fastest VPS (by totalScore)
- [ ] Top network VPS (by networkScore)
- [ ] Top disk VPS (by diskScore)
- [ ] Top budget VPS (price/performance — needs price data)
- [ ] Top provider by country
- [ ] Top ARM VPS (filter by cpuModel containing "ARM"/"Ampere"/"Graviton")
- [ ] Top AMD VPS
- [ ] Top Intel VPS
- [ ] Rankings with provider logo + flag

**Files to modify:**
- `apps/web/src/app/rankings/page.tsx`
- `apps/web/src/app/api/rankings/route.ts` — add category filter

---

### 9. Price / Performance Score
**Status:** 🔲  

- [ ] `ProviderPlan` model: (provider, plan_name, vcpu, ram_gb, disk_gb, price_usd, bandwidth_tb)
- [ ] Price/performance ratio: `totalScore / price_usd`
- [ ] Giá/IOPS, giá/bandwidth, giá/vCPU, giá/RAM
- [ ] "Best value" badge on provider pages
- [ ] Best budget VPS list
- [ ] Best enterprise VPS list

---

### 10. VPS Marketplace Data
**Status:** 🔲  

- [ ] `ProviderPlan` crawler (Vultr, Hetzner, DigitalOcean, Linode public APIs)
- [ ] Price sync job (daily)
- [ ] Promotion/coupon aggregation
- [ ] DDoS protection info
- [ ] IPv4 pricing
- [ ] Deals page enhancement (auto-populated from crawler)

---

### 11. Cloud Gaming Test
**Status:** 🔲  

- [ ] GPU detection (nvidia-smi, lspci)
- [ ] OpenGL / Vulkan detection
- [ ] NVENC/NVDEC codec detection
- [ ] FPS estimate benchmark (glmark2 or similar)
- [ ] Cloud gaming suitability score

---

### 12. AI Workload Benchmark
**Status:** 🔲  

- [ ] Ollama detection and benchmark
- [ ] LLM token/sec measurement
- [ ] CUDA availability check
- [ ] Stable Diffusion inference speed (if GPU present)
- [ ] AI inference score in benchmark results

---

### 13. Container/K8s Benchmark
**Status:** ✅ (detection in anti-fake), 🔲 (full benchmark)  

Currently detects: KVM, OpenVZ, LXC, Xen.

Enhancements:
- [ ] Docker overhead benchmark (container vs bare-metal speed)
- [ ] OverlayFS read/write speed
- [ ] Kubernetes node detection (check for kubelet, /etc/kubernetes)
- [ ] VMware / Hyper-V detection via DMI

---

### 14. Advanced Network Analysis ⭐
**Status:** 🔲  

- [ ] MTR test (multi-hop traceroute with packet loss)
- [ ] BGP prefix lookup via bgp.tools API
- [ ] Route quality score (hops, AS path length)
- [ ] Jitter analysis and variance
- [ ] CDN compatibility test (Cloudflare, Fastly detection)
- [ ] Streaming quality score

**Files to create:**
- `apps/web/src/app/api/benchmarks/[uuid]/network-analysis/route.ts`
- `apps/web/src/components/benchmark/NetworkAnalysis.tsx`

---

### 15. Website Performance Test
**Status:** 🔲  

- [ ] TTFB test from the VPS to external URLs
- [ ] HTTP/2 and HTTP/3 support detection
- [ ] TLS version and cipher check
- [ ] CDN detection via response headers
- [ ] Cache headers analysis
- [ ] SSL score (similar to SSL Labs)

---

### 16. Security Audit ⭐
**Status:** ✅ (basic: open ports, firewall, kernel hardening in script)  

Enhancements:
- [ ] SSH config audit (PermitRootLogin, PasswordAuthentication)
- [ ] Fail2Ban detection
- [ ] Kernel CVE check (compare running kernel vs known CVEs)
- [ ] Docker socket exposure check
- [ ] Open database port detection (3306, 5432, 27017, 6379)
- [ ] Security score breakdown on benchmark detail page

---

### 17. Storage Analysis ⭐
**Status:** 🔲  

- [ ] SSD/HDD/NVMe type detection via `lsblk -d -o name,rota,type`
- [ ] RAID detection
- [ ] ZFS / Btrfs / Ceph detection
- [ ] Network storage detection (NFS, iSCSI)
- [ ] Thin provisioning detection
- [ ] Queue depth benchmark (fio with multiple queue depths: 1, 4, 16, 32)
- [ ] Mixed workload benchmark (70% read / 30% write)

---

### 18. Benchmark API SDK
**Status:** 🔲  

- [ ] REST API documentation (OpenAPI/Swagger at `/api/docs`)
- [ ] Python SDK (`pip install hitechbenchmark`)
- [ ] Node.js SDK (`npm install @hitechbenchmark/sdk`)
- [ ] Go SDK
- [ ] PHP SDK
- [ ] Webhook support: `benchmark.completed`, `benchmark.flagged`, `vps.degraded`
- [ ] Webhook delivery with retry + HMAC verification

**Files to create:**
- `apps/web/src/app/api/docs/route.ts`
- `packages/sdk/` (Node.js SDK)

---

### 19. Telegram / Discord Integration
**Status:** 🔲  

- [ ] Telegram bot (`@HiTechBenchBot`)
  - `/benchmark <uuid>` — fetch result
  - `/compare <uuid1> <uuid2>` — compare
  - Notify when user's VPS benchmark completes
- [ ] Discord bot
  - Slash commands
  - Rich embed with benchmark result
- [ ] User can connect Telegram/Discord in Dashboard settings

---

### 20. Multi-Language (i18n)
**Status:** 🔲  

- [ ] Install `next-intl`
- [ ] Supported: Vietnamese, English, Chinese (Simplified), Japanese
- [ ] Language switcher in Header
- [ ] Auto-detect from `Accept-Language` header
- [ ] Translation files: `messages/vi.json`, `messages/en.json`, `messages/zh.json`, `messages/ja.json`

---

### 21. Dark Web / Blacklist Check ⭐
**Status:** 🔲  

- [ ] AbuseIPDB API integration (`abuseipdb.com`)
- [ ] Spamhaus lookup (DNSBL query)
- [ ] TOR exit node check
- [ ] VPN/residential IP detection (IPHub, IPData)
- [ ] Mail blacklist check (MXToolbox API)
- [ ] Blacklist score displayed on benchmark detail page

---

### 22. Internet Quality Score
**Status:** 🔲  

- [ ] Composite score for different use cases:
  - Gaming: low ping + low jitter + stable connection
  - Streaming: high download + low packet loss
  - VPN: bandwidth + no blacklist
  - Hosting: uptime + low TTFB + DDoS protection
  - AI workload: RAM + CPU multi-thread + GPU
  - Enterprise: stability + SLA + redundancy
- [ ] Score 0–100 per use case
- [ ] Displayed as use-case badge grid

---

### 23. Benchmark Certificate ⭐
**Status:** 🔲  

- [ ] PDF certificate generation (using `@react-pdf/renderer` or Puppeteer)
- [ ] Certificate includes: hostname, scores, date, UUID QR code
- [ ] Public verification URL: `/verify/<uuid>`
- [ ] Digital signature (ED25519) to prove authenticity
- [ ] Download button on benchmark detail page

**Files to create:**
- `apps/web/src/app/api/me/benchmarks/[uuid]/export/pdf/route.ts`
- `apps/web/src/app/verify/[uuid]/page.tsx`
- `apps/web/src/lib/certificate.ts`

---

### 24. Realtime Status Page
**Status:** 🔲  

- [ ] `/status` public page
- [ ] Queue depth (waiting, active, completed, failed)
- [ ] Worker health (last heartbeat)
- [ ] Speedtest node availability
- [ ] API response time (self-ping)
- [ ] PostgreSQL + Redis connectivity
- [ ] Historical uptime chart (90-day)

---

### 25. Distributed Benchmark System
**Status:** 🔲  

- [ ] Worker nodes in Asia, Europe, America
- [ ] Each worker node can ping the benchmarked VPS from its region
- [ ] Reverse ping measurement: VPS → node latency
- [ ] Global routing quality score
- [ ] Node registration system
- [ ] Worker node health monitoring

---

### 26. Advanced Search Engine ⭐
**Status:** ✅ (basic: hostname, CPU, IP, city, ISP, org)  

Enhancements:
- [ ] Filter by RAM range (e.g., 512MB – 32GB)
- [ ] Filter by CPU cores range
- [ ] Filter by benchmark score range
- [ ] Filter by bandwidth / IOPS
- [ ] Filter by ASN number
- [ ] Filter by provider slug
- [ ] Filter by country code
- [ ] Filter by virtualization type
- [ ] Full-text search index (PostgreSQL GIN index on `to_tsvector`)
- [ ] Search result highlighting

---

### 27. Custom Benchmark Profile
**Status:** 🔲  

- [ ] Users create named benchmark profiles with custom weights
- [ ] Profile types: gaming, database, AI, web hosting, storage, streaming
- [ ] Custom scoring formula (adjust CPU/disk/network weights)
- [ ] Share profile via URL
- [ ] Compare VPS using custom profile score

---

### 28. Browser Terminal
**Status:** 🔲  

- [ ] WebSocket-based xterm.js terminal
- [ ] Diagnostic mode: read-only SSH that runs predefined commands
- [ ] Temporary agent with time-limited token
- [ ] Realtime log streaming from benchmark script

**Note:** High security risk — implement with strict sandboxing.

---

### 29. Mobile App API Ready
**Status:** 🔲  

- [ ] REST API versioning (`/api/v1/`)
- [ ] JWT bearer token auth for mobile
- [ ] Push notification via Firebase Cloud Messaging
- [ ] API endpoints for: latest benchmarks, user benchmarks, compare, rankings
- [ ] Rate limiting per API key for mobile apps

---

### 30. Enterprise Features
**Status:** 🔲  

- [ ] Team/Organization model
- [ ] Multi-user workspace with shared benchmarks
- [ ] RBAC: owner / admin / member / viewer
- [ ] Team audit logs
- [ ] SSO (SAML 2.0 / OIDC)
- [ ] LDAP/Active Directory integration
- [ ] SLA monitoring dashboard
- [ ] Enterprise API with higher rate limits

---

### 31. Fraud / Abuse Detection ⭐
**Status:** ✅ (basic: anti-fake, trust score)  

Enhancements:
- [ ] Duplicate VPS detection (same hardware fingerprint, different IP)
- [ ] Bot submission detection (timing patterns, user-agent)
- [ ] ASN abuse score (% of flagged benchmarks per ASN)
- [ ] Proxy/VPN submit detection
- [ ] Velocity check: >3 benchmarks/hour from same ASN = suspicious

---

### 32. Smart Scoring Engine ⭐
**Status:** ✅ (weighted scoring implemented in worker)  

Enhancements:
- [ ] Region-adjusted scoring (compare vs peers in same country)
- [ ] Provider-adjusted scoring (compare vs same provider)
- [ ] AI-weighted ranking (normalize for hardware generation)
- [ ] Stability bonus/penalty (long uptime = bonus, high load avg = penalty)
- [ ] Score confidence interval (based on number of benchmark runs)

---

### 33. Auto Issue Detection ⭐
**Status:** 🔲  

- [ ] Disk throttling: detect if fio throughput drops significantly mid-test
- [ ] CPU steal: detect via `/proc/stat` steal time
- [ ] Shared noisy neighbor: high load average vs low sysbench score
- [ ] Packet loss: detect via ping test with 100+ packets
- [ ] Bad routing: high ping variance between speedtest nodes
- [ ] RAM bottleneck: swap usage > 0 during benchmark

**Files to create:**
- `apps/worker/src/jobs/IssueDetectionJob.ts`
- `packages/shared/src/issue-rules.ts`

---

### 34. Advanced Export ⭐
**Status:** ✅ (JSON export done)  

Remaining:
- [ ] CSV export (`/api/me/benchmarks/[uuid]/export/csv`)
- [ ] PDF certificate (`/api/me/benchmarks/[uuid]/export/pdf`)
- [ ] Markdown summary (`/api/me/benchmarks/[uuid]/export/markdown`)
- [ ] HTML shareable page (static, embeddable)
- [ ] XML export for integrations

---

### 35. CDN & Streaming Test
**Status:** 🔲  

- [ ] Netflix unlock detection (`fast.com` reachability from VPS)
- [ ] YouTube CDN server location detection
- [ ] Cloudflare routing (1.1.1.1 traceroute)
- [ ] TikTok CDN detection
- [ ] Streaming suitability score

---

### 36. IPv6 & BGP Analysis ⭐
**Status:** 🔲  

- [ ] IPv6 connectivity score (dual-stack check)
- [ ] IPv6-only reachability test
- [ ] BGP hijack detection (compare announced prefix vs expected)
- [ ] Route leak analysis
- [ ] RPKI validation status

---

### 37. Auto Benchmark Agent
**Status:** 🔲  

- [ ] Daemon mode for `benchmark.sh` (runs as systemd service)
- [ ] Periodic metric collection (every 5 minutes)
- [ ] Alert webhook when performance drops >15%
- [ ] Lightweight: single binary (Go or static bash)
- [ ] Secure: sends only aggregated metrics, no root required

---

### 38. Prometheus / Grafana Export
**Status:** 🔲  

- [ ] `/api/metrics` endpoint (Prometheus format)
- [ ] Metrics: benchmark queue depth, worker throughput, API latency
- [ ] Grafana dashboard JSON template
- [ ] AlertManager rules for queue backup, worker failure
- [ ] Loki log shipping from worker

---

### 39. AI Recommendation Engine
**Status:** 🔲  

- [ ] Based on user's benchmark history + use-case profile
- [ ] Recommend: better VPS plan, different provider, region upgrade
- [ ] "Users with similar workload also use..." recommendations
- [ ] Price optimization suggestions
- [ ] Powered by Claude API with structured output

---

### 40. Community Features ⭐
**Status:** 🔲  

- [ ] Provider reviews (star rating + text, verified benchmark required)
- [ ] Comment on benchmark results
- [ ] Upvote/downvote benchmark
- [ ] Community ranking (crowdsourced provider reputation)
- [ ] "Verified Benchmark" badge (passed anti-fake + human review)
- [ ] User reputation score

**Files to create:**
- `packages/db/prisma/schema.prisma` — `Review`, `Comment`, `Vote` models
- `apps/web/src/app/api/reviews/route.ts`
- `apps/web/src/components/community/ReviewForm.tsx`

---

## XVI. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Cloudflare                        │
└─────────────────┬───────────────────────────────────┘
                  │
          ┌───────▼────────┐
          │   Nginx 1.24   │  Rate limiting, TLS, CSP
          └───────┬────────┘
                  │
     ┌────────────▼──────────────┐
     │    Next.js 15 (web)       │  App Router, SSR, API routes
     │    Port 3000               │
     └────────────┬──────────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
┌───▼────┐  ┌────▼────┐  ┌──────▼──────┐
│Prisma  │  │ Redis 7 │  │  BullMQ     │
│  ORM   │  │ Cache   │  │  Worker     │
└───┬────┘  └─────────┘  └─────────────┘
    │
┌───▼──────────┐
│ PostgreSQL 16│
└──────────────┘
```

### Microservices Roadmap

| Service | Status | Description |
|---------|--------|-------------|
| API Service (Next.js) | ✅ | REST API + SSR frontend |
| Benchmark Worker | ✅ | BullMQ job processor |
| Queue Service | ✅ | Redis + BullMQ |
| Speedtest Worker | 🔲 | Distributed speedtest nodes |
| AI Analysis Service | 🔲 | Claude API integration |
| Realtime WebSocket Service | 🔲 | Live benchmark streaming |
| Monitoring/Scheduler Service | 🔲 | Cron benchmarks, alerting |

### Infrastructure

| Component | Status |
|-----------|--------|
| Docker Compose (dev) | ✅ |
| Nginx reverse proxy | ✅ |
| PostgreSQL 16 | ✅ |
| Redis 7 | ✅ |
| GitHub Actions CI | ✅ |
| Dockerfiles (web + worker) | ✅ |
| MinIO/S3 (PDF/assets) | 🔲 |
| Prometheus + Grafana | 🔲 |
| K8s manifests | 🔲 |

---

## XVII. Development Phases

### Phase 1 — Foundation ✅ COMPLETE
- [x] Benchmark core (script + ingest + processing)
- [x] Public/private results
- [x] Compare page
- [x] Rankings page
- [x] Admin panel
- [x] OAuth login (Google + GitHub)

### Phase 2 — Intelligence ⭐ NEXT
- [ ] AI Performance Analysis (#1) — Claude API
- [ ] Advanced Network Analysis (#14)
- [ ] Auto Issue Detection (#33)
- [ ] Security Audit enhancement (#16)
- [ ] Smart Scoring Engine enhancement (#32)
- [ ] Historical Monitoring (#7)
- [ ] Benchmark Certificate/PDF (#23)

### Phase 3 — Scale
- [ ] Realtime Live Benchmark (#2)
- [ ] Global Latency Map (#3)
- [ ] Distributed Benchmark System (#25)
- [ ] Auto Benchmark Agent (#37)
- [ ] Prometheus/Grafana (#38)
- [ ] Historical Monitoring cron (#7)

### Phase 4 — Ecosystem
- [ ] AI Recommendation Engine (#39)
- [ ] Community Features (#40)
- [ ] Mobile App API (#29)
- [ ] Telegram/Discord Bot (#19)
- [ ] Enterprise Features (#30)
- [ ] Multi-Language i18n (#20)
- [ ] VPS Marketplace Crawler (#10)

---

## Setup: OAuth Credentials

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
4. Copy Client ID + Secret to `.env`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (dev)
   - `https://yourdomain.com/api/auth/callback/github` (prod)
4. Copy Client ID + Secret to `.env`

---

## Next Immediate Steps (Phase 2)

```bash
# 1. Set up OAuth credentials in .env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# 2. Restart dev server (picks up Prisma client regeneration)
pnpm dev

# 3. Test OAuth at http://localhost:3000/login
```
