/**
 * POST /api/crop-diagnosis
 *
 * Thin HTTP wrapper around lib/crop-diagnosis.ts.
 * All inference logic lives in diagnoseCrop() — this file handles only:
 *   • multipart parsing
 *   • file validation (type, size, presence)
 *   • model availability guard
 *   • error → HTTP status mapping
 *
 * GET /api/crop-diagnosis — availability probe { available: boolean }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { diagnoseCrop, isModelAvailable } from '@/lib/crop-diagnosis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BYTES      = 8 * 1024 * 1024  // 8 MB
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function err(status: number, error: string, details?: string) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status })
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  const available = await isModelAvailable()
  return NextResponse.json({ available })
}

export async function POST(req: NextRequest) {
  // 1. Parse multipart form
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return err(400, 'invalid_input', 'Expected multipart/form-data with an "image" field.')
  }

  // 2. Validate "image" field presence
  const file = form.get('image')
  if (!(file instanceof File)) {
    return err(400, 'invalid_input', 'No "image" field found in the form data.')
  }

  // 3. Validate file type
  if (!ACCEPTED_TYPES.has(file.type)) {
    return err(
      400,
      'unsupported_file_type',
      `File type "${file.type || 'unknown'}" is not supported. Upload a JPEG, PNG, or WebP image.`,
    )
  }

  // 4. Validate file size
  if (file.size === 0) {
    return err(400, 'invalid_input', 'The uploaded image is empty.')
  }
  if (file.size > MAX_BYTES) {
    return err(
      400,
      'file_too_large',
      `Image size ${(file.size / 1e6).toFixed(1)} MB exceeds the ${MAX_BYTES / 1e6} MB limit.`,
    )
  }

  // 5. Model availability guard — honest refusal, never a fabricated prediction
  if (!(await isModelAvailable())) {
    return err(503, 'model_unavailable', 'The PlantVillage ONNX model is not present on this server.')
  }

  // 6. Delegate all inference to the shared module
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await diagnoseCrop(buffer)
    return NextResponse.json(result, { status: 200 })
  } catch (e) {
    console.error('[crop-diagnosis] inference error:', e instanceof Error ? e.message : e)
    return err(
      500,
      'inference_failed',
      'Failed to analyse the image. Please try again with a clear photo of a potato leaf.',
    )
  }
}
