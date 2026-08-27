'use client'

import Link from 'next/link'
import {
  Camera,
  CloudSun,
  Store,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Beaker,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app-shell/page-header'
import { BandChip } from '@/components/shared/band-chip'
import { ErrorState, LoadingState } from '@/components/app-shell/states'
import { useDiseaseRisk } from '@/lib/hooks/use-disease-risk'
import { useLanguage } from '@/components/providers/language-provider'
import { useDemoMode } from '@/components/providers/demo-mode-provider'
import { APP_STRINGS, fmt } from '@/lib/i18n/app-strings'
import { sortWorstFirst } from '@/lib/disease-risk/band'
import { resolveField, fieldDisplayName } from '@/lib/fields'
import { formatTime } from '@/lib/i18n/format'
import type { Lang } from '@/lib/i18n/advisory-templates'
import type { FieldRiskResult } from '@/lib/disease-risk/api-types'

function fieldLabel(f: FieldRiskResult, lang: Lang): string {
  const meta = resolveField(f.fieldId)
  return meta ? fieldDisplayName(meta, lang) : f.fieldName
}

/**
 * Home = the command centre: "what's happening on my farm today". It opens with ONE clear headline
 * (all-clear / keep an eye / action needed), then the fields worst-first, then quick actions — a
 * deliberate hierarchy, not six identical tiles. Every number is live from /api/disease-risk.
 */
export function FarmOverview() {
  const { lang } = useLanguage()
  const { setDemo } = useDemoMode()
  const { data, error, loading, reload, demo } = useDiseaseRisk()
  const t = APP_STRINGS[lang]

  const fields = data ? sortWorstFirst(data.fields) : []
  const act = fields.filter((f) => f.band === 'act')
  const watch = fields.filter((f) => f.band === 'watch')

  const names = (list: FieldRiskResult[]) => list.map((f) => fieldLabel(f, lang)).join(', ')

  let banner: { tone: 'act' | 'watch' | 'safe'; title: string; body: string }
  if (act.length) banner = { tone: 'act', title: fmt(t.homeActTitle, { n: names(act) }), body: t.homeActBody }
  else if (watch.length)
    banner = { tone: 'watch', title: fmt(t.homeWatchTitle, { n: names(watch) }), body: t.homeWatchBody }
  else banner = { tone: 'safe', title: t.homeAllClearTitle, body: t.homeAllClearBody }

  const toneVar =
    banner.tone === 'act' ? 'var(--risk-act)' : banner.tone === 'watch' ? 'var(--risk-watch)' : 'var(--risk-safe)'
  const ToneIcon = banner.tone === 'act' ? AlertTriangle : banner.tone === 'watch' ? Eye : CheckCircle2

  const quickActions = [
    { href: '/crop-health', icon: Camera, title: t.homeQCheck, sub: t.homeQCheckSub },
    { href: '/field-risk', icon: CloudSun, title: t.homeQForecast, sub: t.homeQForecastSub },
    { href: '/mandi', icon: Store, title: t.homeQMandi, sub: t.homeQMandiSub },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.homeHello}
        subtitle={t.homeSub}
        actions={
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t.retry}
          </Button>
        }
      />

      {loading && !data && !error && <LoadingState label={t.loading} />}

      {error && (
        <ErrorState
          title={t.homeNoWeatherTitle}
          description={t.homeNoWeatherBody}
          hint={error.hint ?? error.message}
          retryLabel={t.retry}
          onRetry={reload}
        />
      )}

      {data && (
        <>
          {/* The one headline that answers "do I need to act today?" */}
          <section
            className="pv-animate-in rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: toneVar, backgroundColor: `color-mix(in oklch, ${toneVar} 12%, var(--background))` }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: toneVar, color: 'var(--background)' }}
              >
                <ToneIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">{banner.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">{banner.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {t.homeUpdated} {formatTime(data.generatedAt, lang)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {demo ? <Beaker className="h-3.5 w-3.5" /> : <CloudSun className="h-3.5 w-3.5" />}
                    {demo ? t.homeSourceDemo : t.homeSourceLive}
                  </span>
                  <span>· {data.district.nameEn}, {data.district.state}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Fields worst-first — a compact status row each, linking to the forecast detail. */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t.homeFieldsTitle}
              </h3>
              <Link href="/fields" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                {t.homeViewAllFields}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3">
              {fields.map((f) => (
                <Link
                  key={f.fieldId}
                  href="/field-risk"
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{fieldLabel(f, lang)}</span>
                      <BandChip band={f.band} label={f.advisory.bandLabel} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.advisory.what}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>

          {/* Quick actions — the three things a farmer opens the app to do. */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t.homeQuickTitle}
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {quickActions.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-foreground">{a.title}</span>
                    <span className="mt-0.5 text-sm text-muted-foreground">{a.sub}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
