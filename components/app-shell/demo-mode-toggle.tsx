'use client'

import { Beaker } from 'lucide-react'
import { useDemoMode, type Scenario } from '@/components/providers/demo-mode-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'

const SCENARIOS: Scenario[] = ['blight_outbreak', 'borderline_watch', 'dry_spell']

/**
 * Secondary control for Demo / Test mode. A plain, labelled switch — never disguised as a data
 * toggle. When on (and showScenario), lets the user pick which saved weather scenario to view.
 */
export function DemoModeToggle({ showScenario = false }: { showScenario?: boolean }) {
  const { demo, toggleDemo, scenario, setScenario } = useDemoMode()
  const { lang } = useLanguage()
  const t = APP_STRINGS[lang]

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggleDemo}
        aria-pressed={demo}
        className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        style={
          demo
            ? { borderColor: 'var(--risk-watch)', backgroundColor: 'color-mix(in oklch, var(--risk-watch) 14%, transparent)' }
            : undefined
        }
      >
        <span className="inline-flex items-center gap-2">
          <Beaker className="h-4 w-4" />
          {t.demoTest}
        </span>
        <span
          className="inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors"
          style={{ backgroundColor: demo ? 'var(--risk-watch)' : 'var(--muted-foreground)' }}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white transition-transform ${demo ? 'translate-x-4' : ''}`}
          />
        </span>
      </button>

      {demo && showScenario && (
        <div className="inline-flex w-full flex-wrap gap-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScenario(s)}
              aria-pressed={scenario === s}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                scenario === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {t.scenarioLabels[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
