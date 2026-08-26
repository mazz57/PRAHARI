/**
 * Integration test for GET /api/disease-risk — drives the REAL route handler (not a re-implementation)
 * across all demo scenarios and all three languages. Proves end-to-end that:
 *   • the three scenarios yield the intended per-field bands (engine-computed, not hardcoded),
 *   • the response envelope is well-formed and tagged as DEMO (dataStatus:"scenario"),
 *   • advisory text is genuinely localized (en ≠ hi ≠ kn),
 *   • the honesty contract holds (mlDelta === 0 everywhere).
 *
 * The route only reads `req.url`, so a minimal { url } stand-in is a faithful NextRequest for GET.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GET } from '../route'

type Json = Record<string, unknown>

async function call(query: string): Promise<{ status: number; body: any }> {
  const req = { url: `http://localhost/api/disease-risk${query}` } as unknown as Parameters<typeof GET>[0]
  const res = await GET(req)
  const body = await res.json()
  return { status: res.status, body }
}

const SCENARIOS = ['blight_outbreak', 'borderline_watch', 'dry_spell'] as const

test('demo response is well-formed and honestly tagged', async () => {
  const { status, body } = await call('?scenario=blight_outbreak&lang=en')
  assert.equal(status, 200)
  assert.equal(body.mode, 'demo')
  assert.equal(body.dataStatus, 'scenario')
  assert.equal(body.method.mlDelta, 0, 'no ML: mlDelta must be 0')
  assert.ok(typeof body.demoNotice === 'string' && body.demoNotice.length > 0)
  assert.ok(body.district && body.district.nameEn === 'Farrukhabad')
  assert.equal(body.fields.length, 3)
})

test('worst-first ordering: blight_outbreak leads with the ACT field', async () => {
  const { body } = await call('?scenario=blight_outbreak&lang=en')
  const bands = body.fields.map((f: Json) => f.band)
  // sortWorstFirst puts act before watch before safe.
  assert.deepEqual([...bands].sort(rank), bands, `bands should already be worst-first: ${bands}`)
  assert.ok(bands.includes('act'), 'blight outbreak should push at least one field to ACT')
})

test('dry_spell is SAFE for every field (no false alarm)', async () => {
  const { body } = await call('?scenario=dry_spell&lang=en')
  for (const f of body.fields) assert.equal(f.band, 'safe', `${f.fieldId} should be safe in a dry spell`)
})

test('borderline_watch produces WATCH (not act, not safe) for every field', async () => {
  const { body } = await call('?scenario=borderline_watch&lang=en')
  for (const f of body.fields) assert.equal(f.band, 'watch', `${f.fieldId} should be watch`)
})

test('every scenario keeps the honesty contract (mlDelta 0, real dataStatus)', async () => {
  for (const s of SCENARIOS) {
    const { body } = await call(`?scenario=${s}&lang=en`)
    assert.equal(body.dataStatus, 'scenario')
    for (const f of body.fields) assert.equal(f.mlDelta, 0)
  }
})

test('advisory text is genuinely localized across en/hi/kn', async () => {
  const en = (await call('?scenario=blight_outbreak&lang=en')).body
  const hi = (await call('?scenario=blight_outbreak&lang=hi')).body
  const kn = (await call('?scenario=blight_outbreak&lang=kn')).body

  // Same computed bands regardless of language (band is physics, not language).
  assert.deepEqual(en.fields.map((f: Json) => f.band), hi.fields.map((f: Json) => f.band))
  assert.deepEqual(en.fields.map((f: Json) => f.band), kn.fields.map((f: Json) => f.band))

  // ...but the human text must actually differ per language.
  const e = en.fields[0].advisory.text
  const h = hi.fields[0].advisory.text
  const k = kn.fields[0].advisory.text
  assert.ok(e && h && k, 'advisory text present in all languages')
  assert.notEqual(e, h, 'en and hi advisories must differ')
  assert.notEqual(h, k, 'hi and kn advisories must differ')
  assert.notEqual(e, k, 'en and kn advisories must differ')

  // Band labels localized too.
  assert.notEqual(en.fields[0].advisory.bandLabel, hi.fields[0].advisory.bandLabel)
})

test('unknown scenario is a clear 404, never a fabricated band', async () => {
  const { status, body } = await call('?scenario=does_not_exist&lang=en')
  assert.equal(status, 404)
  assert.ok(Array.isArray(body.available))
})

function rank(a: string, b: string): number {
  const order: Record<string, number> = { act: 0, watch: 1, safe: 2, unknown: 3 }
  return (order[a] ?? 9) - (order[b] ?? 9)
}
