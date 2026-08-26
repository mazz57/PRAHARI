/**
 * Reads the model metadata the server needs at runtime, from the files the Python pipeline writes:
 *   ml/models/class_names.json  — canonical class ORDER + input size + normalization (tracked in Git)
 *   ml/models/thresholds.json   — uncertainty thresholds (defaults until evaluate.py calibrates them)
 *   ml/models/potato_disease.onnx — the trained model (git-ignored; produced by export_onnx.py)
 *
 * Class order is read from disk — we NEVER rely on object/key ordering to map a logit to a class.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface ModelMetadata {
  classes: string[]
  imageSize: number
  mean: [number, number, number]
  std: [number, number, number]
}

export interface Thresholds {
  confidenceThreshold: number
  marginThreshold: number
  calibrated: boolean
}

// Documented defaults — mirror ml/config.py. Used only until evaluate.py writes calibrated values.
const DEFAULT_THRESHOLDS: Thresholds = {
  confidenceThreshold: 0.6,
  marginThreshold: 0.15,
  calibrated: false,
}

export function modelsDir(): string {
  return process.env.PRAHARI_MODELS_DIR
    ? path.resolve(process.env.PRAHARI_MODELS_DIR)
    : path.join(process.cwd(), 'ml', 'models')
}

export function onnxPath(): string {
  return path.join(modelsDir(), 'potato_disease.onnx')
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function readModelMetadata(): Promise<ModelMetadata> {
  const raw = await fs.readFile(path.join(modelsDir(), 'class_names.json'), 'utf8')
  const data = JSON.parse(raw)
  if (!Array.isArray(data.classes) || data.classes.length === 0) {
    throw new Error('class_names.json is malformed: missing "classes" array')
  }
  return {
    classes: data.classes as string[],
    imageSize: typeof data.image_size === 'number' ? data.image_size : 224,
    mean: (data.normalize?.mean ?? [0.485, 0.456, 0.406]) as [number, number, number],
    std: (data.normalize?.std ?? [0.229, 0.224, 0.225]) as [number, number, number],
  }
}

export async function readThresholds(): Promise<Thresholds> {
  try {
    const raw = await fs.readFile(path.join(modelsDir(), 'thresholds.json'), 'utf8')
    const data = JSON.parse(raw)
    return {
      confidenceThreshold:
        typeof data.confidence_threshold === 'number'
          ? data.confidence_threshold
          : DEFAULT_THRESHOLDS.confidenceThreshold,
      marginThreshold:
        typeof data.margin_threshold === 'number'
          ? data.margin_threshold
          : DEFAULT_THRESHOLDS.marginThreshold,
      calibrated: Boolean(data.calibrated),
    }
  } catch {
    return DEFAULT_THRESHOLDS
  }
}
