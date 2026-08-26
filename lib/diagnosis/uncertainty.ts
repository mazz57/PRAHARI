/**
 * Turns raw model probabilities into an honest DiagnosisResult.
 *
 * Uncertainty rule (two parts — a prediction must clear BOTH to be reported as confident):
 *   1) top-1 probability >= confidenceThreshold
 *   2) margin (top-1 minus top-2 probability) >= marginThreshold
 * Otherwise the status is "uncertain": we still show the ranked guesses, but we refuse to assert a
 * single disease. Thresholds come from thresholds.json (calibrated by evaluate.py on the validation
 * set) or the documented defaults in config.py until calibration has run.
 */
import { ClassProb, DiagnosisResult, MODEL_NAME, MODEL_VERSION } from './types'
import type { Thresholds } from './metadata'
import { labelText } from './labels'

function round(n: number): number {
  return Math.round(n * 10000) / 10000
}

export function buildResult(
  probs: number[],
  classes: string[],
  thresholds: Thresholds,
): DiagnosisResult {
  const ranked: ClassProb[] = classes
    .map((c, i) => ({ class: c, confidence: probs[i] ?? 0 }))
    .sort((a, b) => b.confidence - a.confidence)

  const top1 = ranked[0]
  const top2 = ranked[1]
  const margin = top1.confidence - (top2?.confidence ?? 0)

  const confident =
    top1.confidence >= thresholds.confidenceThreshold && margin >= thresholds.marginThreshold

  const prediction: ClassProb = { class: top1.class, confidence: round(top1.confidence) }
  const alternatives: ClassProb[] = ranked
    .slice(1)
    .map((p) => ({ class: p.class, confidence: round(p.confidence) }))

  const model = {
    name: MODEL_NAME,
    version: MODEL_VERSION,
    calibrated: thresholds.calibrated,
  }

  if (confident) {
    return { status: 'ok', crop: 'potato', prediction, alternatives, model }
  }

  return {
    status: 'uncertain',
    crop: 'potato',
    prediction,
    alternatives,
    message:
      `The image check isn't confident enough to name a single condition ` +
      `(top guess "${labelText(top1.class)}" at ${Math.round(top1.confidence * 100)}%, only ` +
      `${Math.round(margin * 100)}% ahead of the next). Inspect the crop closely or seek expert confirmation.`,
    model,
  }
}
