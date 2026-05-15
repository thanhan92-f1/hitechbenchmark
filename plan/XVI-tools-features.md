# XVI. TÍNH NĂNG CÔNG CỤ (TOOLS PLATFORM)

> **Mục tiêu:** Xây dựng nền tảng 80+ công cụ miễn phí cho developer tại Việt Nam, tích hợp vào HiTech Benchmark, với URL `/tools`.

---

## Kiến Trúc

```
apps/web/src/app/tools/
├── page.tsx                    ✅ Landing page (tổng quan tất cả tools)
├── layout.tsx                  ✅ Shared layout / metadata
├── ssl/
│   ├── page.tsx                ✅ SSL group landing
│   ├── check/page.tsx          ✅ SSL Certificate Check
│   ├── http2/page.tsx          ✅ HTTP/2 Check
│   ├── http3/page.tsx          ⬜ HTTP/3 / QUIC Check
│   ├── expiry/page.tsx         ✅ SSL Expiry Monitor (bulk)
│   ├── decode/page.tsx         ⬜ CSR / Certificate Decoder
│   ├── csr/page.tsx            ⬜ CSR Generator
│   ├── hsts/page.tsx           ✅ HSTS Check
│   └── caa/page.tsx            ⬜ CAA Record Check
├── domain/
│   ├── page.tsx                ✅ Domain group landing
│   ├── whois/page.tsx          ✅ Whois / RDAP Lookup
│   ├── dns/page.tsx            ✅ DNS Records (all types)
│   ├── mx/page.tsx             ✅ MX Check
│   ├── ns/page.tsx             ✅ NS Lookup
│   ├── txt/page.tsx            ✅ TXT Lookup
│   ├── spf/page.tsx            ✅ SPF Check + Analyzer
│   ├── dkim/page.tsx           ⬜ DKIM Check
│   ├── dmarc/page.tsx          ✅ DMARC Check + Analyzer
│   ├── rdns/page.tsx           ⬜ Reverse DNS
│   ├── propagation/page.tsx    ⬜ DNS Propagation Check
│   ├── blacklist/page.tsx      ⬜ Blacklist Check
│   └── age/page.tsx            ⬜ Domain Age
├── ip/
│   ├── page.tsx                ✅ IP group landing
│   ├── my/page.tsx             ✅ My IP Address (auto-detect)
│   ├── info/page.tsx           ✅ IP Lookup (ip-api.com)
│   ├── location/page.tsx       ⬜ IP Location Map
│   ├── port/page.tsx           ✅ Port Scanner (TCP connect)
│   ├── subnet/page.tsx         ✅ Subnet Calculator (CIDR)
│   ├── mac/page.tsx            ⬜ MAC Address Lookup
│   ├── redirect/page.tsx       ✅ Redirect Chain Checker
│   └── asn/page.tsx            ⬜ ASN Lookup (RDAP)
├── dev/
│   ├── page.tsx                ✅ Developer tools landing
│   ├── uuid/page.tsx           ✅ UUID v4 / v7 Generator
│   ├── base64/page.tsx         ✅ Base64 Encode / Decode
│   ├── json/page.tsx           ✅ JSON Formatter / Validator
│   ├── password/page.tsx       ✅ Password Generator
│   ├── hash/page.tsx           ✅ Hash (SHA-1/256/384/512)
│   ├── bcrypt/page.tsx         ✅ Bcrypt Hash + Verify
│   ├── url/page.tsx            ✅ URL Encode / Decode / Parse
│   ├── regex/page.tsx          ✅ Regex Tester (real-time)
│   ├── jwt/page.tsx            ✅ JWT Decoder
│   ├── timestamp/page.tsx      ✅ Unix Timestamp Converter
│   ├── diff/page.tsx           ✅ Text Diff (LCS)
│   ├── color/page.tsx          ✅ Color Converter (HEX/RGB/HSL)
│   ├── case/page.tsx           ✅ String Case Converter
│   ├── qr/page.tsx             ✅ QR Code Generator
│   ├── html/page.tsx           ✅ HTML Encode / Decode
│   ├── cron/page.tsx           ✅ Cron Expression Parser
│   ├── yaml/page.tsx           ⬜ YAML ↔ JSON Converter
│   └── gitignore/page.tsx      ✅ .gitignore Generator
├── web/
│   ├── page.tsx                ✅ Web/SEO group landing
│   ├── headers/page.tsx        ✅ HTTP Headers Inspector
│   ├── og/page.tsx             ✅ OpenGraph Preview
│   ├── meta/page.tsx           ⬜ Meta Tag Inspector
│   ├── robots/page.tsx         ⬜ Robots.txt Tester
│   ├── sitemap/page.tsx        ⬜ Sitemap Check
│   ├── cors/page.tsx           ⬜ CORS Check
│   └── utm/page.tsx            ✅ UTM URL Builder
└── vn/
    ├── page.tsx                ✅ Vietnamese tools landing
    ├── tax-business/page.tsx   ✅ MST Doanh Nghiệp (Tổng cục Thuế)
    ├── tax-household/page.tsx  ✅ MST Hộ Kinh Doanh
    ├── traffic/page.tsx        ✅ Tra cứu Phạt Nguội (CSGT)
    └── ip-vn/page.tsx          ✅ IP Vietnam APNIC/RDAP

apps/web/src/app/api/tools/
├── ssl/check/route.ts          ✅ TLS connect → cert info
├── domain/dns/route.ts         ✅ Google DNS-over-HTTPS
├── domain/whois/route.ts       ✅ RDAP (rdap.org)
├── ip/info/route.ts            ✅ ip-api.com
├── ip/port/route.ts            ✅ TCP connect port check
├── web/headers/route.ts        ✅ HTTP HEAD + redirect chain
├── web/og/route.ts             ✅ Fetch HTML → parse OG meta
├── dev/bcrypt/route.ts         ✅ bcryptjs hash + verify
├── vn/traffic/route.ts         ✅ CSGT API proxy
├── vn/tax/route.ts             ✅ Tổng cục Thuế API proxy
└── vn/rdap/route.ts            ✅ APNIC RDAP proxy

apps/web/src/lib/
└── tools-data.ts               ✅ Shared tool definitions (icon, href, description)

apps/web/src/components/tools/
└── ToolPageShell.tsx           ✅ Shared breadcrumb + title shell

apps/web/src/app/about/page.tsx ✅ About Us page
```

