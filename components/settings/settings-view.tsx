'use client'

import { Settings as SettingsIcon, Languages, Beaker, Info, Database } from 'lucide-react'
import { PageHeader } from '@/components/app-shell/page-header'
import { LanguageMenu } from '@/components/app-shell/language-menu'
import { DemoModeToggle } from '@/components/app-shell/demo-mode-toggle'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'

/**
 * Settings — the secondary controls kept out of the primary flow: language, Demo/Test mode, and an
 * honest note about where every number in the app comes from.
 */
export function SettingsView() {
  const { lang } = useLanguage()
  const t = APP_STRINGS[lang]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<><SettingsIcon className="h-4 w-4" /> {t.nav.settings}</>}
        title={t.settingsTitle}
        subtitle={t.settingsSub}
      />

      <div className="space-y-4">
        {/* Language */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Languages className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{t.setLanguage}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.setLanguageBody}</p>
              <div className="mt-3">
                <LanguageMenu full />
              </div>
            </div>
          </div>
        </section>

        {/* Demo / Test mode */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Beaker className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{t.setDemo}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.setDemoBody}</p>
              <div className="mt-3 max-w-xs">
                <DemoModeToggle showScenario />
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{t.setAbout}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.setAboutBody}</p>
            </div>
          </div>
        </section>

        {/* Data sources */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{t.setDataSources}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.setDataSourcesBody}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
