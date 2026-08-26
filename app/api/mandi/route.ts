import { NextRequest, NextResponse } from 'next/server'
import { fetchMandiPrices } from '@/lib/mandi/api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const commodity = searchParams.get('commodity') || 'Potato'
  const state = searchParams.get('state') || undefined
  const district = searchParams.get('district') || undefined
  const market = searchParams.get('market') || undefined
  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')

  const limit = limitParam ? parseInt(limitParam, 10) : 50
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0

  const response = await fetchMandiPrices({
    commodity,
    state,
    district,
    market,
    limit: isNaN(limit) ? 50 : limit,
    offset: isNaN(offset) ? 0 : offset,
  })

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
