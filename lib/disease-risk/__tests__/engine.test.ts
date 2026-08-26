/**
 * Fidelity tests for the ported disease-risk engine. Values mirror Prahari's pytest suite
 * (tests/test_wallin.py, tests/test_aggregate.py) so the TypeScript port is provably faithful.
 * Run: node --experimental-strip-types --test lib/disease-risk/__tests__/engine.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wallinDsv, DEFAULT_DSV_TABLE } from '../wallin'
import type { DsvBand } from '../wallin'
import { dailyStats, assessCell } from '../aggregate'
import { criterionMet, hoursRhAtOrAbove, longestWetSpellHours } from '../hutton'
import { POTATO_LATE_BLIGHT } from '../models'

const P = POTATO_LATE_BLIGHT.params
const S = POTATO_LATE_BLIGHT.severity

// ── Hutton primitives ─────────────────────────────────────────────
test('hoursRhAtOrAbove is inclusive at 90', () => {
  assert.equal(hoursRhAtOrAbove([89.9, 90.0, 90.1, 50], 90), 2)
})
test('longestWetSpellHours does not combine fragments', () => {
  assert.equal(longestWetSpellHours([95, 95, 50, 95, 95, 95, 50], 90), 3)
})
test('criterionMet requires consecutive, not total', () => {
  assert.equal(criterionMet([true, false, true], 2), false)
  assert.equal(criterionMet([true, true, false], 2), true)
})

// ── Wallin published table values ─────────────────────────────────
const WALLIN_CASES: [number, number, number][] = [
  [9.0, 14, 0], [9.0, 15, 0], [9.0, 18, 1], [9.0, 20, 1], [9.0, 21, 2], [9.0, 23, 2], [9.0, 24, 3],
  [13.0, 11, 0], [13.0, 12, 0], [13.0, 15, 1], [13.0, 17, 1], [13.0, 18, 2], [13.0, 21, 3], [13.0, 24, 4],
  [20.0, 8, 0], [20.0, 9, 0], [20.0, 12, 1], [20.0, 15, 2], [20.0, 18, 3], [20.0, 23, 3], [20.0, 24, 4],
]
for (const [t, h, expected] of WALLIN_CASES) {
  test(`wallinDsv(${t}, ${h}) === ${expected}`, () => assert.equal(wallinDsv(t, h), expected))
}

test('outside development range is zero; bounds develop', () => {
  assert.equal(wallinDsv(7.1, 24), 0)
  assert.equal(wallinDsv(26.7, 24), 0)
  assert.equal(wallinDsv(28.0, 24), 0)
  assert.equal(wallinDsv(-5.0, 24), 0)
  assert.equal(wallinDsv(7.2, 24), 3)
  assert.equal(wallinDsv(26.6, 24), 4)
})

test('zero wet hours is zero at every temperature', () => {
  for (const t of [8.0, 13.0, 20.0, 26.0]) assert.equal(wallinDsv(t, 0), 0)
})

test('between-band temperature uses the warmer band', () => {
  assert.equal(wallinDsv(15.0, 15), 1)
  assert.equal(wallinDsv(15.05, 15), 2)
  assert.equal(wallinDsv(15.1, 15), 2)
  assert.equal(wallinDsv(11.6, 15), 0)
  assert.equal(wallinDsv(11.65, 15), 1)
  assert.equal(wallinDsv(11.7, 15), 1)
})

test('no temperature in range scores 0 for a full day of wetness', () => {
  for (let i = 720; i <= 2660; i++) {
    const t = i / 100
    assert.ok(wallinDsv(t, 24) > 0, `${t} C scored 0 with 24 h of leaf wetness`)
  }
})

test('caller-supplied table is used, not the default', () => {
  const custom: DsvBand[] = [{ t_min: 0.0, t_max: 50.0, breaks: [[1, 4]] }]
  assert.equal(wallinDsv(40.0, 1, custom), 4)
  assert.equal(wallinDsv(40.0, 1), 0)
})

test('bands given out of order are handled', () => {
  const reversed = [...DEFAULT_DSV_TABLE].reverse()
  assert.equal(wallinDsv(20.0, 24, reversed), 4)
  assert.equal(wallinDsv(9.0, 24, reversed), 3)
})

// ── Aggregate: daily stats + band logic ───────────────────────────
function day(date: string, wetHours: number, tempC: number, minTempC: number) {
  const times: string[] = []
  const temperature: number[] = []
  const rh: number[] = []
  const precip: number[] = []
  for (let h = 0; h < 24; h++) {
    times.push(`${date}T${String(h).padStart(2, '0')}:00`)
    temperature.push(h === 0 ? minTempC : tempC)
    rh.push(h >= 1 && h <= wetHours ? 95.0 : 60.0)
    precip.push(0.0)
  }
  return { times, temperature, rh, precip }
}
function concat(...days: ReturnType<typeof day>[]) {
  return {
    times: days.flatMap((d) => d.times),
    temperature: days.flatMap((d) => d.temperature),
    rh: days.flatMap((d) => d.rh),
    precip: days.flatMap((d) => d.precip),
  }
}

test('two consecutive wet warm days qualify and accumulate DSV', () => {
  const c = concat(
    day('2026-01-10', 20, 18.0, 11.0),
    day('2026-01-11', 20, 18.0, 11.0),
    day('2026-01-12', 0, 18.0, 11.0),
  )
  const days = dailyStats(c.times, c.temperature, c.rh, c.precip, P, S)
  assert.deepEqual(days.map((d) => d.qualifies), [true, true, false])
  assert.equal(days[0].meanWetTempC, 18.0)
  const a = assessCell(days, P, S)
  assert.equal(a.criterionMet, true)
  assert.ok(a.dsvAccum > 0)
  assert.ok(a.band === 'watch' || a.band === 'act')
  assert.equal(a.mlDelta, 0.0)
})

test('cold days do not qualify -> safe', () => {
  const c = concat(day('2026-01-10', 8, 6.0, 4.0), day('2026-01-11', 8, 6.0, 4.0))
  const days = dailyStats(c.times, c.temperature, c.rh, c.precip, P, S)
  assert.ok(days.every((d) => d.qualifies === false))
  assert.equal(assessCell(days, P, S).band, 'safe')
})

test('non-consecutive qualifying days do not meet criterion', () => {
  const c = concat(
    day('2026-01-10', 8, 14.0, 11.0),
    day('2026-01-11', 0, 14.0, 11.0),
    day('2026-01-12', 8, 14.0, 11.0),
  )
  const days = dailyStats(c.times, c.temperature, c.rh, c.precip, P, S)
  assert.deepEqual(days.map((d) => d.qualifies), [true, false, true])
  assert.equal(assessCell(days, P, S).criterionMet, false)
})

test('criterion met but too hot is safe, not watch (no false alarm)', () => {
  const c = concat(
    day('2026-08-24', 18, 28.0, 25.0),
    day('2026-08-25', 18, 28.0, 25.0),
  )
  const days = dailyStats(c.times, c.temperature, c.rh, c.precip, P, S)
  assert.ok(days.every((d) => d.qualifies))
  const a = assessCell(days, P, S)
  assert.equal(a.criterionMet, true)
  assert.equal(a.dsvAccum, 0)
  assert.equal(a.band, 'safe')
})
