/**
 * ONNX Runtime session management + inference for the potato classifier.
 *
 * onnxruntime-node is imported through a VARIABLE specifier so `tsc --noEmit` does not fail with
 * TS2307 in an environment where the native package isn't installed; it resolves at runtime on the
 * host after `npm install`. The session is created lazily and cached across requests.
 *
 * HONESTY: this module never invents outputs. If the model file is absent, isModelAvailable() is
 * false and the route returns status "model_unavailable" — it does not call runInference().
 */
import { onnxPath, fileExists } from './metadata'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ort = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Session = any

let ortPromise: Promise<Ort> | null = null
let sessionPromise: Promise<Session> | null = null

function ort(): Promise<Ort> {
  if (!ortPromise) {
    const modName = 'onnxruntime-node'
    ortPromise = import(modName)
  }
  return ortPromise
}

export async function isModelAvailable(): Promise<boolean> {
  return fileExists(onnxPath())
}

function getSession(): Promise<Session> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const rt = await ort()
      return rt.InferenceSession.create(onnxPath())
    })()
  }
  return sessionPromise
}

/** Runs the model on an NCHW float32 input and returns the raw logits as a plain number[]. */
export async function runInference(input: Float32Array, dims: number[]): Promise<number[]> {
  const rt = await ort()
  const session = await getSession()
  const tensor = new rt.Tensor('float32', input, dims)
  const inputName: string = session.inputNames[0]
  const outputName: string = session.outputNames[0]
  const output = await session.run({ [inputName]: tensor })
  const data = output[outputName].data as ArrayLike<number>
  return Array.from(data)
}

/** Test/hot-reload helper — drops the cached session so a freshly-deployed model is picked up. */
export function _resetSessionCache(): void {
  sessionPromise = null
}
