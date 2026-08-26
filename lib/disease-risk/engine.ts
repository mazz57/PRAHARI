/**
 * Disease-risk orchestration — the one place that turns an hourly weather series into a
 * field-level result: band, risk, the honest WHY factors, and a localized advisory.
 *
 * This is pure: it takes a weather series in and returns a result. It never fetches anything and
 * never decides a band itself — the band comes from aggregate.assessCell (Hutton + Wallin). If the
 * weather is missing, the CALLER (API route) must surface an error rather than asking for a result.
 */
import { dailyStats, assessCell } from '@/lib/disease-risk/aggregate'
import type { DayStats, Band } from '@/lib/disease-risk/aggregate'
import type { DiseaseModel } from '@/lib/disease-risk/models'
import { buildAdvisory } from '@/lib/disease-risk/advisory'
import type { Advisory } from '@/lib/disease-risk/advisory'
import { ADVISORY_TEMPLATES } from '@/lib/i18n/advisory-templates'
import type { Lang } from '@/lib/i18n/advisory-templates'
import { fieldSpokenName } from '@/lib/fields'
import type { DemoField } from '@/lib/fields'
import type { HourlySeries, DataStatus } from '@/lib/weather/types'

/** One leg of the Hutton criterion, exposed so the UI can show WHY honestly. */
export interface HuttonLeg {
  value: number
  threshold: number
  met: boolean
}

export interface FieldRiskResult {
  fieldId: string
  fieldName: string
  cropKey: string
  crop: string
  disease: string
  coords: { lat: number; lon: number }

  band: Band
  /** 0..1, = min(1, dsvAccum / sprayThreshold). Physics only. */
  risk: number
  physicsRisk: number
  /** 0.0 — there is no trained ML model here; the risk is rule-based and we say so. */
  mlDelta: number

  criterionMet: boolean
  dsvToday: number
  dsvAccum: number
  wetHours: number
  minTempC: number
  meanWetTempC: number

  /** The three Hutton legs for today's leading day, plus the consecutive-day count. */
  legs: {
    minTemp: HuttonLeg
    wetHours: HuttonLeg
    consecutiveDays: HuttonLeg
  }
  /** Longest run of consecutive qualifying days in the window. */
  consecutiveQualifyingDays: number
  viableTempC: readonly [number, number]
  /** DSV thresholds behind the band, exposed so the UI can explain WHY honestly. */
  severity: { sprayThresholdDsv: number; amberThresholdDsv: number }

  /** Per-day series for charts (dates, wet hours, DSV). */
  days: DayStats[]

  advisory: Advisory

  modelId: string
  citation: string
  /** 'live' (Open-Meteo forecast) or 'scenario' (synthetic demo input). Never hidden. */
  dataStatus: DataStatus
  generatedAt: string
}

/** Longest run of `true` in a boolean list. */
function maxConsecutive(flags: readonly boolean[]): number {
  let best = 0
  let run = 0
  for (const f of flags) {
    if (f) {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

export interface AssessFieldInput {
  field: DemoField
  model: DiseaseModel
  series: HourlySeries
  lang: Lang
  dataStatus: DataStatus
  now?: Date
}

/**
 * Assess one field from its weather series. The series must already be aligned so that its first
 * day is "today" (the API route does this for live data; scenarios begin at their own start date).
 */
export function assessField(input: AssessFieldInput): FieldRiskResult {
  const { field, model, series, lang, dataStatus } = input
  const { params, severity } = model

  const days = dailyStats(
    series.times,
    series.temperature,
    series.relativeHumidity,
    series.precipitation,
    params,
    severity,
  )
  const cell = assessCell(days, params, severity)

  const t = ADVISORY_TEMPLATES[lang]
  const fieldName = fieldSpokenName(field, lang)

  const advisory = buildAdvisory({
    lang,
    fieldName,
    cropKey: field.cropKey,
    band: cell.band,
    criterionMet: cell.criterionMet,
    dsvAccum: cell.dsvAccum,
    wetHours: cell.wetHours,
    meanWetTempC: cell.meanWetTempC,
    minWetHours: params.minWetHours,
    viableTempC: model.viableTempC,
    // No sprayWindow: this MVP does not compute a specific window, so the advisory gives honest
    // general timing ("spray early in the morning once the weather clears") rather than inventing one.
  })

  const consecutive = maxConsecutive(days.map((d) => d.qualifies))

  return {
    fieldId: field.id,
    fieldName,
    cropKey: field.cropKey,
    crop: t.crops[field.cropKey] ?? field.cropKey,
    disease: t.disease,
    coords: { lat: series.lat, lon: series.lon },

    band: cell.band,
    risk: cell.risk,
    physicsRisk: cell.physicsRisk,
    mlDelta: cell.mlDelta,

    criterionMet: cell.criterionMet,
    dsvToday: cell.dsvToday,
    dsvAccum: cell.dsvAccum,
    wetHours: cell.wetHours,
    minTempC: cell.minTempC,
    meanWetTempC: cell.meanWetTempC,

    legs: {
      minTemp: { value: cell.minTempC, threshold: params.minTempC, met: cell.minTempC >= params.minTempC },
      wetHours: { value: cell.wetHours, threshold: params.minWetHours, met: cell.wetHours >= params.minWetHours },
      consecutiveDays: { value: consecutive, threshold: params.consecutiveDays, met: cell.criterionMet },
    },
    consecutiveQualifyingDays: consecutive,
    viableTempC: model.viableTempC,
    severity: { sprayThresholdDsv: severity.sprayThresholdDsv, amberThresholdDsv: severity.amberThresholdDsv },

    days,

    advisory,

    modelId: model.id,
    citation: model.citation,
    dataStatus,
    generatedAt: (input.now ?? new Date()).toISOString(),
  }
}
