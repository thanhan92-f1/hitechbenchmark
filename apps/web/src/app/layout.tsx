import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'HiTech Benchmark - VPS & Cloud Server Performance Rankings',
    template: '%s | HiTech Benchmark',
  },
  description:
    'Benchmark your VPS, Cloud Server, or Dedicated Server with one command. Compare performance, view rankings, and find the best providers.',
  keywords: ['VPS benchmark', 'cloud server benchmark', 'server performance', 'VPS ranking', 'dedicated server test'],
  authors: [{ name: 'HiTech Benchmark' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'HiTech Benchmark',
    title: 'HiTech Benchmark - VPS & Cloud Server Performance Rankings',
    description:
      'Benchmark your VPS with one command. Compare performance across providers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HiTech Benchmark',
    description: 'VPS & Cloud Server Performance Rankings',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
