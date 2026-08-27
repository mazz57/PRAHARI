/**
 * Unit tests for labelText — farmer-friendly class labels with a safe fallback. `node --test`.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { labelText } from '../labels'

test('known classes map to friendly labels', () => {
  assert.equal(labelText('healthy'), 'Healthy')
  assert.equal(labelText('early_blight'), 'Early Blight')
  assert.equal(labelText('late_blight'), 'Late Blight')
})

test('unknown class falls back to de-underscored title case (never a raw token)', () => {
  assert.equal(labelText('some_new_class'), 'Some New Class')
})
