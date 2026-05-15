# API Reference

Base URL: `https://yourdomain.com/api`

All responses follow the format:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

---

## Public Endpoints

### Submit Benchmark

```
POST /api/benchmarks
Content-Type: application/json
```

Submits a new benchmark result. No authentication required.

**Request body** (partial — send what you have):

```json
{
  "uuid": "optional-uuid-v4",
  "hostname": "my-vps",
  "ipv4": "1.2.3.4",
  "ipv6": "2001:db8::1",
  "osName": "Ubuntu",
  "osVersion": "22.04",
  "kernel": "5.15.0-91-generic",
  "architecture": "x86_64",
  "virtualization": "kvm",
  "cpuModel": "Intel Xeon E5-2680 v4",
  "cpuCores": 4,
  "cpuThreads": 8,
  "cpuFrequencyMhz": 2400,
  "ramTotalMb": 8192,
  "swapTotalMb": 2048,
  "diskTotalGb": 100,
  "uptimeSeconds": 86400,
  "loadAverage": "0.12 0.08 0.03",
  "results": [
    { "category": "cpu", "metricName": "Sysbench Single", "metricValue": 1250, "unit": "events/s" },
    { "category": "disk", "metricName": "FIO Read 4K", "metricValue": 450, "unit": "MB/s" }
  ],
  "locations": [
    {
      "testLocation": "Singapore",
      "downloadMbps": 512.3,
      "uploadMbps": 210.5,
      "pingMs": 12.4,
      "jitterMs": 0.8
    }
  ],
  "rawPayload": { }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uuid": "abc123",
    "id": "clxxx"
  }
}
```

---

### Get Benchmark

```
GET /api/benchmarks/:uuid
```

Returns full benchmark data including scores, locations, and AI analysis.

**Response:**

```json
{
  "success": true,
  "data": {
    "uuid": "abc123",
    "hostname": "my-vps",
    "scores": [{ "totalScore": 78.5, "cpuScore": 82, "diskScore": 71, ... }],
    "locations": [ ... ],
    "aiAnalysis": { "tier": "strong", "summary": "...", ... },
    "detectedIssues": [ ... ]
  }
}
```

---

### Get Benchmarks List

```
GET /api/benchmarks?page=1&limit=20&search=ubuntu&provider=vultr&country=US
```

| Query param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `search` | string | Search hostname or IP |
| `provider` | string | Filter by provider slug |
| `country` | string | Filter by 2-letter country code |
| `sort` | string | `score`, `created`, `cpu`, `disk`, `network` |

---

### Network Quality Analysis

```
GET /api/benchmarks/:uuid/network-analysis
```

Returns computed network quality grade and metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "overallScore": 84,
    "grade": "B",
    "avgDownloadMbps": 487.3,
    "avgUploadMbps": 215.1,
    "avgPingMs": 18.4,
    "avgJitterMs": 1.2,
    "bestLocation": "Singapore",
    "worstLocation": "London",
    "consistency": 91,
    "summary": "Network grade B: 487 Mbps download, 18 ms average ping, 5 test locations.",
    "strengths": ["Fast download (avg 487 Mbps)", "Low latency (avg 18 ms)"],
    "weaknesses": [],
    "asnInfo": { "asNumber": 20473, "name": "AS-VULTR", "organization": "Vultr Holdings LLC" }
  }
}
```

---

### Compare Benchmarks

```
GET /api/benchmarks/compare?uuids=uuid1,uuid2,uuid3
```

Returns benchmark data for up to 4 UUIDs side by side.

---

## Authenticated Endpoints

All endpoints below require a valid session cookie (NextAuth). Send requests from a browser session or pass the session token.

### My Benchmarks

```
GET /api/me/benchmarks
```

Returns benchmarks claimed by the authenticated user.

---

### Monitoring Servers

```
GET /api/me/monitoring
POST /api/me/monitoring
```

**POST body:**

```json
{
  "nickname": "My VPS",
  "hostname": "vps.example.com",
  "interval": "weekly"
}
```

Intervals: `daily` | `weekly` | `monthly`

```
DELETE /api/me/monitoring/:id
PATCH  /api/me/monitoring/:id
```

**PATCH body:**

```json
{
  "isActive": false,
  "nickname": "Updated name",
  "interval": "monthly"
}
```

---

## Admin Endpoints

Require `role: admin` on the authenticated user.

### Users

```
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
```

### Providers

```
GET    /api/admin/providers
POST   /api/admin/providers
PATCH  /api/admin/providers/:id
DELETE /api/admin/providers/:id
```

### Feature Flags

```
GET    /api/admin/flags
POST   /api/admin/flags
PATCH  /api/admin/flags/:key
```

### Promotions

```
GET    /api/admin/promotions
POST   /api/admin/promotions
PATCH  /api/admin/promotions/:id
DELETE /api/admin/promotions/:id
```

### Audit Logs

```
GET /api/admin/audit-logs?page=1&action=login&userId=...
```

### Re-trigger AI Analysis

```
POST /api/admin/benchmarks/:id/ai-analyze
```

Forces re-enqueue of the AI analysis job for a specific benchmark.

---

## Tools Endpoints

```
GET /api/tools/ssl?domain=example.com
GET /api/tools/dns?domain=example.com&type=A
GET /api/tools/whois?domain=example.com
GET /api/tools/ip-lookup?ip=1.2.3.4
GET /api/tools/port-check?host=example.com&port=80
GET /api/tools/ping?host=example.com
GET /api/tools/traceroute?host=example.com
GET /api/tools/http-headers?url=https://example.com
GET /api/tools/page-speed?url=https://example.com
GET /api/tools/screenshot?url=https://example.com
GET /api/tools/meta-tags?url=https://example.com
GET /api/tools/sitemap?url=https://example.com
```

---

## Rate Limits

| Endpoint group | Limit |
|---|---|
| `POST /api/benchmarks` | 10 req/min per IP |
| Tool endpoints | 30 req/min per IP |
| Public GET endpoints | 120 req/min per IP |
| Admin endpoints | 60 req/min (authenticated) |
