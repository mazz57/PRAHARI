'use client'

import { useLanguage } from '@/components/providers/language-provider'
import type { Lang } from '@/lib/i18n/advisory-templates'

const SHORT: Record<Lang, string> = { en: 'EN', hi: 'हिं', kn: 'ಕನ್ನ' }
const FULL: Record<Lang, string> = { en: 'English', hi: 'हिंदी', kn: 'ಕನ್ನಡ' }
const ORDER: Lang[] = ['en', 'hi', 'kn']

/**
 * Global language selector. Drives the app-wide LanguageProvider, which every /api/... request
 * reads as ?lang=. `full` shows the language's own name (for Settings); otherwise a compact code.
 */
export function LanguageMenu({ full = false, className = '' }: { full?: boolean; className?: string }) {
  const { lang, setLang } = useLanguage()
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex overflow-hidden rounded-lg border border-border ${className}`}
    >
      {ORDER.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1.5 text-sm font-medium transition-colors ${
            lang === l
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-foreground hover:bg-muted'
          }`}
        >
          {full ? FULL[l] : SHORT[l]}
        </button>
      ))}
    </div>
  )
}
