/**
 * GET /api/disease-risk — field-level late-blight risk for the demo district.
 *
 * Two honest modes, never blended:
 *   • LIVE (default): fetch Open-Meteo for each field, align to today, run the real engine. If the
 *     weather call fails, respond 502 with a clear message — NEVER a fabricated band.
 *   • DEMO (?scenario=blight_outbreak|borderline_watch|dry_spell): synthesize weather INPUTS and run
 *     the same engine. Response is tagged dataStatus:"scenario" so the UI can label it DEMO MODE.
 *
 * Query params:
 *   lang     = en | hi | kn         (default en)
 *   scenario = <scenario key>       (optional; presence selects DEMO mode)
 *   fieldId  = <demo field id>      (optional; default = all demo fields)
 *
 * There is no trained image/ML model behind this route; risk is rule-based (Hutton + Wallin) and
 * every response says so via mlDelta:0 and the method/citation fields.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { POTATO_LATE_BLIGHT } from '@/lib/disease-risk/models'
import { assessField } from '@/lib/disease-risk/engine'
import type { FieldRiskResult } from '@/lib/disease-risk/engine'
import { SCENARIOS, buildSeries, resolveScenario } from '@/lib/disease-risk/scenarios'
import { fetchOpenMeteo, alignFromDate, WeatherError } from '@/lib/weather/open-meteo'
import { sortWorstFirst } from '@/lib/disease-risk/band'
import { DEMO_FIELDS, DEMO_DISTRICT, resolveField } from '@/lib/fields'
import type { DemoField } from '@/lib/fields'
import type { Lang } from '@/lib/i18n/advisory-templates'

// Weather changes; never statically cache this route.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CENTER: readonly [number, number] = [DEMO_DISTRICT.center.lat, DEMO_DISTRICT.center.lon]
const VALID_LANGS: Lang[] = ['en', 'hi', 'kn']

/** Today's date as "YYYY-MM-DD" in the district's timezone (for aligning live forecasts). */
function todayInTz(tz = 'Asia/Kolkata'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return parts // en-CA formats as YYYY-MM-DD
}

function selectFields(fieldId: string | null): DemoField[] {
  if (!fieldId) return DEMO_FIELDS
  const f = resolveField(fieldId)
  return f ? [f] : []
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const langParam = (searchParams.get('lang') ?? 'en') as Lang
  const lang: Lang = VALID_LANGS.includes(langParam) ? langParam : 'en'
  const scenarioKey = searchParams.get('scenario')
  const fieldId = searchParams.get('fieldId')

  const fields = selectFields(fieldId)
  if (fields.length === 0) {
    return NextResponse.json({ error: `Unknown field id: ${fieldId}` }, { status: 404 })
  }

  const model = POTATO_LATE_BLIGHT
  const generatedAt = new Date().toISOString()

  // ── DEMO MODE ──────────────────────────────────────────────────────────────────────
  if (scenarioKey !== null) {
    const spec = resolveScenario(scenarioKey)
    if (!spec) {
      return NextResponse.json(
        { error: `Unknown scenario: ${scenarioKey}`, available: Object.keys(SCENARIOS) },
        { status: 404 },
      )
    }
    const results: FieldRiskResult[] = fields.map((field) => {
      const [series] = buildSeries(spec, [[field.center.lat, field.center.lon]], CENTER)
      return assessField({ field, model, series, lang, dataStatus: 'scenario' })
    })
    return NextResponse.json({
      mode: 'demo',
      dataStatus: 'scenario',
      scenario: { key: spec.key, label: spec.label, description: spec.description, startDate: spec.startDate },
      demoNotice:
        'DEMO MODE: weather inputs are synthetic (late blight is a Dec–Feb disease; a live August ' +
        'run correctly returns Safe). The Safe/Watch/Act bands below are still computed by the real ' +
        'Hutton + Wallin engine from these inputs — they are not hardcoded.',
      district: DEMO_DISTRICT,
      method: { model: model.id, approach: 'rule-based (Hutton criterion + Wallin DSV)', citation: model.citation, mlDelta: 0 },
      generatedAt,
      fields: sortWorstFirst(results),
    })
  }

  // ── LIVE MODE ──────────────────────────────────────────────────────────────────────
  try {
    const coords = fields.map((f) => [f.center.lat, f.center.lon] as [number, number])
    const seriesList = await fetchOpenMeteo(coords, { timezone: 'Asia/Kolkata', forecastDays: 8, pastDays: 2 })
    const start = todayInTz('Asia/Kolkata')
    const results: FieldRiskResult[] = fields.map((field, i) => {
      const aligned = alignFromDate(seriesList[i], start)
      return assessField({ field, model, series: aligned, lang, dataStatus: 'live' })
    })
    return NextResponse.json({
      mode: 'live',
      dataStatus: 'live',
      weatherSource: 'Open-Meteo (keyless forecast API)',
      district: DEMO_DISTRICT,
      method: { model: model.id, approach: 'rule-based (Hutton criterion + Wallin DSV)', citation: model.citation, mlDelta: 0 },
      generatedAt,
      fields: sortWorstFirst(results),
    })
  } catch (err) {
    if (err instanceof WeatherError) {
      // Honest failure: we could not get real weather, so we return NO risk rather than a fake one.
      return NextResponse.json(
        {
          error: 'weather_unavailable',
          kind: err.kind,
          message: err.message,
          hint: 'Try the demo scenarios (?scenario=blight_outbreak) to exercise the engine without live weather.',
        },
        { status: 502 },
      )
    }
    return NextResponse.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 })
  }
}