---

## Nhóm Công Cụ

### 1. SSL Tools (8 tools)

| ID | Tên | Route | Trạng thái | Triển khai |
|----|-----|-------|------------|-----------|
| check | SSL Check | /tools/ssl/check | ✅ Done | TLS connect, lấy cert info |
| http2 | HTTP/2 Check | /tools/ssl/http2 | ✅ Done | Alt-Svc header detection |
| http3 | HTTP/3 / QUIC | /tools/ssl/http3 | ⬜ Pending | Alt-Svc: h3 detection |
| expiry | SSL Expiry | /tools/ssl/expiry | ✅ Done | Bulk check, days remaining |
| decode | CSR Decoder | /tools/ssl/decode | ⬜ Pending | Parse PEM blocks client-side |
| csr | CSR Generator | /tools/ssl/csr | ⬜ Pending | Web Crypto API |
| hsts | HSTS Check | /tools/ssl/hsts | ✅ Done | Strict-Transport-Security header |
| caa | CAA Record | /tools/ssl/caa | ⬜ Pending | DNS CAA type 257 lookup |

### 2. Domain & DNS (12 tools)

| ID | Tên | Route | Trạng thái | Triển khai |
|----|-----|-------|------------|-----------|
| whois | Whois/RDAP | /tools/domain/whois | ✅ Done | rdap.org API |
| dns | DNS Records | /tools/domain/dns | ✅ Done | Google DoH |
| mx | MX Check | /tools/domain/mx | ✅ Done | DNS type MX |
| ns | NS Lookup | /tools/domain/ns | ✅ Done | DNS type NS |
| txt | TXT Lookup | /tools/domain/txt | ✅ Done | DNS type TXT + categorize |
| spf | SPF Check | /tools/domain/spf | ✅ Done | Parse SPF record |
| dkim | DKIM Check | /tools/domain/dkim | ⬜ Pending | DNS TXT _domainkey |
| dmarc | DMARC Check | /tools/domain/dmarc | ✅ Done | DNS TXT _dmarc + parse |
| rdns | Reverse DNS | /tools/domain/rdns | ⬜ Pending | DNS PTR type |
| propagation | DNS Propagation | /tools/domain/propagation | ⬜ Pending | Query multiple resolvers |
| blacklist | Blacklist Check | /tools/domain/blacklist | ⬜ Pending | DNSBL lookup |
| age | Domain Age | /tools/domain/age | ⬜ Pending | RDAP created date |

