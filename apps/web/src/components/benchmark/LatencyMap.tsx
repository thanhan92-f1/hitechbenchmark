'use client'

import { cn } from '@/lib/utils'

interface Location {
  testLocation: string
  pingMs?: number | null
  downloadMbps?: number | null
  uploadMbps?: number | null
}

// Approximate lat/lon to SVG coordinates for a simple equirectangular world map (1000x500)
const LOCATION_COORDS: Record<string, [number, number]> = {
  // North America
  'New York': [230, 185],
  'Los Angeles': [130, 205],
  'Dallas': [175, 215],
  'Chicago': [205, 175],
  'Miami': [220, 235],
  'Seattle': [115, 160],
  'San Jose': [115, 200],
  'Atlanta': [215, 210],
  'Toronto': [230, 170],
  'Vancouver': [115, 155],
  // Europe
  'London': [450, 155],
  'Amsterdam': [470, 145],
  'Frankfurt': [480, 148],
  'Paris': [462, 155],
  'Madrid': [455, 175],
  'Milan': [478, 160],
  'Warsaw': [498, 143],
  'Stockholm': [490, 128],
  // Asia Pacific
  'Tokyo': [810, 180],
  'Singapore': [785, 270],
  'Sydney': [855, 370],
  'Hong Kong': [800, 225],
  'Seoul': [815, 185],
  'Mumbai': [720, 235],
  'Bangalore': [720, 250],
  'Jakarta': [790, 290],
  'Taipei': [815, 210],
  // Middle East / Africa
  'Dubai': [675, 225],
  'Istanbul': [545, 175],
  'Johannesburg': [555, 370],
  'Cairo': [555, 215],
  // South America
  'São Paulo': [295, 355],
  'Buenos Aires': [280, 395],
  'Santiago': [260, 390],
}

function findCoords(location: string): [number, number] | null {
  // Try exact match first
  if (LOCATION_COORDS[location]) return LOCATION_COORDS[location]
  // Try partial match
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (location.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(location.toLowerCase().split(',')[0])) {
      return coords
    }
  }
  return null
}

function pingColor(ms: number | null | undefined): string {
  if (ms == null) return '#6b7280'
  if (ms < 30) return '#22c55e'
  if (ms < 80) return '#84cc16'
  if (ms < 150) return '#f59e0b'
  if (ms < 300) return '#f97316'
  return '#ef4444'
}

function pingLabel(ms: number | null | undefined): string {
  if (ms == null) return '—'
  return `${ms.toFixed(0)}ms`
}

export function LatencyMap({ locations }: { locations: Location[] }) {
  if (!locations || locations.length === 0) return null

  const mapped = locations
    .map(loc => ({ ...loc, coords: findCoords(loc.testLocation) }))
    .filter(loc => loc.coords !== null) as (Location & { coords: [number, number] })[]

  if (mapped.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <svg viewBox="0 0 1000 500" className="w-full h-auto" aria-label="Global latency map">
        {/* Simple world map background using path shapes */}
        <rect width="1000" height="500" fill="currentColor" className="text-gray-100 dark:text-gray-900" />

        {/* Ocean */}
        <rect width="1000" height="500" fill="currentColor" className="text-blue-50 dark:text-blue-950/30" />

        {/* Simplified continent outlines */}
        {/* North America */}
        <path d="M100,80 L250,80 L280,120 L270,200 L240,260 L200,280 L170,260 L130,240 L100,200 L90,150 Z"
          fill="currentColor" className="text-gray-200 dark:text-gray-700" />
        {/* South America */}
        <path d="M220,280 L290,280 L320,330 L300,420 L260,430 L230,400 L210,350 Z"
          fill="currentColor" className="text-gray-200 dark:text-gray-700" />
        {/* Europe */}
        <path d="M420,80 L550,80 L570,150 L520,200 L450,190 L420,150 Z"
          fill="currentColor" className="text-gray-200 dark:text-gray-700" />
        {/* Africa */}
        <path d="M450,200 L560,200 L580,280 L550,400 L480,420 L440,360 L430,280 Z"
          fill="currentColor" className="text-gray-200 dark:text-gray-700" />
        {/* Asia */}
        <path d="M550,70 L870,70 L880,200 L850,270 L780,300 L700,280 L640,240 L580,200 L550,140 Z"
          fill="currentColor" className="text-gray-200 dark:text-gray-700" />
        {/* Australia */}
        <path d="M790,320 L890,320 L900,390 L840,410 L790,390 Z"
          fill="currentColor" className="text-gray-200 dark:text-gray-700" />

        {/* Draw connection lines between points */}
        {mapped.map((loc, i) =>
          mapped.slice(i + 1).map((loc2, j) => (
            <line
              key={`${i}-${j}`}
              x1={loc.coords[0]}
              y1={loc.coords[1]}
              x2={loc2.coords[0]}
              y2={loc2.coords[1]}
              stroke={pingColor(loc.pingMs)}
              strokeWidth="0.8"
              strokeDasharray="4 3"
              strokeOpacity="0.35"
            />
          ))
        )}

        {/* Draw location dots */}
        {mapped.map((loc, i) => (
          <g key={i}>
            {/* Pulse ring */}
            <circle
              cx={loc.coords[0]}
              cy={loc.coords[1]}
              r="10"
              fill={pingColor(loc.pingMs)}
              fillOpacity="0.15"
            />
            {/* Main dot */}
            <circle
              cx={loc.coords[0]}
              cy={loc.coords[1]}
              r="5"
              fill={pingColor(loc.pingMs)}
              stroke="white"
              strokeWidth="1.5"
            />
            {/* Tooltip label */}
            <text
              x={loc.coords[0]}
              y={loc.coords[1] - 14}
              textAnchor="middle"
              fontSize="9"
              fontFamily="ui-monospace,monospace"
              fill="currentColor"
              className="text-gray-700 dark:text-gray-300"
            >
              {pingLabel(loc.pingMs)}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded-lg text-xs backdrop-blur-sm">
        {[
          { color: '#22c55e', label: '<30ms' },
          { color: '#f59e0b', label: '30-150ms' },
          { color: '#ef4444', label: '>150ms' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-gray-600 dark:text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
