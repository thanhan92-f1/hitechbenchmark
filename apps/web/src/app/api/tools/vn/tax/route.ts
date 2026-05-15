import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const mst = req.nextUrl.searchParams.get('mst')?.trim()
  if (!mst) return NextResponse.json({ error: 'Vui lòng nhập mã số thuế' }, { status: 400 })

  const clean = mst.replace(/\D/g, '')
  if (clean.length < 10) return NextResponse.json({ error: 'Mã số thuế không hợp lệ (tối thiểu 10 chữ số)' }, { status: 400 })

  try {
    // Use BKNS public tax lookup API
    const res = await fetch(
      `https://api.bkns.vn/api/tax/lookup?mst=${encodeURIComponent(clean)}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'HiTechBenchmark/1.0',
        },
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!res.ok) {
      // Try alternative endpoint
      const res2 = await fetch(
        `https://dichvuthue.gdt.gov.vn/ndtthue/public/home/kiemTraMST?mst=${encodeURIComponent(clean)}`,
        { signal: AbortSignal.timeout(10_000) },
      )
      if (!res2.ok) {
        return NextResponse.json({ success: false, error: `Không tìm thấy thông tin cho MST: ${clean}` })
      }
      const html = await res2.text()
      // Parse basic info from HTML response
      const tenMatch = html.match(/Tên doanh nghiệp:?\s*<[^>]+>([^<]+)/i)
      return NextResponse.json({
        success: true,
        data: {
          masothue: clean,
          tenchinhthuc: tenMatch?.[1]?.trim() ?? 'Không tìm thấy',
        },
      })
    }

    const json = await res.json()
    return NextResponse.json({ success: true, data: json.data ?? json })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
