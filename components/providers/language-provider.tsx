'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Lang } from '@/lib/i18n/advisory-templates'

/**
 * Global language state for the whole app. Replaces the old per-component mock switcher so the
 * choice is consistent everywhere and flows into every /api/... call as ?lang=. Persisted to
 * localStorage; the backend contract (en|hi|kn) is unchanged.
 */
const STORAGE_KEY = 'pravaah.lang'
const isLang = (v: unknown): v is Lang => v === 'en' || v === 'hi' || v === 'kn'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({ lang: 'en', setLang: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (isLang(saved)) setLangState(saved)
    } catch {
      /* localStorage unavailable — stay on default */
    }
  }, [])

  useEffect(() => {
    try {
      document.documentElement.lang = lang
    } catch {
      /* no document (SSR) */
    }
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
