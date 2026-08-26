/**
 * Unit tests for buildResult — the uncertainty logic that turns probabilities into an honest
 * DiagnosisResult. Exercises the same code path the API uses to produce "valid class", "probabilities",
 * and "uncertain" outcomes, WITHOUT needing the ONNX model. Runs under `node --test`.
 *
 * class order used here matches ml/models/class_names.json: ["healthy","early_blight","late_blight"].
 * Passing probabilities positionally proves we map by index, never by object-key order.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildResult } from '../uncertainty'
import type { Thresholds } from '../metadata'

const CLASSES = ['healthy', 'early_blight', 'late_blight']
const T: Thresholds = { confidenceThreshold: 0.6, marginThreshold: 0.15, calibrated: true }

test('confident prediction -> status ok, correct class, sorted alternatives', () => {
  // late_blight is index 2 and clearly highest
  const r = buildResult([0.02, 0.07, 0.91], CLASSES, T)
  assert.equal(r.status, 'ok')
  assert.equal(r.crop, 'potato')
  assert.equal(r.prediction?.class, 'late_blight')
  assert.ok((r.prediction?.confidence ?? 0) > 0.9)
  // alternatives present, sorted high -> low, and exclude the top class
  assert.deepEqual(
    r.alternatives?.map((a) => a.class),
    ['early_blight', 'healthy'],
  )
  assert.equal(r.model.calibrated, true)
})

test('probabilities are the real values, rounded, and reconstruct the full distribution', () => {
  const r = buildResult([0.02, 0.07, 0.91], CLASSES, T)
  const all = [r.prediction!, ...(r.alternatives ?? [])]
  const total = all.reduce((s, p) => s + p.confidence, 0)
  assert.ok(Math.abs(total - 1) < 0.01, 'reported confidences should still sum to ~1')
})

test('low top-1 confidence -> uncertain (below confidenceThreshold)', () => {
  // top class 0.45 < 0.6 threshold
  const r = buildResult([0.45, 0.4, 0.15], CLASSES, T)
  assert.equal(r.status, 'uncertain')
  assert.ok(r.message && r.message.length > 0)
  assert.equal(r.prediction?.class, 'healthy') // still reports the ranked top guess
})

test('small margin -> uncertain even when top-1 clears the confidence threshold', () => {
  // NOTE: with a proper 3-class distribution, top-1 >= 0.6 forces top-2 <= 0.4 (margin >= 0.2), so the
  // margin rule only bites once calibration LOWERS the confidence threshold (or for >3 classes). Use a
  // calibrated-style low threshold here so top-1 passes confidence but fails the margin test.
  const lowConf: Thresholds = { confidenceThreshold: 0.4, marginThreshold: 0.15, calibrated: true }
  // top-1 = 0.48 (>= 0.4), margin over next = 0.48 - 0.42 = 0.06 (< 0.15) => uncertain
  const r = buildResult([0.1, 0.42, 0.48], CLASSES, lowConf)
  assert.equal(r.status, 'uncertain', 'thin margin must trigger uncertainty')
})

test('index-based mapping: highest index wins when it has the highest prob', () => {
  // healthy(idx0) lowest, late_blight(idx2) highest — proves no dict/key-order reliance
  const r = buildResult([0.01, 0.04, 0.95], CLASSES, T)
  assert.equal(r.prediction?.class, 'late_blight')
})
