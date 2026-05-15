import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatMbps(mbps: number | null | undefined): string {
  if (mbps == null) return 'N/A'
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} Gbps`
  return `${mbps.toFixed(1)} Mbps`
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return 'N/A'
  return `${ms.toFixed(1)} ms`
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '-'
  return score.toFixed(1)
}

export function formatRAM(mb: number | null | undefined): string {
  if (mb == null) return 'N/A'
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

export function formatDisk(gb: number | null | undefined): string {
  if (gb == null) return 'N/A'
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
  return `${gb.toFixed(0)} GB`
}

export function formatUptime(seconds: number | bigint | null | undefined): string {
  if (seconds == null) return 'N/A'
  const s = typeof seconds === 'bigint' ? Number(seconds) : seconds
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export function maskIp(ip: string | null | undefined): string {
  if (!ip) return 'N/A'
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`
  }
  return ip
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-blue-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || '127.0.0.1'
}

export function apiResponse<T>(data: T, meta?: object) {
  return Response.json({ success: true, data, ...(meta ? { meta } : {}) })
}

export function apiError(message: string, status = 400, errors?: Record<string, string[]>) {
  return Response.json(
    { success: false, message, ...(errors ? { errors } : {}) },
    { status },
  )
}
