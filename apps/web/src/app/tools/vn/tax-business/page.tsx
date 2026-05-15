'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Building2, Loader2 } from 'lucide-react'

interface TaxData {
  masothue?: string
  tenchinhthuc?: string
  diachi?: string
  trangthai?: string
  ngaycapphep?: string
  loaihinhdn?: string
  nguoidaidien?: string
  masothue_cn?: string
}

export default function TaxBusinessPage() {
  const [mst, setMst] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: TaxData; error?: string } | null>(null)

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
      toolLabel="Tra Cứu MST Doanh Nghiệp" description="Tra cứu thông tin doanh nghiệp qua mã số thuế (MST) từ cơ sở dữ liệu Tổng cục Thuế Việt Nam.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={mst}
            onChange={e => setMst(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="Nhập mã số thuế (VD: 0100100001)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          />
          <button onClick={lookup} disabled={loading || !mst.trim()} className="px-5 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {loading ? 'Đang tra cứu…' : 'Tra cứu'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {result.error ? (
              <div className="p-5 text-sm text-red-600 dark:text-red-400">{result.error}</div>
            ) : d ? (
              <>
                <div className="flex items-center gap-3 px-5 py-4 bg-rose-50 dark:bg-rose-950/30">
                  <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold text-rose-700 dark:text-rose-300">{d.tenchinhthuc ?? 'Không tìm thấy'}</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    ['Mã số thuế', d.masothue],
                    ['Tên chính thức', d.tenchinhthuc],
                    ['Địa chỉ', d.diachi],
                    ['Trạng thái', d.trangthai],
                    ['Loại hình DN', d.loaihinhdn],
                    ['Người đại diện', d.nguoidaidien],
                    ['Ngày cấp phép', d.ngaycapphep],
                    ['MST chi nhánh', d.masothue_cn],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex gap-4 px-5 py-2.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-36 shrink-0 text-right">{label}</span>
                      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-5 text-sm text-gray-500">Không tìm thấy thông tin cho MST: {mst}</div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400">
          Dữ liệu từ Tổng cục Thuế Việt Nam. Thông tin chỉ mang tính tham khảo.
        </p>
      </div>
    </ToolPageShell>
  )
}
