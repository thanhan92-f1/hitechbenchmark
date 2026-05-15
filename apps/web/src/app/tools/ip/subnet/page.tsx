'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

function cidrToInfo(cidr: string) {
  const [ip, prefixStr] = cidr.split('/')
  const prefix = parseInt(prefixStr ?? '24')
  if (isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error('Invalid prefix')

  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) throw new Error('Invalid IP')

  const ipNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  const network = (ipNum & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const first = prefix < 31 ? network + 1 : network
  const last = prefix < 31 ? broadcast - 1 : broadcast
  const hosts = prefix < 31 ? Math.pow(2, 32 - prefix) - 2 : Math.pow(2, 32 - prefix)

  const n2s = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.')

  return {
    network: n2s(network),
    broadcast: n2s(broadcast),
    netmask: n2s(mask),
    wildcard: n2s(~mask >>> 0),
    first: n2s(first),
    last: n2s(last),
    prefix,
    hosts: hosts.toLocaleString(),
    cidr: `${n2s(network)}/${prefix}`,
  }
}

export default function SubnetPage() {
  const [input, setInput] = useState('192.168.1.0/24')
  const [result, setResult] = useState<ReturnType<typeof cidrToInfo> | null>(null)
  const [error, setError] = useState('')

  const calc = () => {
    setError('')
    setResult(null)
    try {
      setResult(cidrToInfo(input.trim()))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <ToolPageShell groupId="ip" groupLabel="IP & Network" groupHref="/tools/ip" groupColor="purple"
      toolLabel="Subnet Calculator" description="Calculate network address, broadcast, mask, and host range from a CIDR notation.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && calc()}
            placeholder="192.168.1.0/24"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button onClick={calc} className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
            Calculate
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {[
              ['CIDR Notation', result.cidr],
              ['Network Address', result.network],
              ['Broadcast Address', result.broadcast],
              ['Subnet Mask', result.netmask],
              ['Wildcard Mask', result.wildcard],
              ['First Usable Host', result.first],
              ['Last Usable Host', result.last],
              ['Prefix Length', `/${result.prefix}`],
              ['Usable Hosts', result.hosts],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-5 py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-44 shrink-0">{label}</span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
