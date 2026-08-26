/**
 * Band → semantic UI mapping. The single source of truth for how a risk band looks and sorts,
 * so a colour or icon is never hardcoded ad-hoc in a component. Ported from Prahari
 * web/src/lib/bandToSemantic.ts.
 *
 * Colours reference CSS custom properties (defined in styles/globals.css) rather than literals,
 * so light/dark theming stays centralised.
 */
export type Band = 'safe' | 'watch' | 'act'
export type BandOrUnknown = Band | 'unknown'

export interface BandSemantic {
  /** Stable key. */
  band: BandOrUnknown
  /** CSS var for the band's fill colour. */
  color: string
  /** CSS var for readable text on top of `color`. */
  onColor: string
  /** Short glyph used where an icon component is overkill. */
  icon: string
  /** Sort rank — worst first (act = 0). */
  rank: number
}

export const BAND: Record<BandOrUnknown, BandSemantic> = {
  act: { band: 'act', color: 'var(--risk-act)', onColor: 'var(--on-risk-act)', icon: '❗', rank: 0 },
  watch: { band: 'watch', color: 'var(--risk-watch)', onColor: 'var(--on-risk-watch)', icon: '⚠', rank: 1 },
  safe: { band: 'safe', color: 'var(--risk-safe)', onColor: 'var(--on-risk-safe)', icon: '✓', rank: 2 },
  unknown: { band: 'unknown', color: 'var(--muted)', onColor: 'var(--muted-foreground)', icon: '?', rank: 3 },
}

export function bandToSemantic(band: string): BandSemantic {
  return BAND[(band as BandOrUnknown)] ?? BAND.unknown
}

/** Sort any items carrying a `band` (and optional `risk`, `dsvAccum`) worst-first, stably. */
export function sortWorstFirst<T extends { band: string; risk?: number; dsvAccum?: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = BAND[(a.band as BandOrUnknown)]?.rank ?? 3
    const rb = BAND[(b.band as BandOrUnknown)]?.rank ?? 3
    if (ra !== rb) return ra - rb
    if ((b.risk ?? 0) !== (a.risk ?? 0)) return (b.risk ?? 0) - (a.risk ?? 0)
    return (b.dsvAccum ?? 0) - (a.dsvAccum ?? 0)
  })
}
