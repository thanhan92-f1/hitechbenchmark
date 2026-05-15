# Plan 04 - Frontend UI

## Mục tiêu

Xây frontend hiện đại, responsive, hỗ trợ dark/light mode, realtime dashboard, biểu đồ benchmark và trải nghiệm copy script dễ dùng.

## Công nghệ đề xuất

- Ưu tiên Node.js ecosystem cho giao diện.
- Next.js 16.1.6 + React + JavaScript/TypeScript.
- Tailwind CSS.
- Turbopack cho development/build chính của Next.js.
- Webpack cho legacy/admin assets nếu cần.
- shadcn/ui hoặc component system tương đương.
- Chart.js và ApexCharts.js cho biểu đồ benchmark/admin.
- Recharts/ECharts có thể dùng bổ sung nếu cần.
- TanStack Query/SWR để gọi API.
- WebSocket/SSE cho realtime.

## Thư viện giao diện được phép dùng

- Bootstrap cho admin layout hoặc legacy screens.
- Alpine.js cho tương tác nhẹ trong admin/Laravel views.
- Vue.js 2.6.12 chỉ dùng cho widget legacy nếu cần, không ưu tiên cho public app.
- Laravel Livewire cho admin nếu backend chọn Laravel.
- jQuery 3.5.1 cho plugin legacy/admin.
- SweetAlert2 cho confirm dialog.
- toastr 2.1.4 cho toast notification.
- Select2 cho select/search nâng cao trong admin.
- Dropzone 5.7.6 cho upload logo/file.
- Quill cho rich text editor mô tả provider/promotion.
- Moment.js 2.29.1 cho xử lý date legacy; ưu tiên API native/date-fns nếu làm mới.
- Popper cho tooltip/dropdown của Bootstrap.
- Hammer.js 2.0.7 cho gesture nếu cần chart/mobile interaction.
- core-js 3.8.3 cho polyfill legacy nếu bắt buộc.

## SEO, CDN và performance

- Open Graph metadata cho benchmark/provider/compare share link.
- Priority Hints cho tài nguyên quan trọng.
- Cloudflare CDN cache static assets và public result pages.
- HTTP/3 qua Cloudflare khi production hỗ trợ.
- Image optimization cho logo provider, QR, charts export.

## Layout chung

- Header:
  - Logo.
  - Navigation: Home, Recent, Providers, Compare, Deals, Search.
  - Dark/light toggle.
  - Login/User menu.
- Footer:
  - API docs.
  - Security.
  - Deployment/status.
  - Contact.

## Trang chủ

### Thành phần trang chủ

- Hero section.
- Command copy box:
  - `bash <(wget -qO- https://benchmark.codelab.vn/install)`
  - `curl -sL https://benchmark.codelab.vn/install | bash`
- Quick guide 3 bước.
- Stats cards:
  - Số VPS đã test.
  - Số providers.
  - Số benchmark hôm nay.
- Top VPS mạnh nhất.
- VPS mới benchmark.
- Bản đồ location VPS.
- Top providers.

## Danh sách VPS vừa test

### Chức năng

- Realtime update.
- Pagination/infinite scroll.
- Filter:
  - Quốc gia.
  - Provider.
  - ASN.
  - CPU.
  - RAM.
  - Virtualization.
  - IPv4/IPv6.
- Chỉ hiển thị public benchmark.

## Trang chi tiết benchmark

### Thành phần trang chi tiết benchmark

- System Information.
- Network Information.
- Disk Benchmark.
- CPU Benchmark.
- Memory Benchmark.
- Network Benchmark theo location.
- Security Information.
- AI summary benchmark.
- Share link + QR.
- Export JSON/PDF nếu có quyền.

## VPS Providers

### Thành phần VPS Providers

- Provider list.
- Logo, country, ASN, website.
- Tổng số VPS benchmark.
- Điểm trung bình.
- Uptime rating.
- Provider detail page.

## Trang so sánh

### Chức năng trang so sánh

- Chọn benchmark/provider/location để compare.
- Compare CPU, disk IOPS, network, RAM, IPv4 route, giá VPS.
- Bar chart.
- Radar chart.
- Line chart.
- Compare URL có thể share.

## Trang khuyến mãi

### Chức năng trang khuyến mãi

- VPS deals.
- Coupon.
- Flash sale.
- VPS giá rẻ.
- Filter theo quốc gia/giá/provider.

## Tìm nhà cung cấp

### Search theo

- ASN.
- IP.
- Quốc gia.
- Keyword.
- Virtualization.

## User Dashboard

### Thành phần User Dashboard

- Lịch sử benchmark.
- Danh sách VPS đã test.
- Toggle private/public.
- Token/API key.
- Share link benchmark.
- Export PDF/JSON.

## Admin Dashboard

### Thành phần Admin Dashboard

- Statistics overview: tổng benchmark, benchmark hôm nay, public/private ratio, queue status, API traffic.
- Quản lý benchmark: xem chi tiết, raw payload, đổi trạng thái, đổi public/private, flag/unflag, xoá mềm.
- Quản lý providers: CRUD provider, logo, website, ASN mapping, country, uptime rating, merge/split provider.
- Quản lý promotions: VPS deals, coupon, flash sale, giá, quốc gia, thời gian hiệu lực.
- Quản lý users: xem user, khoá/mở tài khoản, đổi role, xem lịch sử benchmark.
- Quản lý API tokens: xem token metadata, revoke token, theo dõi last used.
- Abuse/fake result queue: danh sách benchmark bị flag, trust score, approve/reject.
- Scoring settings: cấu hình weight CPU/disk/network/memory/security, score version.
- Script settings: version script, endpoint, thông báo bảo trì.
- Cache/queue monitor: clear cache, xem failed jobs, retry job nếu được phân quyền.
- Audit logs: lịch sử thao tác admin quan trọng.

### Công nghệ Admin Dashboard

- Ưu tiên: Next.js 16.1.6 + React + Tailwind CSS để đồng bộ public UI.
- Phương án Laravel admin: Livewire + Alpine.js + Bootstrap + jQuery plugins.
- UI plugin gợi ý: Select2, SweetAlert2, toastr, Dropzone, Quill, Chart.js/ApexCharts.js.

## Output của plan này

- Design system.
- Page routes.
- Component list.
- API integration hooks.
- Responsive UI hoàn chỉnh.
