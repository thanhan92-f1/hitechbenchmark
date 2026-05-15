'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export default function ColorConverterPage() {
  const [hex, setHex] = useState('#3b82f6')
  const [rgb, setRgb] = useState('59, 130, 246')
  const [hsl, setHsl] = useState('217, 91%, 60%')
  const [source, setSource] = useState<'hex' | 'rgb' | 'hsl'>('hex')

  const fromHex = (v: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(v)) return
    const { r, g, b } = hexToRgb(v)
    const h = rgbToHsl(r, g, b)
    setRgb(`${r}, ${g}, ${b}`)
    setHsl(`${h.h}, ${h.s}%, ${h.l}%`)
  }

  const fromRgb = (v: string) => {
    const parts = v.split(',').map(s => parseInt(s.trim()))
    if (parts.length !== 3 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return
    const [r, g, b] = parts
    const hexVal = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
    const h = rgbToHsl(r, g, b)
    setHex(hexVal)
    setHsl(`${h.h}, ${h.s}%, ${h.l}%`)
  }

  const fromHsl = (v: string) => {
    const parts = v.replace(/%/g, '').split(',').map(s => parseInt(s.trim()))
    if (parts.length !== 3 || parts.some(p => isNaN(p))) return
    const [h, s, l] = parts
    const hexVal = hslToHex(h, s, l)
    const { r, g, b } = hexToRgb(hexVal)
    setHex(hexVal)
    setRgb(`${r}, ${g}, ${b}`)
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Color Converter" description="Convert colors between HEX, RGB, and HSL formats with a live preview.">
      <div className="space-y-5">
        {/* Preview */}
        <div className="flex gap-4 items-center p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700" style={{ backgroundColor: hex }} />
          <div>
            <div className="text-lg font-bold font-mono text-gray-900 dark:text-white">{hex.toUpperCase()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">rgb({rgb})</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">hsl({hsl})</div>
          </div>
          <input type="color" value={hex} onChange={e => { setHex(e.target.value); fromHex(e.target.value) }}
            className="ml-auto w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent" />
        </div>

        {/* Inputs */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'HEX', val: hex, set: (v: string) => { setHex(v); fromHex(v) }, placeholder: '#3b82f6' },
            { label: 'RGB', val: rgb, set: (v: string) => { setRgb(v); fromRgb(v) }, placeholder: '59, 130, 246' },
            { label: 'HSL', val: hsl, set: (v: string) => { setHsl(v); fromHsl(v) }, placeholder: '217, 91%, 60%' },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
              <div className="flex gap-1">
                <input value={val} onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
                <button onClick={() => navigator.clipboard.writeText(val)}
                  className="px-2 text-xs rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500">
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tailwind classes */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tailwind CSS</p>
          <code className="text-sm text-gray-900 dark:text-white">{`bg-[${hex}] text-[${hex}] border-[${hex}]`}</code>
        </div>
      </div>
    </ToolPageShell>
  )
}