### 3. IP & Network (8 tools)

| ID | Tên | Route | Trạng thái | Triển khai |
|----|-----|-------|------------|-----------|
| my | My IP | /tools/ip/my | ✅ Done | ip-api.com auto-detect |
| info | IP Lookup | /tools/ip/info | ✅ Done | ip-api.com |
| location | IP Location Map | /tools/ip/location | ⬜ Pending | ip-api.com + embed map |
| port | Port Scanner | /tools/ip/port | ✅ Done | TCP net.connect() |
| subnet | Subnet Calculator | /tools/ip/subnet | ✅ Done | Pure JS CIDR math |
| mac | MAC Lookup | /tools/ip/mac | ⬜ Pending | macvendors.com API |
| redirect | Redirect Checker | /tools/ip/redirect | ✅ Done | HTTP HEAD + follow |
| asn | ASN Lookup | /tools/ip/asn | ⬜ Pending | RDAP autnum |

### 4. Developer Tools (18 tools)

| ID | Tên | Route | Trạng thái | Triển khai |
|----|-----|-------|------------|-----------|
| uuid | UUID Generator | /tools/dev/uuid | ✅ Done | crypto.randomUUID() + v7 |
| base64 | Base64 | /tools/dev/base64 | ✅ Done | btoa/atob, URL-safe |
| json | JSON Formatter | /tools/dev/json | ✅ Done | JSON.parse/stringify |
| password | Password Generator | /tools/dev/password | ✅ Done | crypto.getRandomValues |
| hash | Hash Generator | /tools/dev/hash | ✅ Done | SubtleCrypto SHA-1/256/512 |
| bcrypt | Bcrypt | /tools/dev/bcrypt | ✅ Done | bcryptjs server-side |
| url | URL Encode/Decode | /tools/dev/url | ✅ Done | encodeURIComponent + URL parse |
| regex | Regex Tester | /tools/dev/regex | ✅ Done | RegExp + highlighting |
| jwt | JWT Decoder | /tools/dev/jwt | ✅ Done | Base64 decode, exp check |
| timestamp | Unix Timestamp | /tools/dev/timestamp | ✅ Done | Date conversions |
| diff | Text Diff | /tools/dev/diff | ✅ Done | LCS line-by-line diff |
| color | Color Converter | /tools/dev/color | ✅ Done | HEX ↔ RGB ↔ HSL |
| case | Case Converter | /tools/dev/case | ✅ Done | camel/snake/kebab/Pascal |
| qr | QR Code | /tools/dev/qr | ✅ Done | api.qrserver.com |
| html | HTML Encode/Decode | /tools/dev/html | ✅ Done | HTML entities |
| cron | Cron Parser | /tools/dev/cron | ✅ Done | Parse + explain |
| yaml | YAML ↔ JSON | /tools/dev/yaml | ⬜ Pending | Basic YAML convert |
| gitignore | .gitignore Generator | /tools/dev/gitignore | ✅ Done | Templates per stack |

### 5. Web & SEO (7 tools)

| ID | Tên | Route | Trạng thái | Triển khai |
|----|-----|-------|------------|-----------|
| headers | HTTP Headers | /tools/web/headers | ✅ Done | Fetch HEAD, security audit |
| og | OpenGraph Preview | /tools/web/og | ✅ Done | Parse HTML meta tags |
| meta | Meta Tag Inspector | /tools/web/meta | ⬜ Pending | Parse all meta tags |
| robots | Robots.txt Tester | /tools/web/robots | ⬜ Pending | Fetch + parse rules |
| sitemap | Sitemap Check | /tools/web/sitemap | ⬜ Pending | Find + parse XML sitemap |
| cors | CORS Check | /tools/web/cors | ⬜ Pending | OPTIONS preflight check |
| utm | UTM Builder | /tools/web/utm | ✅ Done | URL params builder |

### 6. Việt Nam (4 tools)

| ID | Tên | Route | Trạng thái | Triển khai |
|----|-----|-------|------------|-----------|
| tax-business | MST Doanh Nghiệp | /tools/vn/tax-business | ✅ Done | BKNS/GDT API |
| tax-household | MST Hộ Kinh Doanh | /tools/vn/tax-household | ✅ Done | GDT API |
| traffic | Tra cứu Phạt Nguội | /tools/vn/traffic | ✅ Done | CSGT API proxy |
| ip-vn | IP Vietnam APNIC | /tools/vn/ip-vn | ✅ Done | APNIC RDAP |

