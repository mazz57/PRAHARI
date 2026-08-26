import { bandToSemantic } from '@/lib/disease-risk/band'

/** A coloured pill for a risk band. Colour/icon come from the single bandToSemantic source. */
export function RiskBandBadge({ band, label, size = 'md' }: { band: string; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = bandToSemantic(band)
  const pad = size === 'lg' ? 'px-4 py-1.5 text-base' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{ backgroundColor: s.color, color: s.onColor }}
    >
      <span aria-hidden>{s.icon}</span>
      {label}
    </span>
  )
}
