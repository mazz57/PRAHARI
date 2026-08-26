/**
 * Synthetic weather for demo scenarios — a faithful TypeScript port of Prahari adapters/scenario.py.
 *
 * 🔴 THE LINE THIS MUST NOT CROSS (verbatim intent from the brief): a scenario synthesises the
 * *inputs* (temperature, humidity, rain) for a named weather pattern and lets the REAL engine
 * compute the outputs. Nothing here decides a band, a DSV or a risk value. If the engine says
 * "act", that is Hutton and Wallin agreeing on this weather — not a number someone typed in.
 *
 * WHY THIS EXISTS: potato late blight is a rabi-season disease (Dec–Feb in Farrukhabad) and
 * Wallin's development range tops out at 26.6 °C. A run in late August correctly returns "safe"
 * for every field, which exercises none of the alerting path. These scenarios reproduce the
 * cool, wet conditions the model was actually built for.
 *
 * ── MVP TUNING NOTE ──────────────────────────────────────────────────────────────────────
 * Prahari synthesised weather across a 441-cell district grid and interpolated each field onto
 * it. This MVP resolves each field at its OWN coordinates (no grid), so the spatial gradients
 * below are tuned for the three demo fields' point locations rather than a full mesh. The band
 * SPREAD (safe / watch / act) is still computed by the engine from these inputs — it is verified
 * in lib/disease-risk/__tests__/scenario-matrix.test.ts, not asserted here.
 */
import type { HourlySeries } from '@/lib/weather/types'

// Magnus coefficients — dew point is DERIVED from the temperature and RH we generate, so the
// pair handed to the engine is physically self-consistent (an RH series that disagreed with its
// dew point would be an input no real station could produce).
const MAGNUS_A = 17.625
const MAGNUS_B = 243.04

function round(value: number, digits: number): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export function dewPointFromRh(tempC: number, rhPct: number): number {
  const rh = Math.min(Math.max(rhPct, 1.0), 100.0)
  const gamma = Math.log(rh / 100.0) + (MAGNUS_A * tempC) / (MAGNUS_B + tempC)
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma)
}

/** A day's weather shape, described the way an agronomist would describe it. */
export interface ScenarioSpec {
  key: string
  /** Short label for the UI (kept language-neutral; UI localises separately). */
  label: string
  description: string
  /** Band the AUTHOR expects the engine to compute for the district — a DOCUMENTATION hint only,
   *  never used in computation. The engine's output is authoritative; the matrix test checks it. */
  expectedDistrictBand: 'safe' | 'watch' | 'act'
  startDate: string // ISO date the series begins
  days: number
  dayTempC: number // afternoon maximum
  nightTempC: number // pre-dawn minimum
  wetHours: number // consecutive hours at/above wetRh per night (district mean)
  wetRh: number // RH during the wet spell
  dryRh: number // RH outside it
  precipMm: number // daily rainfall, dropped into the wet window
  // Gentle spatial variation so neighbouring fields can land in different bands from one system.
  latGradientC: number
  lonGradientRh: number
  /** Hours of leaf wetness gained per degree of longitude east — the gradient that matters most,
   *  because Wallin keys DSV off wet-spell DURATION. */
  wetHoursGradientH: number
}

function nodeWetHours(spec: ScenarioSpec, lonDelta: number): number {
  const n = spec.wetHours + Math.round(lonDelta * spec.wetHoursGradientH)
  return Math.max(0, Math.min(24, n))
}

/** Sinusoidal diurnal cycle: coldest at 05:00, warmest at 15:00. */
function hourlyTemp(spec: ScenarioSpec, hour: number): number {
  const mean = (spec.dayTempC + spec.nightTempC) / 2.0
  const amp = (spec.dayTempC - spec.nightTempC) / 2.0
  return mean - amp * Math.cos(((hour - 5) / 24.0) * 2 * Math.PI)
}

/**
 * The wet spell straddles dawn (leaves wettest overnight, dry off mid-morning), placed as a
 * CONTIGUOUS run inside one calendar day. Splitting it across midnight would create two fragments
 * the Hutton criterion must not combine — a case for the test suite, not a demo fixture.
 */
