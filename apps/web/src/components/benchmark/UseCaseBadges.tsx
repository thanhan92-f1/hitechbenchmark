import { cn } from '@/lib/utils'
import { Gamepad2, Tv, Server, Lock, Brain } from 'lucide-react'

interface NetworkData {
  downloadMbps?: number | null
  uploadMbps?: number | null
  pingMs?: number | null
  jitterMs?: number | null
  packetLoss?: number | null
}

interface UseCaseScore {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  score: number
  tier: 'excellent' | 'good' | 'fair' | 'poor'
  reasons: string[]
}

function calcUseCaseScores(locations: NetworkData[]): UseCaseScore[] {
  if (locations.length === 0) return []

  const avgDownload = locations.reduce((a, l) => a + (l.downloadMbps || 0), 0) / locations.length
  const avgUpload = locations.reduce((a, l) => a + (l.uploadMbps || 0), 0) / locations.length
  const avgPing = locations.filter(l => l.pingMs).reduce((a, l) => a + (l.pingMs || 0), 0) / Math.max(locations.filter(l => l.pingMs).length, 1)
  const avgJitter = locations.filter(l => l.jitterMs).reduce((a, l) => a + (l.jitterMs || 0), 0) / Math.max(locations.filter(l => l.jitterMs).length, 1)

  function tier(score: number): UseCaseScore['tier'] {
    if (score >= 85) return 'excellent'
    if (score >= 65) return 'good'
    if (score >= 40) return 'fair'
    return 'poor'
  }

  // Gaming: low ping + low jitter is critical
  const gamingPingScore = avgPing ? Math.max(0, 100 - avgPing * 2) : 50
  const gamingJitterScore = avgJitter ? Math.max(0, 100 - avgJitter * 5) : 60
  const gamingDownload = Math.min(avgDownload / 30, 1) * 100
  const gamingScore = Math.round(gamingPingScore * 0.5 + gamingJitterScore * 0.3 + gamingDownload * 0.2)
  const gamingReasons: string[] = []
  if (avgPing && avgPing < 20) gamingReasons.push('Excellent latency')
  else if (avgPing && avgPing > 80) gamingReasons.push('High latency')
  if (avgJitter && avgJitter > 10) gamingReasons.push('High jitter')
  if (avgDownload > 100) gamingReasons.push('Fast download')

  // Streaming: download bandwidth critical
  const streamingDownload = Math.min(avgDownload / 50, 1) * 100
  const streamingStability = avgJitter ? Math.max(0, 100 - avgJitter * 3) : 70
  const streamingScore = Math.round(streamingDownload * 0.7 + streamingStability * 0.3)
  const streamingReasons: string[] = []
  if (avgDownload >= 25) streamingReasons.push('4K streaming capable')
  else if (avgDownload >= 5) streamingReasons.push('HD streaming capable')
  else streamingReasons.push('Limited streaming')
  if (avgJitter && avgJitter < 5) streamingReasons.push('Stable connection')

  // Hosting/VPS: upload + download both important
  const hostingDownload = Math.min(avgDownload / 200, 1) * 100
  const hostingUpload = Math.min(avgUpload / 200, 1) * 100
  const hostingScore = Math.round(hostingDownload * 0.5 + hostingUpload * 0.5)
  const hostingReasons: string[] = []
  if (avgUpload > 100) hostingReasons.push('High upload capacity')
  if (avgDownload > 500) hostingReasons.push('Gigabit download')
  if (avgUpload < 10) hostingReasons.push('Limited upload bandwidth')

  // VPN/Proxy: stable upload + low latency
  const vpnUpload = Math.min(avgUpload / 100, 1) * 100
  const vpnPing = avgPing ? Math.max(0, 100 - avgPing * 1.5) : 60
  const vpnScore = Math.round(vpnUpload * 0.5 + vpnPing * 0.3 + (Math.min(avgDownload / 100, 1) * 100) * 0.2)
  const vpnReasons: string[] = []
  if (avgUpload > 50) vpnReasons.push('Good VPN throughput')
  if (avgPing && avgPing < 30) vpnReasons.push('Low server latency')

  // AI/ML workloads: high bandwidth + low latency for inference
  const aiDownload = Math.min(avgDownload / 500, 1) * 100
  const aiUpload = Math.min(avgUpload / 200, 1) * 100
  const aiPing = avgPing ? Math.max(0, 100 - avgPing * 1.0) : 60
  const aiScore = Math.round(aiDownload * 0.4 + aiUpload * 0.3 + aiPing * 0.3)
  const aiReasons: string[] = []
  if (avgDownload > 200) aiReasons.push('Fast model downloads')
  if (avgUpload > 100) aiReasons.push('High data transfer')
  if (avgPing && avgPing < 50) aiReasons.push('Good inference latency')

  return [
    { id: 'gaming', label: 'Gaming', icon: Gamepad2, score: gamingScore, tier: tier(gamingScore), reasons: gamingReasons },
    { id: 'streaming', label: 'Streaming', icon: Tv, score: streamingScore, tier: tier(streamingScore), reasons: streamingReasons },
    { id: 'hosting', label: 'Hosting', icon: Server, score: hostingScore, tier: tier(hostingScore), reasons: hostingReasons },
    { id: 'vpn', label: 'VPN/Proxy', icon: Lock, score: vpnScore, tier: tier(vpnScore), reasons: vpnReasons },
    { id: 'ai', label: 'AI/ML', icon: Brain, score: aiScore, tier: tier(aiScore), reasons: aiReasons },
  ]
}

const TIER_STYLES = {
  excellent: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  good: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  fair: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  poor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
}

const TIER_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

export function UseCaseBadges({ locations }: { locations: NetworkData[] }) {
  const scores = calcUseCaseScores(locations)
  if (scores.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {scores.map(uc => (
        <div
          key={uc.id}
          className={cn(
            'border rounded-xl p-3 flex flex-col items-center gap-2 text-center',
            TIER_STYLES[uc.tier]
          )}
          title={uc.reasons.join(' · ')}
        >
          <uc.icon className="w-5 h-5" />
          <div>
            <p className="text-xs font-semibold">{uc.label}</p>
            <p className="text-xs opacity-75">{TIER_LABELS[uc.tier]}</p>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-current opacity-60"
              style={{ width: `${uc.score}%` }}
            />
          </div>
          <p className="text-xs font-mono font-bold">{uc.score}</p>
        </div>
      ))}
    </div>
  )
}
