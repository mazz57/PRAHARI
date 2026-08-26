/**
 * Unit tests for combineSignals — how the leaf-image diagnosis is reconciled with the independent
 * weather-based Field Risk band. The key property: it reports agreement AND disagreement honestly,
 * and never forces the two models to match. Runs under `node --test`.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { combineSignals } from '../combine'
import type { DiagnosisResult } from '../types'
import { MODEL_NAME, MODEL_VERSION } from '../types'

function img(status: DiagnosisResult['status'], topClass?: string): DiagnosisResult {
  const model = { name: MODEL_NAME, version: MODEL_VERSION, calibrated: true }
  if (!topClass) return { status, crop: 'potato', model }
  return {
    status,
    crop: 'potato',
    prediction: { class: topClass, confidence: 0.9 },
    alternatives: [],
    model,
  }
}

test('weather elevated (act) + image shows disease -> both agree on attention', () => {
  const c = combineSignals('act', img('ok', 'late_blight'))
  assert.equal(c.status, 'both-attention')
  assert.equal(c.agree, true)
})

test('weather safe + image healthy -> both agree it is clear', () => {
  const c = combineSignals('safe', img('ok', 'healthy'))
  assert.equal(c.status, 'both-clear')
  assert.equal(c.agree, true)
})

test('DISAGREEMENT: weather safe but image shows symptoms -> image-only, not forced to agree', () => {
  const c = combineSignals('safe', img('ok', 'early_blight'))
  assert.equal(c.status, 'image-only')
  assert.equal(c.agree, false)
  assert.match(c.detail, /low risk/i)
})

test('DISAGREEMENT: weather elevated but leaf healthy -> weather-only, not forced to agree', () => {
  const c = combineSignals('watch', img('ok', 'healthy'))
  assert.equal(c.status, 'weather-only')
  assert.equal(c.agree, false)
})

test('uncertain image still contributes a symptom direction but with hedged wording', () => {
  const c = combineSignals('act', img('uncertain', 'late_blight'))
  assert.equal(c.status, 'both-attention')
  assert.match(c.detail, /possible|inspect|expert/i)
})

test('no usable image result (model unavailable) -> na, weather only', () => {
  const c = combineSignals('act', img('model_unavailable'))
  assert.equal(c.status, 'na')
  assert.equal(c.agree, false)
})
