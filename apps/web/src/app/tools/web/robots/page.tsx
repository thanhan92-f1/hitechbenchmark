'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Bot, Loader2, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface RobotRule { type: 'Allow' | 'Disallow'; path: string }
interface RobotAgent { userAgent: string; rules: RobotRule[]; crawlDelay?: number }
interface RobotsResult {
  found: boolean; robotsUrl: string; raw: string
  agents: RobotAgent[]; sitemaps: string[]
  pathTest?: { path: string; agent: string; allowed: boolean; matchedRule: RobotRule | null } | null
}

export default function RobotsPage() {
  const [domain, setDomain] = useState('')
  const [testPath, setTestPath] = useState('')
  const [testAgent, setTestAgent] = useState('*')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RobotsResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [expanded, setExpanded] = useState<string[]>(['*'])

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const params = new URLSearchParams({ domain })
      if (testPath) { params.set('path', testPath); params.set('agent', testAgent) }
      const res = await fetch(`/api/tools/web/robots?${params}`)
      const json = await res.json()
      if (json.success) {
        setResult(json)
        setExpanded(json.agents.slice(0, 3).map((a: RobotAgent) => a.userAgent))
      } else setError(json.error ?? 'Failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="web"
      groupLabel="Web & SEO"
      groupHref="/tools/web"
      groupColor="red"
      toolLabel="Robots.txt Tester"
      description="Kiểm tra và validate file robots.txt. Xem các quy tắc crawl và test đường dẫn cụ thể."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {loading ? 'Fetching…' : 'Fetch'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={testPath}
              onChange={e => setTestPath(e.target.value)}
              placeholder="Test path (optional): /admin"
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              value={testAgent}
              onChange={e => setTestAgent(e.target.value)}
              placeholder="User-agent"
              className="w-32 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Found/not found */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${result.found ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'}`}>
              {result.found ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {result.found ? 'robots.txt found' : 'robots.txt not found'}
              </span>
              <a href={result.robotsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-blue-600 hover:underline">{result.robotsUrl}</a>
            </div>

            {/* Path test result */}
            {result.pathTest && (
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${result.pathTest.allowed ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'}`}>
                {result.pathTest.allowed
                  ? <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                }
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {result.pathTest.path} — {result.pathTest.allowed ? 'Allowed' : 'Disallowed'} for {result.pathTest.agent}
                  </p>
                  {result.pathTest.matchedRule && (
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">
                      Matched: {result.pathTest.matchedRule.type} {result.pathTest.matchedRule.path}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Agents */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{result.agents.length} User-agent{result.agents.length !== 1 ? 's' : ''}</h3>
              {result.agents.map(agent => (
                <div key={agent.userAgent} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(prev => prev.includes(agent.userAgent) ? prev.filter(a => a !== agent.userAgent) : [...prev, agent.userAgent])}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {expanded.includes(agent.userAgent) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    <Bot className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">{agent.userAgent}</span>
                    <span className="ml-auto text-xs text-gray-400">{agent.rules.length} rules</span>
                    {agent.crawlDelay !== undefined && <span className="text-xs text-gray-400">Delay: {agent.crawlDelay}s</span>}
                  </button>
                  {expanded.includes(agent.userAgent) && agent.rules.length > 0 && (
                    <div className="px-4 py-2 space-y-0.5">
                      {agent.rules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                          <span className={`w-16 font-medium ${rule.type === 'Allow' ? 'text-green-600' : 'text-red-600'}`}>{rule.type}</span>
                          <code className="font-mono text-gray-700 dark:text-gray-300">{rule.path}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sitemaps */}
            {result.sitemaps.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sitemaps declared ({result.sitemaps.length})</h3>
                <div className="space-y-1">
                  {result.sitemaps.map((sm, i) => (
                    <a key={i} href={sm} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline truncate">{sm}</a>
                  ))}
                </div>
              </div>
            )}

            {/* Raw */}
            <div>
              <button onClick={() => setShowRaw(r => !r)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                {showRaw ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {showRaw ? 'Hide' : 'Show'} raw robots.txt
              </button>
              {showRaw && (
                <pre className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap">{result.raw}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
