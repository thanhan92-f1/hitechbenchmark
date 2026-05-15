import type { Metadata } from 'next'
import { Server, Shield, Zap, Globe, Users, BarChart2, Code2, Target } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Về Chúng Tôi | HiTech Benchmark',
  description: 'HiTech Benchmark - Nền tảng benchmark VPS/Cloud server miễn phí, chính xác và đáng tin cậy tại Việt Nam.',
}

const stats = [
  { label: 'Benchmarks đã chạy', value: '10,000+' },
  { label: 'Nhà cung cấp', value: '50+' },
  { label: 'Quốc gia', value: '30+' },
  { label: 'Công cụ miễn phí', value: '80+' },
]

const values = [
  {
    icon: Shield,
    title: 'Minh Bạch',
    description: 'Tất cả benchmark đều được thực hiện theo tiêu chuẩn thống nhất, không thiên vị bất kỳ nhà cung cấp nào.',
  },
  {
    icon: Zap,
    title: 'Nhanh Chóng',
    description: 'Chạy benchmark chỉ với một lệnh curl duy nhất. Kết quả được hiển thị và chia sẻ ngay lập tức.',
  },
  {
    icon: Globe,
    title: 'Toàn Cầu',
    description: 'Kiểm tra tốc độ mạng đến nhiều server trên toàn thế giới để có cái nhìn toàn diện nhất.',
  },
  {
    icon: Code2,
    title: 'Mã Nguồn Mở',
    description: 'Script benchmark hoàn toàn mã nguồn mở. Bạn có thể xem, kiểm tra và đóng góp trên GitHub.',
  },
]

const teamMembers = [
  {
    name: 'Nguyễn Thanh An',
    role: 'Founder & Lead Developer',
    description: 'Phát triển nền tảng, kiến trúc hệ thống và script benchmark.',
  },
  {
    name: 'Pho Tue Software Solutions JSC',
    role: 'Tổ chức phát triển',
    description: 'Công ty phần mềm chuyên cung cấp các giải pháp công nghệ cho doanh nghiệp Việt Nam.',
  },
]

const tools = [
  { icon: Server, label: 'Benchmark VPS/Cloud', desc: 'CPU, RAM, Disk IOPS, Network speed' },
  { icon: Shield, label: 'SSL/TLS Tools', desc: 'Kiểm tra chứng chỉ, HSTS, HTTP/2, HTTP/3' },
  { icon: Globe, label: 'Domain & DNS', desc: 'Whois, DNS records, SPF, DKIM, DMARC' },
  { icon: BarChart2, label: 'IP & Network', desc: 'IP lookup, Port scan, Subnet calculator' },
  { icon: Code2, label: 'Developer Utilities', desc: 'UUID, Base64, JSON, Hash, Regex...' },
  { icon: Target, label: 'Web & SEO', desc: 'HTTP headers, OpenGraph, Meta tags' },
]

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
          <Server className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Về <span className="text-blue-600">HiTech Benchmark</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Nền tảng benchmark VPS & Cloud server miễn phí, chính xác và toàn diện nhất tại Việt Nam.
          Được xây dựng bởi developer, dành cho developer.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sứ Mệnh</h2>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-4">
            HiTech Benchmark được xây dựng với mục tiêu cung cấp công cụ benchmark VPS và Cloud server
            <strong> miễn phí, khách quan và dễ sử dụng</strong> cho cộng đồng developer và system admin Việt Nam.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-4">
            Chúng tôi tin rằng mọi người đều xứng đáng có được thông tin chính xác về hiệu năng máy chủ
            trước khi đưa ra quyết định mua hàng. Với HiTech Benchmark, bạn có thể so sánh các VPS từ
            nhiều nhà cung cấp khác nhau dựa trên dữ liệu thực tế, không phải quảng cáo.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            Ngoài benchmark, chúng tôi còn cung cấp hơn <strong>80+ công cụ miễn phí</strong> cho developer
            như kiểm tra SSL, DNS lookup, IP info, các tiện ích mã hóa và chuyển đổi dữ liệu.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Giá Trị Cốt Lõi</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {values.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tools Overview */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Công Cụ Của Chúng Tôi</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-gray-900 dark:text-white">{label}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Khám Phá Tất Cả Công Cụ →
          </Link>
        </div>
      </div>

      {/* Team */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Đội Ngũ</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {teamMembers.map((member) => (
            <div key={member.name} className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">{member.role}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{member.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact / CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Bắt Đầu Benchmark Ngay</h2>
        <p className="text-blue-100 mb-6 max-w-md mx-auto">
          Chạy một lệnh duy nhất để có báo cáo hiệu năng VPS đầy đủ và chia sẻ được.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Xem hướng dẫn
          </Link>
          <Link
            href="/benchmarks"
            className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors"
          >
            Xem benchmark mới nhất
          </Link>
        </div>
      </div>
    </div>
  )
}
