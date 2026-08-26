import type { MandiQueryParams, MandiResponse, RawGovMandiResponse, MandiRecord } from './types'
import { normalizeGovRecord } from './normalize'

const GOV_API_BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
const GOV_SOURCE_NAME = 'Government of India — data.gov.in / AGMARKNET'

// In‑memory cache for aggregated results (keyed by commodity|state)
type CacheEntry = {
  timestamp: number // epoch ms
  base: Omit<MandiResponse, 'district' | 'market'> // cached data without location filters
}
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Fetch a single page from the government API.
 * `limit` is fixed to 10 as per tier restriction.
 */
async function fetchPage(params: MandiQueryParams, offset: number): Promise<RawGovMandiResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  const commodity = params.commodity?.trim() || 'Potato'

  const url = new URL(GOV_API_BASE_URL)
  url.searchParams.set('api-key', apiKey ?? '')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '10')
  if (offset > 0) url.searchParams.set('offset', String(offset))

  // Filters that we *always* apply server‑side
  if (commodity) url.searchParams.set('filters[commodity]', commodity)
  if (params.state) url.searchParams.set('filters[state]', params.state.trim())

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  const res = await fetch(url.toString(), {
    signal: controller.signal,
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 }, // disable Next.js ISR for raw fetches
  })
  clearTimeout(timeoutId)
  if (!res.ok) throw new Error(`Government API responded with ${res.status}`)
  const data: RawGovMandiResponse = await res.json()
  return data
}

/**
 * Main entry point – aggregates all pages for the requested commodity & state,
 * caches the result for one hour, and then applies any district/market filters
 * locally. This avoids hitting the 10‑record per request limit repeatedly and
 * provides a stable response even when the upstream API returns 429.
 */
export async function fetchMandiPrices(params: MandiQueryParams): Promise<MandiResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  const commodity = params.commodity?.trim() || 'Potato'

  if (!apiKey) {
    return {
      dataStatus: 'unavailable',
      source: GOV_SOURCE_NAME,
      commodity,
      state: params.state,
      district: params.district,
      market: params.market,
      message: 'Government API key (DATA_GOV_IN_API_KEY) is not configured in server environment.',
      totalRecords: 0,
      records: [],
    }
  }

  const cacheKey = `${commodity}|${params.state ?? ''}`
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    const base = cached.base
    // Apply request‑level district/market filtering
    let filtered = base.records
    if (params.district) {
      filtered = filtered.filter(r => r.district.toLowerCase() === params.district!.trim().toLowerCase())
    }
    if (params.market) {
      filtered = filtered.filter(r => r.market.toLowerCase() === params.market!.trim().toLowerCase())
    }
    return {
      dataStatus: base.dataStatus,
      source: base.source,
      commodity: base.commodity,
      state: base.state,
      district: params.district,
      market: params.market,
      updatedAt: base.updatedAt,
      totalRecords: filtered.length,
      records: filtered,
    }
  }

  // Aggregate all pages (limit = 10 per page)
  const allRecords: MandiRecord[] = []
  let offset = 0
  let total = 0
  while (true) {
    let raw: RawGovMandiResponse
    try {
      raw = await fetchPage(params, offset)
    } catch (e) {
      return {
        dataStatus: 'unavailable',
        source: GOV_SOURCE_NAME,
        commodity,
        state: params.state,
        district: params.district,
        market: params.market,
        message: `Failed to fetch from government API: ${(e as Error).message}`,
        totalRecords: 0,
        records: [],
      }
    }
    const pageRecords = raw.records?.map(normalizeGovRecord) ?? []
    allRecords.push(...pageRecords)
    if (total === 0) total = typeof raw.total === 'number' ? raw.total : pageRecords.length
    offset += 10
    if (pageRecords.length < 10 || offset >= total) break
  }

  // Build base response (unfiltered)
  const baseResponse: Omit<MandiResponse, 'district' | 'market'> = {
    dataStatus: 'live',
    source: GOV_SOURCE_NAME,
    commodity,
    state: params.state,
    updatedAt: new Date().toISOString(),
    totalRecords: allRecords.length,
    records: allRecords,
  }

  // Cache the unfiltered data (keyed only by commodity|state)
  cache.set(cacheKey, { timestamp: now, base: baseResponse })

  // Apply local district/market filtering if requested
  if (params.district || params.market) {
    const filtered = allRecords.filter(r => {
      const districtMatch = params.district ? r.district.toLowerCase() === params.district.trim().toLowerCase() : true
      const marketMatch = params.market ? r.market.toLowerCase() === params.market.trim().toLowerCase() : true
      return districtMatch && marketMatch
    })
    return { ...baseResponse, records: filtered, totalRecords: filtered.length }
  }

  return baseResponse
}
