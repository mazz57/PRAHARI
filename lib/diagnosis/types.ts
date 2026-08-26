/**
 * Shared types for the potato-leaf image-diagnosis feature.
 *
 * HONESTY: these types describe the output of a REAL ONNX model. Until the trained model is present
 * on disk, the API returns { status: "model_unavailable" } and NEVER a fabricated prediction.
 */

export type PotatoClass = 'healthy' | 'early_blight' | 'late_blight'

export type DiagnosisStatus =
  | 'ok' // confident prediction
  | 'uncertain' // model ran, but confidence/margin below the calibrated thresholds
  | 'model_unavailable' // no trained ONNX on disk yet — we refuse to guess
  | 'invalid_input' // bad/oversized/missing file
  | 'error' // unexpected server error

export interface ClassProb {
  class: string
  confidence: number // 0..1, rounded for transport
}

export interface DiagnosisResult {
  status: DiagnosisStatus
  crop: 'potato'
  /** Present when status is 'ok' or 'uncertain'. */
  prediction?: ClassProb
  /** Remaining classes, sorted high→low. Present when the model ran. */
  alternatives?: ClassProb[]
  /** Human-readable, honest note (e.g. why it's uncertain / unavailable). */
  message?: string
  model: {
    name: string
    version: string
    /** true only when thresholds.json was calibrated by evaluate.py. */
    calibrated: boolean
  }
}

export const MODEL_NAME = 'PRAHARI Potato Disease Classifier'
export const MODEL_VERSION = '1.0'
