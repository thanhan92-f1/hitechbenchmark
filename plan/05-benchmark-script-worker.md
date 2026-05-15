# Plan 05 - Benchmark Script & Worker

## Mục tiêu

Tạo bash benchmark script chạy bằng 1 lệnh, tự detect môi trường, benchmark VPS và gửi kết quả lên backend.

## Lệnh cài/chạy

```text
bash <(wget -qO- https://benchmark.codelab.vn/install)
curl -sL https://benchmark.codelab.vn/install | bash
```

## Yêu cầu script

### Distro support

- Ubuntu.
- Debian.
- CentOS.
- AlmaLinux.
- Rocky Linux.

### Auto install dependencies

- `curl`/`wget`.
- `jq`.
- `fio`.
- `sysbench`.
- `iproute2`/`net-tools`.
- `dmidecode` nếu có quyền.
- `speedtest` hoặc fallback endpoint tự quản lý.

### Menu

1. Public benchmark.
2. Private benchmark.

## Dữ liệu cần thu thập

### System Information

- Hostname.
- OS.
- Kernel.
- Architecture.
- Virtualization.
- CPU model.
- CPU cores/threads.
- CPU frequency.
- RAM total/free.
- Swap.
- Disk total/free.
- Uptime.
- Load average.

### Network Information

- IPv4.
- IPv6.
- ASN.
- ISP.
- Organization owner.
- Reverse DNS.
- Datacenter detection.
- BGP information.
- GeoIP.
- Country/region/city.

### Disk Benchmark

- DD write/read.
- FIO random read/write.
- IOPS.
- Latency.
- Queue depth.

### CPU Benchmark

- Sysbench.
- Compression benchmark.
- Single-core score.
- Multi-core score.

### Memory Benchmark

- Read speed.
- Write speed.
- Latency.

### Network Benchmark

- Việt Nam.
- Singapore.
- Japan.
- USA.
- Europe.
- Download/upload/ping/jitter.

### Security Information

- Open ports.
- Firewall detection.
- Kernel hardening.
- KVM/Xen/OpenVZ detection.
- Cloud provider detection.

## Payload JSON đề xuất

- `benchmark_type`: public/private.
- `client_version`.
- `timestamp`.
- `nonce`.
- `system`.
- `network`.
- `disk_results`.
- `cpu_results`.
- `memory_results`.
- `network_results`.
- `security`.
- `signature`.

## Worker xử lý

1. Nhận raw payload.
2. Validate schema.
3. Lưu raw payload.
4. Chuẩn hoá metrics.
5. Enrich GeoIP/ASN/provider.
6. Tính score.
7. Chạy anti-fake checks.
8. Publish realtime event nếu public.
9. Refresh statistics/ranking cache.

## Fallback & an toàn

- Nếu thiếu dependency, script hỏi xác nhận trước khi cài.
- Nếu không chạy được test nặng, ghi metric là unavailable thay vì fail toàn bộ.
- Giới hạn thời gian mỗi test.
- Dọn file test sau khi benchmark.
- Không thu thập secret/env của user.

## Output của plan này

- `install` endpoint trả script.
- Bash script versioned.
- JSON schema payload.
- Worker xử lý benchmark.
- Output text giống YABS/bench.sh.
