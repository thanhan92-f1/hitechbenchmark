'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface NetworkLocation {
  testLocation: string
  downloadMbps?: number
  uploadMbps?: number
  pingMs?: number
}

interface NetworkSpeedChartProps {
  locations: NetworkLocation[]
  className?: string
}

export function NetworkSpeedChart({ locations, className }: NetworkSpeedChartProps) {
  const categories = locations.map((l) => l.testLocation)

  const series = [
    {
      name: 'Download (Mbps)',
      data: locations.map((l) => l.downloadMbps ?? 0),
    },
    {
      name: 'Upload (Mbps)',
      data: locations.map((l) => l.uploadMbps ?? 0),
    },
  ]

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      background: 'transparent',
      toolbar: { show: false },
    },
    xaxis: {
      categories,
      labels: { style: { colors: '#9ca3af', fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '11px' },
        formatter: (v) => `${v} Mbps`,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
      },
    },
    dataLabels: { enabled: false },
    grid: { borderColor: '#1f2937' },
    theme: { mode: 'dark' },
    colors: ['#10b981', '#3b82f6'],
    legend: { position: 'bottom', labels: { colors: '#9ca3af' } },
    tooltip: {
      y: { formatter: (v) => `${v.toFixed(1)} Mbps` },
    },
  }

  return (
    <div className={className}>
      <ApexChart
        type="bar"
        series={series}
        options={options}
        height={260}
      />
    </div>
  )
}