function wetWindow(hours: number): Set<number> {
  const n = Math.max(0, Math.min(hours, 24))
  const start = Math.max(0, 6 - Math.floor(n / 2)) // centred on 06:00, clamped inside the day
  const out = new Set<number>()
  for (let h = start; h < start + n; h++) out.add(h)
  return out
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Build the ISO local timestamps for the whole window (pure string/date arithmetic, UTC-safe). */
function buildTimes(startDate: string, days: number): string[] {
  const times: string[] = []
  const [y, m, d] = startDate.split('-').map((s) => parseInt(s, 10))
  for (let dayIdx = 0; dayIdx < days; dayIdx++) {
    // Use UTC to advance the calendar date deterministically, then format the LOCAL-looking stamp.
    const dt = new Date(Date.UTC(y, m - 1, d + dayIdx))
    const yy = dt.getUTCFullYear()
    const mm = pad2(dt.getUTCMonth() + 1)
    const dd = pad2(dt.getUTCDate())
    for (let h = 0; h < 24; h++) times.push(`${yy}-${mm}-${dd}T${pad2(h)}:00`)
  }
  return times
}

/**
 * One HourlySeries per coordinate, in the order given (the provider contract).
 * @param center district centre; per-node gradients are measured relative to it.
 */
export function buildSeries(
  spec: ScenarioSpec,
  coords: ReadonlyArray<readonly [number, number]>,
  center: readonly [number, number],
): HourlySeries[] {
  const times = buildTimes(spec.startDate, spec.days)
  const [cLat, cLon] = center
  const out: HourlySeries[] = []

  for (const [lat, lon] of coords) {
    // Deterministic per-node offsets: no randomness, so two runs are byte-identical.
    const tOff = (lat - cLat) * spec.latGradientC
    const rhOff = (lon - cLon) * spec.lonGradientRh
    const wet = wetWindow(nodeWetHours(spec, lon - cLon))
    // Rain falls only while the canopy is wet; a node with no wet hours gets no rain.
    const precipPerWetHour = wet.size ? spec.precipMm / wet.size : 0.0

    const temperature: number[] = []
    const relativeHumidity: number[] = []
    const dewPoint: number[] = []
    const precipitation: number[] = []
    for (let dayIdx = 0; dayIdx < spec.days; dayIdx++) {
      for (let h = 0; h < 24; h++) {
        const t = round(hourlyTemp(spec, h) + tOff, 2)
        const r = round(Math.min(100.0, Math.max(5.0, (wet.has(h) ? spec.wetRh : spec.dryRh) + rhOff)), 2)
        temperature.push(t)
        relativeHumidity.push(r)
        dewPoint.push(round(dewPointFromRh(t, r), 2))
        precipitation.push(wet.has(h) ? round(precipPerWetHour, 2) : 0.0)
      }
    }

    out.push({ lat, lon, times, temperature, relativeHumidity, precipitation, dewPoint })
  }
  return out
}

/**
 * Demo scenarios — synthetic weather INPUTS for the real engine.
 *
 * Values are typical Indo-Gangetic-plain rabi conditions, not measurements from a station.
 * Wallin breakpoints (DSV = highest hour-break the wet spell reaches):
 *    7.2–11.6 °C:  15h→0  18h→1  21h→2  24h→3
 *   11.7–15.0 °C:  12h→0  15h→1  18h→2  21h→3  24h→4
 *   15.1–26.6 °C:   9h→0  12h→1  15h→2  18h→3  24h→4
 * Spray at 18 accumulated DSV, amber (watch) at 12; over a 10-day window that is ~DSV 2/day to act.
 */
export const SCENARIOS: Record<string, ScenarioSpec> = {
  dry_spell: {
    key: 'dry_spell',
    label: 'Dry spell',
    expectedDistrictBand: 'safe',
    description:
      'Cool but dry: nights are cold enough, yet leaves never stay wet long enough. Proves the ' +
      'model reports safe for the right reason — the Hutton wet-hours leg fails outright — rather ' +
      'than because nothing was computed. The control case for the other two.',
    startDate: '2026-12-18',
    days: 10,
    dayTempC: 21.0,
    nightTempC: 9.0,
    wetHours: 3, // below the 6 h Hutton leg
    wetRh: 93.0,
    dryRh: 45.0,
    precipMm: 0.0,
    latGradientC: 3.0,
    lonGradientRh: 6.0,
    wetHoursGradientH: 4.0,
  },
  borderline_watch: {
    key: 'borderline_watch',
    label: 'Borderline',
    expectedDistrictBand: 'watch',
    description:
      'The uncomfortable middle: the criterion is met and leaf wetness just reaches Wallin’s first ' +
      'breakpoint, so severity accrues at ~1 DSV a day and after ten days sits below the spray ' +
      'threshold. Watch, not spray — the case where a false alarm is most tempting and most damaging.',
    startDate: '2026-12-18',
    days: 10,
    dayTempC: 16.0,
    nightTempC: 10.4, // barely above the 10 °C threshold
    wetHours: 16, // past the 6 h Hutton leg and Wallin’s 15 h break, short of 18 h
    wetRh: 91.0, // barely above 90 %
    dryRh: 60.0,
    precipMm: 0.4,
    latGradientC: 3.0,
    lonGradientRh: 8.0,
    wetHoursGradientH: 5.0,
  },
  blight_outbreak: {
    key: 'blight_outbreak',
    label: 'Blight outbreak',
    expectedDistrictBand: 'act',
    description:
      'A settled overcast drizzle spell — how late-blight epidemics actually build: thick cloud caps ' +
      'the afternoon near 17 °C, nights stay mild, and the canopy never fully dries. Both Hutton legs ' +
      'are met on consecutive days and leaf wetness runs long enough for Wallin severity to accumulate ' +
      'past the spray threshold. The humid air mass has an edge, so the west of the district can stay ' +
      'safe while the east escalates to spray.',
    startDate: '2026-12-18',
    days: 10,
    dayTempC: 17.0, // overcast: afternoon high suppressed, canopy stays wet
    nightTempC: 12.5, // >= 10 °C, Hutton minimum-temperature leg satisfied
    // District-mean leaf wetness. Tuned (with the gradient) for the three point-fields so the
    // engine computes safe (Canal, west) / watch (school) / act (big field, east). See matrix test.
    wetHours: 16,
    wetRh: 97.0,
    dryRh: 78.0, // still humid even "dry": an overcast day, not a sunny one
    precipMm: 2.4, // light persistent drizzle, not a downpour
    latGradientC: 5.0,
    lonGradientRh: 4.0,
    wetHoursGradientH: 25.0, // dry-off time varies west→east across the district
  },
}

export function resolveScenario(key: string): ScenarioSpec | undefined {
  return SCENARIOS[key]
}
