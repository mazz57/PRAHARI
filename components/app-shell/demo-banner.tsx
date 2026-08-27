'use client'

import { Beaker } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDemoMode } from '@/components/providers/demo-mode-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'

/**
 * Persistent, unmissable banner shown whenever Demo / Test mode is active. This is the guardrail
 * that keeps a saved scenario from ever being mistaken for live field conditions.
 */
export function DemoBanner() {
  const { demo, setDemo, scenario } = useDemoMode()
  const { lang } = useLanguage()
  const t = APP_STRINGS[lang]

  if (!demo) return null

  return (
    <div className="border-b" style={{ borderColor: 'var(--risk-watch)', backgroundColor: 'color-mix(in oklch, var(--risk-watch) 12%, var(--background))' }}>
      <div className="mx-auto flex w-full max-w-6xl items-start gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Beaker className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--risk-watch)' }} />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-foreground">{t.demoTitle}</span>{' '}
          <span className="text-muted-foreground">· {t.scenarioLabels[scenario]}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.demoBody}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setDemo(false)} className="shrink-0">
          {t.goLive}
        </Button>
      </div>
    </div>
  )
}
