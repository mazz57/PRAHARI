/**
 * lib/crop-diagnosis.ts
 *
 * Reusable inference module for the PlantVillage MobileNetV3 ONNX model.
 * This is the single implementation of the full inference pipeline; both the
 * API route and the test script import from here — there is no second copy.
 *
 * Preprocessing exactly mirrors ml/scripts/test_pretrained_model.py:
 *   RGB → resize shortest-side to 256 (BILINEAR / lanczos2) → center-crop 224×224
 *       → divide by 255 → ImageNet normalise → NCHW float32
 *
 * Model path: ml/models/plantvillage_mobilenet/model.onnx
 * Class file: ml/models/plantvillage_mobilenet/class_names.json  (15 classes)
 *
 * Only three potato classes are mapped to a final condition; any other
 * top-1 prediction yields crop="unknown", condition="uncertain".
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

// ─── Constants ────────────────────────────────────────────────────────────────

/** ImageNet mean/std — must match training transform used by the ONNX export. */
export const IMAGENET_MEAN = [0.485, 0.456, 0.406] as const
export const IMAGENET_STD  = [0.229, 0.224, 0.225] as const

/**
 * Minimum softmax probability to report without requiring review.
 * Below this threshold requires_review=true is set in the response.
 */
export const CONFIDENCE_THRESHOLD = 0.60

/** Mapping from PlantVillage raw class names to output condition strings. */
export const POTATO_CLASS_MAP: Readonly<Record<string, string>> = {
  'Potato___healthy':      'healthy',
  'Potato___Early_blight': 'early_blight',
  'Potato___Late_blight':  'late_blight',
}

// ─── Public response type ─────────────────────────────────────────────────────

export interface TopPrediction {
  class: string
  confidence: number
}

export interface DiagnosisResult {
  crop: 'potato' | 'unknown'
  condition: 'healthy' | 'early_blight' | 'late_blight' | 'uncertain'
  confidence: number
  requires_review: boolean
  top_predictions: TopPrediction[]
}

// ─── Paths ────────────────────────────────────────────────────────────────────

function modelDir(): string {
  return path.join(process.cwd(), 'ml', 'models', 'plantvillage_mobilenet')
}

export function onnxModelPath(): string {
  return path.join(modelDir(), 'model.onnx')
}

export function classNamesFilePath(): string {
  return path.join(modelDir(), 'class_names.json')
}

// ─── ONNX session cache ───────────────────────────────────────────────────────
//
// The session is created lazily the first time diagnoseCrop() is called and
// then reused across all subsequent calls within the same process lifetime.
// Caching here avoids the ~200 ms warm-up cost on every request.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sessionPromise: Promise<any> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _classNamesPromise: Promise<string[]> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOnnxSession(): Promise<any> {
  if (!_sessionPromise) {
    _sessionPromise = (async () => {
      const modName = 'onnxruntime-node'
      const ort = await import(modName)
      return ort.InferenceSession.create(onnxModelPath(), {
        executionProviders: ['cpu'],
      })
    })().catch((err) => {
      _sessionPromise = null  // allow retry on next request
      throw err
    })
  }
  return _sessionPromise
}

function getClassNames(): Promise<string[]> {
  if (!_classNamesPromise) {
    _classNamesPromise = fs
      .readFile(classNamesFilePath(), 'utf8')
      .then((raw) => JSON.parse(raw) as string[])
      .catch((err) => {
        _classNamesPromise = null
        throw err
      })
  }
  return _classNamesPromise
}

/** Drop cached session and class-names (useful in tests / hot-reload). */
export function resetCaches(): void {
  _sessionPromise = null
  _classNamesPromise = null
}

// ─── Preprocessing ────────────────────────────────────────────────────────────
//
// Mirrors test_pretrained_model.py:
//   image = Image.open(path).convert("RGB")
//   scale  = 256 / min(w, h)
//   new_w, new_h = round(w*scale), round(h*scale)
//   image  = image.resize((new_w, new_h), Image.BILINEAR)
//   left   = (new_w - 224) // 2
//   top    = (new_h - 224) // 2
//   image  = image.crop((left, top, left+224, top+224))
//   array  = np.array(image, float32) / 255.0
//   array  = (array - MEAN) / STD        # per-channel
//   tensor = np.expand_dims(array.T[CHW], 0)   # NCHW

