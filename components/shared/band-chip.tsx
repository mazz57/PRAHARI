'use client'

import { bandToSemantic } from '@/lib/disease-risk/band'

/**
 * The one canonical way to render a risk band as a coloured pill. Colour and glyph come from
 * bandToSemantic (which reads the --risk-* CSS vars), so bands look identical everywhere and a
 * colour is never hardcoded per-component.
 */
export function BandChip({
  band,
  label,
  className = '',
}: {
  band: string
  label: string
  className?: string
}) {
  const s = bandToSemantic(band)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{ backgroundColor: s.color, color: s.onColor }}
    >
      <span aria-hidden>{s.icon}</span>
      {label}
    </span>
  )
}
