/**
 * Open-Meteo weather provider — IMPURE (all network I/O lives here, never in the engine).
 *
 * Keyless, free Open-Meteo forecast API. The timezone is pinned to Asia/Kolkata so day-bucketing
 * aligns to the farmer's local day, not UTC.
 *
 * 🔴 HONESTY CONTRACT (from the brief): on any weather failure this THROWS a typed WeatherError.
 * It never returns fabricated weather and never invents a SAFE/WATCH/ACT band. The API route
 * turns the throw into a clear error for the UI.
 *
 * 🔴 The three Open-Meteo traps, each handled explicitly:
 *   1. Single coordinate → response OBJECT; multiple → ARRAY. Normalise to a list.
 *   2. past_days SHIFTS THE ARRAY ORIGIN — index 0 is NOT "today". Locate days by parsing time[].
 *   3. Returned coords are SNAPPED to the ~0.1° model grid. Assert closeness or reject.
 */
import type { HourlySeries } from '@/lib/weather/types'

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

// Open-Meteo snaps requests to its ~0.1° grid; anything past this is a real mismatch, not a snap.
const SNAP_TOLERANCE_DEG = 0.15

// The engine consumes these four hourly variables. dew_point is fetched for consistency/debugging;
// the band logic itself reads only temperature, humidity and precipitation.
const VARIABLES = ['temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'precipitation'] as const

export type WeatherErrorKind = 'network' | 'http' | 'shape' | 'snap' | 'timeout'

/** Typed failure so the API route can respond with an honest, specific message. */
export class WeatherError extends Error {
  readonly kind: WeatherErrorKind
  constructor(kind: WeatherErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'WeatherError'
    this.kind = kind
  }
}

interface OpenMeteoBlock {
  latitude: number
  longitude: number
  hourly?: {
    time?: string[]
    temperature_2m?: number[]
    relative_humidity_2m?: number[]
    dew_point_2m?: number[]
    precipitation?: number[]
  }
}

export interface FetchOptions {
  timezone?: string
  forecastDays?: number
  pastDays?: number
  timeoutMs?: number
}

/**
 * Trap #2: trim a series to start at the first hour whose calendar date >= startDate.
 * Pure string comparison on the "YYYY-MM-DD" prefix — no timezone math.
 */
export function alignFromDate(series: HourlySeries, startDate: string): HourlySeries {
  let startIdx = series.times.length
  for (let i = 0; i < series.times.length; i++) {
    if (series.times[i].slice(0, 10) >= startDate) {
      startIdx = i
      break
    }
  }
  const slice = <T>(a: T[] | undefined): T[] | undefined => (a ? a.slice(startIdx) : undefined)
  return {
    lat: series.lat,
    lon: series.lon,
    times: series.times.slice(startIdx),
    temperature: series.temperature.slice(startIdx),
    relativeHumidity: series.relativeHumidity.slice(startIdx),
    precipitation: series.precipitation.slice(startIdx),
    dewPoint: slice(series.dewPoint),
  }
}

/**
 * Fetch live hourly weather for each coordinate, returned in the SAME ORDER as `coords`.
 * @throws {WeatherError} on any network, HTTP, shape or grid-snap problem — never returns fake data.
 */
export async function fetchOpenMeteo(
  coords: ReadonlyArray<readonly [number, number]>,
  opts: FetchOptions = {},
): Promise<HourlySeries[]> {
  if (coords.length === 0) return []
  const { timezone = 'Asia/Kolkata', forecastDays = 8, pastDays = 2, timeoutMs = 30_000 } = opts

  const lats = coords.map((c) => c[0].toFixed(4)).join(',')
  const lons = coords.map((c) => c[1].toFixed(4)).join(',')
  const url = new URL(OPEN_METEO_FORECAST_URL)
  url.searchParams.set('latitude', lats)
  url.searchParams.set('longitude', lons)
  url.searchParams.set('hourly', VARIABLES.join(','))
  url.searchParams.set('forecast_days', String(forecastDays))
  url.searchParams.set('past_days', String(pastDays))
  url.searchParams.set('timezone', timezone)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let resp: Response
  try {
    resp = await fetch(url, { signal: controller.signal })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new WeatherError('timeout', `Open-Meteo request timed out after ${timeoutMs} ms`, { cause: err })
    }
    throw new WeatherError('network', 'Could not reach the weather service (Open-Meteo).', { cause: err })
  } finally {
    clearTimeout(timer)
  }

  if (!resp.ok) {
    throw new WeatherError('http', `Weather service returned HTTP ${resp.status}.`)
  }

  let data: unknown
  try {
    data = await resp.json()
  } catch (err) {
    throw new WeatherError('shape', 'Weather service returned a response that was not valid JSON.', { cause: err })
  }
  return parseOpenMeteoResponse(data, coords)
}

/**
 * Pure transform: Open-Meteo JSON → HourlySeries[], applying traps #1 (object-vs-array) and #3
 * (grid-snap tolerance). Separated from the network call so it can be unit-tested with fixtures.
 * @throws {WeatherError} of kind 'shape' or 'snap'.
 */
export function parseOpenMeteoResponse(
  data: unknown,
  coords: ReadonlyArray<readonly [number, number]>,
): HourlySeries[] {
  // Trap #1: single coord → object; multiple → array. Normalise to a list.
  const blocks = (Array.isArray(data) ? data : [data]) as OpenMeteoBlock[]
  if (blocks.length !== coords.length) {
    throw new WeatherError('shape', `Weather service returned ${blocks.length} blocks for ${coords.length} coordinates.`)
  }

  const out: HourlySeries[] = []
  for (let i = 0; i < coords.length; i++) {
    const [reqLat, reqLon] = coords[i]
    const block = blocks[i]
    if (typeof block?.latitude !== 'number' || typeof block?.longitude !== 'number') {
      throw new WeatherError('shape', 'Weather service response was missing coordinates.')
    }
    // Trap #3: verify the snapped coords are near what we asked for.
    if (Math.abs(block.latitude - reqLat) >= SNAP_TOLERANCE_DEG) {
      throw new WeatherError('snap', `Weather grid snapped latitude too far (got ${block.latitude}, wanted ${reqLat}).`)
    }
    if (Math.abs(block.longitude - reqLon) >= SNAP_TOLERANCE_DEG) {
      throw new WeatherError('snap', `Weather grid snapped longitude too far (got ${block.longitude}, wanted ${reqLon}).`)
    }
    const hourly = block.hourly
    const times = hourly?.time
    const temperature = hourly?.temperature_2m
    const relativeHumidity = hourly?.relative_humidity_2m
    const precipitation = hourly?.precipitation
    if (!times || !temperature || !relativeHumidity || !precipitation) {
      throw new WeatherError('shape', 'Weather service response was missing required hourly variables.')
    }
    out.push({
      lat: reqLat, // keep the REQUESTED coords
      lon: reqLon,
      times,
      temperature,
      relativeHumidity,
      precipitation,
      dewPoint: hourly?.dew_point_2m,
    })
  }
  return out
}
