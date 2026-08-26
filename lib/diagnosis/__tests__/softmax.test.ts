/**
 * Unit tests for the numerically-stable softmax used to turn model logits into probabilities.
 * Runs under `node --test`. No torch, no model, no network — pure math.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { softmax } from '../softmax'

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

test('softmax sums to 1 and preserves order', () => {
  const p = softmax([2, 1, 0.1])
  assert.ok(Math.abs(sum(p) - 1) < 1e-9, 'must sum to 1')
  assert.ok(p[0] > p[1] && p[1] > p[2], 'ordering preserved')
})

test('softmax is stable for large logits (no overflow to NaN)', () => {
  const p = softmax([1000, 999, 998])
  assert.ok(p.every((x) => Number.isFinite(x)), 'no NaN/Inf')
  assert.ok(Math.abs(sum(p) - 1) < 1e-9)
})

test('equal logits give a uniform distribution', () => {
  const p = softmax([5, 5, 5])
  for (const x of p) assert.ok(Math.abs(x - 1 / 3) < 1e-9)
})

test('empty input returns empty array', () => {
  assert.deepEqual(softmax([]), [])
})