async function preprocessImage(buffer: Buffer): Promise<Float32Array> {
  const modName = 'sharp'
  const sharpMod = await import(modName)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharp = (sharpMod as any).default ?? sharpMod

  // Retrieve original dimensions without decoding the full image.
  const meta = await sharp(buffer).metadata()
  const origW = meta.width as number
  const origH = meta.height as number

  // Resize: shortest side → 256, preserving aspect ratio.
  const scale = 256 / Math.min(origW, origH)
  const newW  = Math.round(origW * scale)
  const newH  = Math.round(origH * scale)

  // Center crop: (newW-224)/2, (newH-224)/2
  const left = Math.floor((newW - 224) / 2)
  const top  = Math.floor((newH - 224) / 2)

  const { data, info } = await sharp(buffer)
    // lanczos2 is the closest sharp analogue to PIL BILINEAR at this scale
    .resize(newW, newH, { fit: 'fill', kernel: 'lanczos2' })
    .extract({ left, top, width: 224, height: 224 })
    .toColourspace('srgb')
    .removeAlpha()           // match PIL .convert("RGB")
    .raw()
    .toBuffer({ resolveWithObject: true })

  const ch    = info.channels  // 3 after removeAlpha
  const S     = 224
  const plane = S * S
  const out   = new Float32Array(3 * plane)

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const pix = (y * S + x) * ch
      const hw  = y * S + x
      for (let c = 0; c < 3; c++) {
        const v = (data as Buffer)[pix + c] / 255.0
        out[c * plane + hw] = (v - IMAGENET_MEAN[c]) / IMAGENET_STD[c]
      }
    }
  }
  return out
}

// ─── Softmax ──────────────────────────────────────────────────────────────────

function softmax(logits: number[]): number[] {
  const max  = Math.max(...logits)
  const exps = logits.map((x) => Math.exp(x - max))
  const sum  = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

// ─── Core inference + mapping ─────────────────────────────────────────────────

function buildResult(probs: number[], classNames: string[]): DiagnosisResult {
  // Rank all 15 classes
  const ranked = classNames
    .map((name, i) => ({ class: name, confidence: probs[i] ?? 0 }))
    .sort((a, b) => b.confidence - a.confidence)

  const top  = ranked[0]
  const conf = top.confidence

  // Top-3 for the response, rounded to 4 decimal places
  const top3: TopPrediction[] = ranked.slice(0, 3).map((p) => ({
    class:      p.class,
    confidence: Math.round(p.confidence * 10000) / 10000,
  }))

  // Is the top prediction one of the three known potato classes?
  const condition = POTATO_CLASS_MAP[top.class]

  if (!condition) {
    // Non-potato top class → unknown
    return {
      crop:            'unknown',
      condition:       'uncertain',
      confidence:      Math.round(conf * 10000) / 10000,
      requires_review: true,
      top_predictions: top3,
    }
  }

  return {
    crop:            'potato',
    condition:       condition as DiagnosisResult['condition'],
    confidence:      Math.round(conf * 10000) / 10000,
    requires_review: conf < CONFIDENCE_THRESHOLD,
    top_predictions: top3,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * diagnoseCrop(imageBuffer)
 *
 * Accept raw image bytes (JPEG / PNG / WebP), run the PlantVillage MobileNetV3
 * ONNX model with CPU execution, apply the validated preprocessing and class
 * mapping, and return a structured DiagnosisResult.
 *
 * Throws on I/O or inference errors — callers should catch and map to HTTP
 * error responses themselves.
 */
export async function diagnoseCrop(imageBuffer: Buffer): Promise<DiagnosisResult> {
  // Load model and class names in parallel (cached after first call)
  const [session, classNames] = await Promise.all([
    getOnnxSession(),
    getClassNames(),
  ])

  const input = await preprocessImage(imageBuffer)

  // Dynamically import ort for Tensor construction (same specifier used for session)
  const modName = 'onnxruntime-node'
  const ort = await import(modName)

  const tensor     = new ort.Tensor('float32', input, [1, 3, 224, 224])
  const inputName  = session.inputNames[0] as string
  const outputName = session.outputNames[0] as string
  const output     = await session.run({ [inputName]: tensor })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logits     = Array.from(output[outputName].data as any) as number[]
  const probs      = softmax(logits)

  return buildResult(probs, classNames)
}

/**
 * isModelAvailable()
 *
 * Returns true only when both the ONNX model file and class_names.json are
 * present on disk. Used by the route to return 503 before attempting inference.
 */
export async function isModelAvailable(): Promise<boolean> {
  try {
    await Promise.all([
      fs.access(onnxModelPath()),
      fs.access(classNamesFilePath()),
    ])
    return true
  } catch {
    return false
  }
}
