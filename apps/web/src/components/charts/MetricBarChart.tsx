'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface MetricBarChartProps {
  title: string
  categories: string[]
  series: { name: string; data: (number | null)[] }[]
  unit?: string
  className?: string
}

export function MetricBarChart({ title, categories, series, unit, className }: MetricBarChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      background: 'transparent',
      toolbar: { show: false },
    },
    title: {
      text: title,
      style: { fontSize: '13px', fontWeight: '600', color: '#9ca3af' },
    },
    xaxis: {
      categories,
      labels: { style: { colors: '#9ca3af', fontSize: '12px' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '11px' },
        formatter: (v) => unit ? `${v}${unit}` : `${v}`,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => `${Number(v).toFixed(1)}`,
      style: { fontSize: '11px', colors: ['#9ca3af'] },
      offsetY: -18,
    },
    grid: { borderColor: '#1f2937' },
    theme: { mode: 'dark' },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    legend: { position: 'bottom', labels: { colors: '#9ca3af' } },
  }

  return (
    <div className={className}>
      <ApexChart
        type="bar"
        series={series}
        options={options}
        height={280}
      />
    </div>
  )
}
