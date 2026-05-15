'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface ScoreRadarChartProps {
  data: {
    name: string
    cpu?: number
    disk?: number
    memory?: number
    network?: number
    security?: number
  }[]
  className?: string
}

export function ScoreRadarChart({ data, className }: ScoreRadarChartProps) {
  const categories = ['CPU', 'Disk', 'Network', 'Memory', 'Security']

  const series = data.map((d) => ({
    name: d.name,
    data: [
      d.cpu ?? 0,
      d.disk ?? 0,
      d.network ?? 0,
      d.memory ?? 0,
      d.security ?? 0,
    ],
  }))

  const options: ApexOptions = {
    chart: {
      type: 'radar',
      background: 'transparent',
      toolbar: { show: false },
    },
    xaxis: { categories },
    yaxis: { max: 100, min: 0, tickAmount: 5 },
    fill: { opacity: 0.2 },
    stroke: { width: 2 },
    markers: { size: 4 },
    legend: { position: 'bottom' },
    theme: { mode: 'dark' },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  }

  return (
    <div className={className}>
      <ApexChart
        type="radar"
        series={series}
        options={options}
        height={340}
      />
    </div>
  )
}
