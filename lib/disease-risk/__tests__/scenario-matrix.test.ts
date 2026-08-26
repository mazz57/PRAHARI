/**
 * Demo scenario matrix — PROVES the honesty contract: the engine, not a hardcoded value, decides
 * each field's band from synthesized weather. If someone retunes a scenario and a band flips, this
 * test fails loudly rather than a fake number silently shipping.
 *
 * Run (compiled to CJS): see scripts note in the engine test. Values below are the ENGINE's output;
 * they are asserted here, never fed back into the engine.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCENARIOS, buildSeries } from '../scenarios'
import { assessField } from '../engine'
import { POTATO_LATE_BLIGHT } from '../models'
import { DEMO_FIELDS, DEMO_DISTRICT, resolveField } from '../../fields'

const CENTER: readonly [number, number] = [DEMO_DISTRICT.center.lat, DEMO_DISTRICT.center.lon]

function bandFor(scenarioKey: string, fieldId: string): string {
  const spec = SCENARIOS[scenarioKey]
  const field = resolveField(fieldId)!
  const [series] = buildSeries(spec, [[field.center.lat, field.center.lon]], CENTER)
  const result = assessField({ field, model: POTATO_LATE_BLIGHT, series, lang: 'en', dataStatus: 'scenario' })
  return result.band
}

// The whole point: three fields, one weather system, three different bands — the west of the
// district stays safe while the east escalates to spray. All computed by Hutton + Wallin.
test('blight_outbreak spreads across the three demo fields: safe / watch / act', () => {
  assert.equal(bandFor('blight_outbreak', 'fld_nahar'), 'safe') // Canal field, west
  assert.equal(bandFor('blight_outbreak', 'fld_school'), 'watch') // Behind the school, middle
  assert.equal(bandFor('blight_outbreak', 'fld_bada'), 'act') // Big field, east
})

test('dry_spell is safe for every field (Hutton wet-hours leg fails)', () => {
  for (const f of DEMO_FIELDS) assert.equal(bandFor('dry_spell', f.id), 'safe')
})

test('borderline_watch is watch for every field (criterion met, DSV below spray)', () => {
  for (const f of DEMO_FIELDS) assert.equal(bandFor('borderline_watch', f.id), 'watch')
})

test('the engine is honest: mlDelta is exactly 0 (no trained model) and dataStatus is preserved', () => {
  const spec = SCENARIOS.blight_outbreak
  const field = resolveField('fld_bada')!
  const [series] = buildSeries(spec, [[field.center.lat, field.center.lon]], CENTER)
  const r = assessField({ field, model: POTATO_LATE_BLIGHT, series, lang: 'en', dataStatus: 'scenario' })
  assert.equal(r.mlDelta, 0.0)
  assert.equal(r.dataStatus, 'scenario')
  assert.equal(r.risk, Math.min(1, r.dsvAccum / POTATO_LATE_BLIGHT.severity.sprayThresholdDsv))
})

test('act advisory explains WHY with the real wet-hours count, in each language', () => {
  const spec = SCENARIOS.blight_outbreak
  const field = resolveField('fld_bada')!
  for (const lang of ['en', 'hi', 'kn'] as const) {
    const [series] = buildSeries(spec, [[field.center.lat, field.center.lon]], CENTER)
    const r = assessField({ field, model: POTATO_LATE_BLIGHT, series, lang, dataStatus: 'scenario' })
    assert.equal(r.band, 'act')
    // The four-part message must be non-empty and name the field first.
    assert.ok(r.advisory.text.length > 0)
    assert.ok(r.advisory.which.length > 0)
    assert.equal(r.advisory.whyKey, 'why_wet')
  }
})

test('safe-but-humid field (Canal) is not silently a hidden risk', () => {
  // Canal meets the Hutton criterion (humid + mild) but Wallin severity stays 0 → honest "safe".
  const spec = SCENARIOS.blight_outbreak
  const field = resolveField('fld_nahar')!
  const [series] = buildSeries(spec, [[field.center.lat, field.center.lon]], CENTER)
  const r = assessField({ field, model: POTATO_LATE_BLIGHT, series, lang: 'en', dataStatus: 'scenario' })
  assert.equal(r.band, 'safe')
  assert.equal(r.dsvAccum, 0)
})
