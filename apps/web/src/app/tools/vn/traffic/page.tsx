'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Car, Loader2, AlertTriangle } from 'lucide-react'

export default function TrafficFinePage() {
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ violations?: unknown[]; error?: string } | null>(null)

  const lookup = async () => {
    if (!plate.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/vn/traffic?plate=${encodeURIComponent(plate.trim().toUpperCase())}`)
      setResult(await res.json())
    } catch {
      setResult({ error: 'Network error. Vui lòng thử lại.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPageShell groupId="vn" groupLabel="Việt Nam" groupHref="/tools/vn" groupColor="rose"
      toolLabel="Tra Cứu Phạt Nguội" description="Kiểm tra vi phạm giao thông theo biển số xe. Dữ liệu từ Cục CSGT.">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-semibold mb-1">Lưu ý</p>
            <p>Thông tin tra cứu chỉ mang tính chất tham khảo. Để biết kết quả chính xác, vui lòng kiểm tra tại{' '}
              <a href="https://www.csgt.vn" target="_blank" rel="noopener noreferrer" className="underline">csgt.vn</a>
              {' '}hoặc cổng dịch vụ công.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={plate}
            onChange={e => setPlate(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="51F-123.45 hoặc 29A12345"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono uppercase"
          />
          <button onClick={lookup} disabled={loading || !plate.trim()} className="px-5 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
            {loading ? 'Đang tra cứu…' : 'Tra cứu'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {result.error ? (
              <div className="p-5 text-sm text-red-600 dark:text-red-400">{result.error}</div>
            ) : result.violations && result.violations.length === 0 ? (
              <div className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <span className="text-green-600 text-lg">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">Không có vi phạm</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Biển số {plate} không có phạt nguội trong cơ sở dữ liệu.</p>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <p className="font-semibold text-red-600 dark:text-red-400 mb-3">Có vi phạm ({(result.violations as unknown[]).length})</p>
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(result.violations, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400">
          Tra cứu được thực hiện thông qua API công khai. Dữ liệu thuộc về Cục CSGT Việt Nam.
        </p>
      </div>
    </ToolPageShell>
  )
}
