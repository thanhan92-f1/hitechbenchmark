'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Database, Loader2 } from 'lucide-react'

export default function TaxHouseholdPage() {
  const [mst, setMst] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: Record<string, string>; error?: string } | null>(null)

  const lookup = async () => {
    if (!mst.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/vn/tax?mst=${encodeURIComponent(mst.trim())}`)
      setResult(await res.json())
    } catch {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const d = result?.data

  return (
    <ToolPageShell groupId="vn" groupLabel="Việt Nam" groupHref="/tools/vn" groupColor="rose"
      toolLabel="Tra Cứu MST Hộ Kinh Doanh" description="Tra cứu mã số thuế hộ kinh doanh cá thể từ cơ sở dữ liệu Tổng cục Thuế.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={mst}
            onChange={e => setMst(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="Nhập mã số thuế (10-13 chữ số)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          />
          <button onClick={lookup} disabled={loading || !mst.trim()} className="px-5 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {loading ? 'Đang tra cứu…' : 'Tra cứu'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {result.error ? (
              <div className="p-5 text-sm text-red-600 dark:text-red-400">{result.error}</div>
            ) : d ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {Object.entries(d).filter(([, v]) => v).map(([key, value]) => (
                  <div key={key} className="flex gap-4 px-5 py-2.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-36 shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-sm text-gray-500">Không tìm thấy thông tin cho MST: {mst}</div>
            )}
          </div>
        )}

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
          <p>Hộ kinh doanh cá thể có MST 10 chữ số, chi nhánh/địa điểm kinh doanh có thêm 3-4 chữ số.</p>
        </div>
      </div>
    </ToolPageShell>
  )
}
