import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const plate = req.nextUrl.searchParams.get('plate')?.trim()
  if (!plate) return NextResponse.json({ error: 'Vui lòng nhập biển số xe' }, { status: 400 })

  const cleanPlate = plate.replace(/[\s\-\.]/g, '').toUpperCase()

  try {
    // Use Cục CSGT public API
    const res = await fetch(
      `https://api.checkvin.vn/api/csgt/plates/${encodeURIComponent(cleanPlate)}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HiTechBenchmark/1.0',
        },
        signal: AbortSignal.timeout(15_000),
      },
    )

    if (res.status === 404) {
      return NextResponse.json({ success: true, violations: [] })
    }

    if (!res.ok) {
      // Fallback: try the public data endpoint
      return NextResponse.json({
        success: false,
        error: `Không thể kết nối đến dịch vụ tra cứu (${res.status}). Vui lòng thử lại sau hoặc kiểm tra trực tiếp tại csgt.vn.`,
      })
    }

    const data = await res.json()
    return NextResponse.json({ success: true, violations: Array.isArray(data) ? data : data.data ?? [] })
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Không thể kết nối đến dịch vụ tra cứu. Vui lòng thử lại sau hoặc kiểm tra tại csgt.vn.',
    }, { status: 500 })
  }
}
