import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is used via `next dev --turbopack`

  // Transpile monorepo packages
  transpilePackages: ['@hitechbenchmark/shared', '@hitechbenchmark/db'],

  // Standalone output for Docker
  output: 'standalone',

  // Experimental features
  experimental: {
    // Server Actions enabled by default in Next.js 15
  },

  // Images: allow provider logos from external sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/b/:uuid',
        destination: '/benchmarks/:uuid',
        permanent: false,
      },
    ]
  },

  // Rewrites for the /install endpoint (serve bash script)
  async rewrites() {
    return []
  },
}

export default nextConfig
