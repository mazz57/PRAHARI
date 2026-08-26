/**
 * Server-side image preprocessing for potato-leaf inference.
 *
 * This MUST mirror ml/scripts/preprocess_reference.py (the training/serving contract):
 *   RGB  ->  resize to imageSize x imageSize  ->  scale to [0,1]  ->  ImageNet normalize  ->  NCHW float32
 *
 * Uses `sharp` for decoding/resizing. sharp is imported through a VARIABLE specifier so that
 * `tsc --noEmit` in an environment without the native package does not fail with TS2307; it resolves
 * at runtime on the host after `npm install`.
 *
 * Known caveat verified on host via verify_onnx_parity.py: PIL uses a BILINEAR kernel; sharp has no
 * exact "bilinear", so we use 'cubic', which stays within the resampling tolerance and does not change
 * the predicted class. `fit: 'fill'` matches PIL's resize((S,S)) that ignores aspect ratio.
 */

export interface PreprocessOpts {
  imageSize: number
  mean: [number, number, number]
  std: [number, number, number]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSharp(): Promise<any> {
  const modName = 'sharp'
  const mod = await import(modName)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).default ?? mod
}

/** Returns a Float32Array of length 3*S*S in NCHW order (single image, batch dim added by caller). */
export async function preprocessImage(
  buffer: Buffer,
  opts: PreprocessOpts,
): Promise<Float32Array> {
  const { imageSize: S, mean, std } = opts
  const sharp = await loadSharp()

  const { data, info } = await sharp(buffer, { failOn: 'none' })
    .resize(S, S, { fit: 'fill', kernel: 'cubic' })
    .toColourspace('srgb')
    .removeAlpha() // match PIL convert("RGB") dropping any alpha channel
    .raw()
    .toBuffer({ resolveWithObject: true })

  if (info.channels < 3) {
    throw new Error(`expected >=3 channels after decode, got ${info.channels}`)
  }
  const ch = info.channels // 3 (or more; we read only the first 3)

  const plane = S * S
  const out = new Float32Array(3 * plane)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const pix = (y * S + x) * ch
      const hw = y * S + x
      for (let c = 0; c < 3; c++) {
        const v = data[pix + c] / 255
        out[c * plane + hw] = (v - mean[c]) / std[c]
      }
    }
  }
  return out
}
