/**
 * Per-cell disease assessment: hourly weather -> daily stats -> risk band.
 * Faithful TypeScript port of Prahari engine/aggregate.py (pure, no I/O).
 *
 *   * Hutton daily gate uses TOTAL wet hours in the day and daily min temp.
 *   * The Hutton criterion needs those qualifying days to be CONSECUTIVE.
 *   * Wallin DSV uses the LONGEST wet SPELL and the mean temperature DURING that spell.
 *   * Bands come from accumulated DSV thresholds (spray -> act, amber -> watch).
 */
import { criterionMet, hoursRhAtOrAbove } from './hutton'
import { wallinDsv } from './wallin'
import type { HuttonParams, SeverityConfig } from './models'

export type Band = 'safe' | 'watch' | 'act'

export interface DayStats {
  date: string
  /** total hours RH >= threshold (Hutton 6 h gate) */
  wetHours: number
  /** longest consecutive wet spell (drives DSV) */
  spellHours: number
  minTempC: number
  /** mean temp DURING the longest wet spell */
  meanWetTempC: number
  precipMm: number
  /** Hutton daily gate: minTemp >= minTempC AND wetHours >= minWetHours */
  qualifies: boolean
  dsv: number
}

export interface CellAssessment {
  band: Band
  risk: number
  physicsRisk: number
  /** 0.0 — physics only, no ML correction (honest: there is no trained model here). */
  mlDelta: number
  criterionMet: boolean
  dsvToday: number
  dsvAccum: number
  wetHours: number
  minTempC: number
  meanWetTempC: number
}

function round(value: number, digits: number): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

/** Group hourly indices by calendar day using the "YYYY-MM-DD" prefix (pure string work). */
function dailyIndexGroups(times: readonly string[]): [string, number[]][] {
  const groups = new Map<string, number[]>()
  const order: string[] = []
  times.forEach((t, idx) => {
    const day = t.slice(0, 10)
    if (!groups.has(day)) {
      groups.set(day, [])
      order.push(day)
    }
    groups.get(day)!.push(idx)
  })
  return order.map((day) => [day, groups.get(day)!])
}

export function dailyStats(
  times: readonly string[],
  temperature: readonly number[],
  relativeHumidity: readonly number[],
  precipitation: readonly number[],
  params: HuttonParams,
  severity: SeverityConfig,
): DayStats[] {
  const rhThr = params.rhThreshold
  const minWet = params.minWetHours
  const minT = params.minTempC

  const out: DayStats[] = []
  for (const [day, idxs] of dailyIndexGroups(times)) {
    const dayRh = idxs.map((i) => relativeHumidity[i])
    const dayTemp = idxs.map((i) => temperature[i])

    const wetHours = hoursRhAtOrAbove(dayRh, rhThr)

    // Longest wet spell and the mean temperature during it.
    let bestLen = 0
    let bestSum = 0.0
    let curLen = 0
    let curSum = 0.0
    for (let k = 0; k < dayRh.length; k++) {
      if (dayRh[k] >= rhThr) {
        curLen += 1
        curSum += dayTemp[k]
        if (curLen > bestLen) {
          bestLen = curLen
          bestSum = curSum
        }
      } else {
        curLen = 0
        curSum = 0.0
      }
    }
    const meanWetTemp = bestLen ? bestSum / bestLen : 0.0

    const minTemp = dayTemp.length ? Math.min(...dayTemp) : 0.0
    const precip = idxs.reduce((s, i) => s + precipitation[i], 0.0)
    const qualifies = minTemp >= minT && wetHours >= minWet
    const dsv = wallinDsv(meanWetTemp, bestLen, severity.dsvTable)

    out.push({
      date: day,
      wetHours,
      spellHours: bestLen,
      minTempC: round(minTemp, 2),
      meanWetTempC: round(meanWetTemp, 2),
      precipMm: round(precip, 2),
      qualifies,
      dsv,
    })
  }
  return out
}

/** Combine daily stats into a risk band. mlDelta is 0 (physics only). */
export function assessCell(
  days: readonly DayStats[],
  params: HuttonParams,
  severity: SeverityConfig,
): CellAssessment {
  const crit = criterionMet(days.map((d) => d.qualifies), params.consecutiveDays)
  const dsvAccum = days.reduce((s, d) => s + d.dsv, 0)
  const dsvToday = days.length ? days[0].dsv : 0

  const spray = severity.sprayThresholdDsv
  const amber = severity.amberThresholdDsv

  // Severity-gated bands: the Hutton criterion escalates to "watch" only when disease severity
  // is actually developing (dsvAccum > 0). Criterion met but DSV 0 (wet-spell temp outside the
  // pathogen's viable range) stays "safe" — avoiding a district-wide false alarm.
  let band: Band
  if (dsvAccum >= spray) band = 'act'
  else if (dsvAccum >= amber || (crit && dsvAccum > 0)) band = 'watch'
  else band = 'safe'

  const physicsRisk = spray ? Math.min(1.0, dsvAccum / spray) : 0.0
  return {
    band,
    risk: round(physicsRisk, 3),
    physicsRisk: round(physicsRisk, 3),
    mlDelta: 0.0,
    criterionMet: crit,
    dsvToday,
    dsvAccum,
    wetHours: days.length ? days[0].wetHours : 0,
    minTempC: days.length ? days[0].minTempC : 0.0,
    meanWetTempC: days.length ? days[0].meanWetTempC : 0.0,
  }
}

export const BAND_RANK: Record<Band | 'unknown', number> = { act: 0, watch: 1, safe: 2, unknown: 3 }
