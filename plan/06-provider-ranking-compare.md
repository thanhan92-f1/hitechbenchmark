# Plan 06 - Provider, Ranking, Compare & Search

## Mục tiêu

Xây hệ thống nhận diện provider, xếp hạng hiệu năng, so sánh VPS/provider và tìm kiếm nhà cung cấp.

## Provider Detection

### Nguồn dữ liệu

- ASN.
- ISP/organization.
- Reverse DNS.
- IP range.
- GeoIP.
- Manual admin mapping.

### Quy tắc

- Ưu tiên mapping ASN/provider do admin cấu hình.
- Nếu không có mapping, dùng organization/ISP.
- Cho phép merge/split provider thủ công.
- Lưu confidence score khi auto-detect.

## Provider Page

### Dữ liệu hiển thị

- Tên provider.
- Logo.
- Website.
- ASN.
- Quốc gia.
- Tổng benchmark.
- Điểm trung bình.
- Uptime rating.
- Top VPS của provider.
- Phân bố location.

## Ranking Algorithm

### Thành phần score

- CPU score.
- Disk score.
- Memory score.
- Network score.
- Security score.

### Công thức gợi ý

- CPU: 30%.
- Disk: 25%.
- Network: 25%.
- Memory: 15%.
- Security/Stability: 5%.

### Lưu ý

- Score phải được normalize theo range thực tế.
- Cần version thuật toán.
- Private benchmark không tham gia ranking public.
- Benchmark bị flagged không được tính ranking.

## Compare Page

### Đối tượng compare

- Benchmark với benchmark.
- Provider với provider.
- Location với location.
- Plan VPS theo giá nếu có dữ liệu.

### Metric compare

- CPU.
- Disk IOPS.
- Network speed.
- RAM.
- IPv4 route.
- Giá VPS.
- Provider.
- Location.

### Chart

- Bar chart cho metric đơn.
- Radar chart cho tổng quan.
- Line chart cho lịch sử/benchmark theo thời gian.

## Search Provider

### Search theo

- ASN.
- IP.
- Quốc gia.
- Keyword.
- Virtualization.

### Kỹ thuật

- Full-text search trong database.
- Index theo ASN/country/provider slug.
- Có thể bổ sung search engine sau nếu dữ liệu lớn.

## Promotions/Deals

### Chức năng

- VPS deals.
- Coupon.
- Flash sale.
- VPS giá rẻ.
- Filter theo country/price/provider.

## Output của plan này

- Provider detection service.
- Ranking service.
- Compare API.
- Search API.
- Provider admin management.
- Chart-ready API response.
