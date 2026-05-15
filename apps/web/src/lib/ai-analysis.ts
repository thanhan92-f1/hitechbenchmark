export interface AiAnalysis {
  tier: 'weak' | 'average' | 'strong' | 'enterprise'
  summary: string
  bottlenecks: string[]
  suitableWorkloads: string[]
  recommendations: string[]
  cpuAnalysis: string
  diskAnalysis: string
  networkAnalysis: string
  memoryAnalysis: string
}

export interface PerformanceIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  metric?: string
  value?: number
}

export const TIER_META = {
  weak: { label: 'Weak', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', emoji: '⚠️' },
  average: { label: 'Average', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', emoji: '📊' },
  strong: { label: 'Strong', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', emoji: '💪' },
  enterprise: { label: 'Enterprise', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', emoji: '🚀' },
} as const

export const ISSUE_SEVERITY_META = {
  low: { label: 'Low', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  medium: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  high: { label: 'High', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' },
} as const
