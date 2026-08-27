import { redirect } from 'next/navigation'

/**
 * Legacy route. The old "check-crop" tool is now the "Crop Health" area; this redirect keeps every
 * existing link, bookmark, and cross-reference working. The API route /api/crop-diagnosis is
 * unchanged — only the user-facing page moved.
 */
export default function CheckCropRedirect() {
  redirect('/crop-health')
}
