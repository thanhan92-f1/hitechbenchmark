# Plan 07 - Security & Anti-Fake

## Mục tiêu

Bảo vệ API, hạn chế benchmark giả, chống abuse, đảm bảo dữ liệu public đáng tin cậy.

## API Security

### Authentication

- API token cho user/API client.
- Challenge token ngắn hạn cho benchmark script anonymous.
- Token lưu dạng hash.

### Signed Payload

- Payload có:
  - timestamp.
  - nonce.
  - signature.
  - client version.
- Backend kiểm tra timestamp để chống replay.
- Nonce chỉ dùng một lần trong khoảng thời gian cho phép.

### Rate Limit

- Theo IP.
- Theo API token.
- Theo ASN/provider nếu cần.
- Endpoint ingest benchmark cần strict limit hơn endpoint read.

## Input Validation

- Validate schema JSON.
- Giới hạn kích thước payload.
- Sanitize hostname, reverse DNS, ISP, organization.
- Không render HTML raw từ payload.
- Validate metric range để loại dữ liệu vô lý.

## Anti-Fake Benchmark

### Kiểm tra cơ bản

- CPU/RAM/disk/network có tương quan hợp lý.
- Network speed vượt ngưỡng bất thường phải flagged.
- IOPS/latency không hợp lý phải flagged.
- Timestamp test quá ngắn hoặc thiếu raw metric phải flagged.

### Kiểm tra nguồn

- IP gửi API có khớp IPv4/IPv6 trong payload không.
- ASN từ server lookup có khớp ASN payload không.
- GeoIP từ backend là nguồn tin cậy hơn client.

### Scoring trust

- Mỗi benchmark có `trust_score`.
- Benchmark trust thấp không vào ranking.
- Admin có thể approve/reject flagged benchmark.

## Abuse Protection

- Cloudflare/WAF support.
- Block IP/token abuse.
- Captcha cho web actions nhạy cảm nếu cần.
- Queue isolation cho job nặng.
- Retry job có giới hạn.

## Data Privacy

- Private benchmark không xuất hiện trong listing, ranking, search public.
- Private URL dùng token/hash khó đoán.
- Không thu thập secret, environment variables hoặc file nhạy cảm.
- Có thể mask IP public theo policy.

## Security Headers

- CSP.
- HSTS.
- X-Frame-Options.
- X-Content-Type-Options.
- Referrer-Policy.

## Output của plan này

- Security checklist.
- Signed payload implementation.
- Rate limit config.
- Anti-fake rules.
- Admin abuse review flow.
- Security guide bàn giao.
