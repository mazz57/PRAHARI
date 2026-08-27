import type { Lang } from '@/lib/i18n/advisory-templates'

/** BCP-47 locale for each supported language, for Intl date/number formatting. */
export function localeFor(lang: Lang): string {
  if (lang === 'hi') return 'hi-IN'
  if (lang === 'kn') return 'kn-IN'
  return 'en-IN'
}

/** Format an ISO date (yyyy-mm-dd or full ISO) as a short, localized day. Returns '' on bad input. */
export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Format an ISO timestamp as a short localized time. Returns '' on bad input. */
export function formatTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(localeFor(lang), { hour: 'numeric', minute: '2-digit' })
}
