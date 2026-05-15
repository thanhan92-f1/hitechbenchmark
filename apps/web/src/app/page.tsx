import Link from 'next/link'
import { Zap, Shield, BarChart2, Globe2, ArrowRight, Server, Trophy } from 'lucide-react'
import { CommandCopy } from '@/components/ui/CommandCopy'
import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard'
import { Card, CardBody } from '@/components/ui/Card'
import { formatScore, formatRAM, getScoreColor, cn } from '@/lib/utils'

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/statistics`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 text-white py-20 sm:py-28">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm mb-6">
              <Zap className="w-3.5 h-3.5" />
              Free VPS & Cloud Server Benchmarking Tool
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Benchmark Your VPS{' '}
              <span className="text-blue-400">With One Command</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Run a comprehensive benchmark — CPU, disk IOPS, memory, and network across multiple
              locations. Get a shareable result URL instantly.
            </p>

            {/* Command boxes */}
            <div className="max-w-2xl mx-auto space-y-3 mb-10">
              <CommandCopy
                label="Using curl"
                command="curl -sL https://benchmark.codelab.vn/install | bash"
              />
              <CommandCopy
                label="Using wget"
                command="bash <(wget -qO- https://benchmark.codelab.vn/install)"
              />
            </div>

            {/* Quick steps */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              {['1. Copy command', '2. Paste in your VPS', '3. Get shareable results'].map(
                (step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span>{step.slice(3)}</span>
                    {i < 2 && <ArrowRight className="w-4 h-4 text-gray-600" />}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Benchmarks',
              value: stats?.totalBenchmarks?.toLocaleString() ?? '—',
              icon: Server,
              color: 'text-blue-600',
            },
            {
              label: 'Today',
              value: stats?.todayBenchmarks?.toLocaleString() ?? '—',
              icon: Zap,
              color: 'text-green-600',
            },
            {
              label: 'Providers',
              value: stats?.totalProviders?.toLocaleString() ?? '—',
              icon: Globe2,
              color: 'text-purple-600',
            },
            {
              label: 'Public Results',
              value: stats?.publicBenchmarks?.toLocaleString() ?? '—',
              icon: Shield,
              color: 'text-orange-600',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="shadow-sm">
              <CardBody className="flex items-center gap-4 py-5">
                <div className={cn('p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Benchmarks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Benchmarks</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Latest VPS benchmark results
            </p>
          </div>
          <Link
            href="/benchmarks"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {stats?.recentBenchmarks?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentBenchmarks.map((b: Parameters<typeof BenchmarkCard>[0]['benchmark']) => (
              <BenchmarkCard key={b.uuid} benchmark={b} />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <Server className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No benchmarks yet.</p>
              <p className="text-sm text-gray-400 mt-1">Run the benchmark script to get started!</p>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Top Providers */}
      {stats?.topProviders?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Providers</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Most benchmarked hosting providers
              </p>
            </div>
            <Link
              href="/providers"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              All providers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stats.topProviders.slice(0, 10).map((p: {
              slug: string; name: string; logoUrl?: string;
              country?: { flagEmoji?: string }; benchmarkCount: number; avgScore?: number
            }) => (
              <Link key={p.slug} href={`/providers/${p.slug}`}>
                <Card hover className="text-center">
                  <CardBody className="py-5">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="w-10 h-10 object-contain mx-auto mb-2" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg">{p.country?.flagEmoji || '🌐'}</span>
                      </div>
                    )}
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{p.benchmarkCount} benchmarks</div>
                    {p.avgScore != null && (
                      <div className={cn('text-sm font-mono font-bold mt-1', getScoreColor(p.avgScore))}>
                        {formatScore(p.avgScore)}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
          What Gets Benchmarked
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '⚡',
              title: 'CPU Performance',
              desc: 'Sysbench single & multi-core score, events/s, compression benchmark',
            },
            {
              icon: '💾',
              title: 'Disk I/O',
              desc: 'DD write/read, FIO random read/write IOPS, throughput and latency',
            },
            {
              icon: '🧠',
              title: 'Memory',
              desc: 'Sequential read/write speed and memory latency',
            },
            {
              icon: '🌐',
              title: 'Network Speed',
              desc: 'Download/upload/ping/jitter to Vietnam, Singapore, Japan, US, Europe',
            },
            {
              icon: '🔒',
              title: 'Security Info',
              desc: 'Open ports, firewall, SELinux/AppArmor, kernel hardening settings',
            },
            {
              icon: '🗺️',
              title: 'GeoIP & ASN',
              desc: 'Auto-detect provider, ASN, datacenter, reverse DNS enrichment',
            },
          ].map(({ icon, title, desc }) => (
            <Card key={title}>
              <CardBody>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
