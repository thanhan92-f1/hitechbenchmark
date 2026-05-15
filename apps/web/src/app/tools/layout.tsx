import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Công Cụ Miễn Phí | HiTech Benchmark',
    template: '%s | HiTech Tools',
  },
  description: '80+ công cụ miễn phí cho developer: SSL Check, DNS Lookup, IP Info, UUID, Base64, JSON Formatter và nhiều hơn nữa.',
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