---

## Thống Kê

| Nhóm | Tổng | Hoàn thành | Còn lại |
|------|------|-----------|---------|
| SSL Tools | 8 | 5 | 3 |
| Domain & DNS | 12 | 8 | 4 |
| IP & Network | 8 | 6 | 2 |
| Developer Tools | 18 | 17 | 1 |
| Web & SEO | 7 | 4 | 3 |
| Việt Nam | 4 | 4 | 0 |
| **Tổng** | **57** | **44** | **13** |

---

## Các API Bên Ngoài Sử Dụng

| API | URL | Dùng cho | Auth | Giới hạn |
|-----|-----|----------|------|----------|
| Google DNS-over-HTTPS | https://dns.google/resolve | DNS lookups | Không | Cao |
| ip-api.com | http://ip-api.com/json/ | IP info | Không (phi TM) | 45 req/min |
| RDAP (rdap.org) | https://rdap.org/domain/ | Whois/RDAP | Không | Không rõ |
| APNIC RDAP | https://rdap.apnic.net/ | IP VN info | Không | Không rõ |
| QR Server | https://api.qrserver.com/ | QR Code gen | Không | Fair use |
| BKNS/GDT | https://api.bkns.vn/ | MST lookup | Không (public) | Không rõ |
| CSGT | checkvin.vn | Phạt nguội | Không (public) | Không rõ |

---

## Ghi Chú Kỹ Thuật

### Header Mega-menu
- Dropdown khi click "Công Cụ" trên header
- Hiển thị 6 nhóm x top 4 tools + "Xem tất cả"
- Đóng khi click outside (useRef + mousedown listener)
- Mobile: collapsible section trong mobile nav

### Tool Page Shell
- Breadcrumb: Công Cụ → [Group] → [Tool]
- Tiêu đề + mô tả tool
- Tất cả tool page dùng `ToolPageShell` component

### Data Flow
- Client-side tools: chạy hoàn toàn trong browser (UUID, Base64, JSON, Hash, URL, Regex, etc.)
- Server-side tools: Next.js API routes proxy đến external API (SSL, DNS, IP, HTTP Headers)
- Vietnamese tools: proxy qua Next.js API để tránh CORS issues

### Rate Limiting
- Các API endpoints nhạy cảm (port scan, bcrypt) nên thêm rate limit khi deploy production
- Port scanner giới hạn 25 ports / request, timeout 3 giây mỗi port

---

## Roadmap Còn Lại

### Phase 1 - Core (✅ Hoàn thành phần lớn)
- [x] Header mega-menu với Tools dropdown
- [x] About Us page
- [x] Tools landing page
- [x] 6 group pages
- [x] 44/57 individual tool pages

### Phase 2 - Hoàn thiện (⬜ Đang làm)
- [ ] DKIM Check (DNS TXT _domainkey.domain)
- [ ] Reverse DNS (DNS PTR)
- [ ] MAC Address Lookup (macvendors.com)
- [ ] ASN Lookup (RDAP)
- [ ] DNS Propagation (query multiple resolvers)
- [ ] Domain Blacklist Check (DNSBL)
- [ ] Domain Age (from RDAP created date)
- [ ] YAML ↔ JSON converter
- [ ] CORS Check (OPTIONS preflight)
- [ ] Meta Tag Inspector (parse all HTML meta)
- [ ] Robots.txt Tester
- [ ] Sitemap Validator

### Phase 3 - Enhancement
- [ ] SSL CSR Generator (Web Crypto API)
- [ ] SSL Decode (PEM parser)
- [ ] HTTP/3 / QUIC Check
- [ ] IP Location Map (embed iframe)
- [ ] Bcrypt/hash rate limiting
- [ ] OpenGraph: support iframe/embed URL preview
- [ ] Search across all tools
- [ ] Tool favorites / recently used (localStorage)
- [ ] Vietnamese Calendar tool
- [ ] Subnet visualizer map

### Phase 4 - Vietnamese Tools Extension
- [ ] Tra cứu số điện thoại (đầu số, nhà mạng)
- [ ] Tra cứu số CMND/CCCD (tính toán ngày sinh)
- [ ] Kiểm tra hóa đơn điện tử
- [ ] Tra cứu giá xăng dầu
