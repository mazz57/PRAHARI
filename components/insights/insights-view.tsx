'use client'

import { BarChart3, RefreshCw, Droplets, Thermometer, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app-shell/page-header'
import { BandChip } from '@/components/shared/band-chip'
import { ErrorState, LoadingState, EmptyState } from '@/components/app-shell/states'
import { useDiseaseRisk } from '@/lib/hooks/use-disease-risk'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'
import { sortWorstFirst, bandToSemantic } from '@/lib/disease-risk/band'
import { resolveField, fieldDisplayName } from '@/lib/fields'
import type { FieldRiskResult } from '@/lib/disease-risk/api-types'
import type { Lang } from '@/lib/i18n/advisory-templates'

function fieldLabel(f: FieldRiskResult, lang: Lang): string {
  const meta = resolveField(f.fieldId)
  return meta ? fieldDisplayName(meta, lang) : f.fieldName
}

/**
 * Insights — an analytical read on the fields, built ONLY from real top-level engine numbers
 * (band, dsvAccum vs the spray threshold, leaf-wet hours, coldest hour, consecutive risky days).
 * No invented history, no synthetic trends: if the engine didn't produce it, it isn't shown.
 */
export function InsightsView() {
  const { lang } = useLanguage()
  const { data, error, loading, reload } = useDiseaseRisk()
  const t = APP_STRINGS[lang]

  const fields = data ? sortWorstFirst(data.fields) : []
  const counts = {
    safe: fields.filter((f) => f.band === 'safe').length,
    watch: fields.filter((f) => f.band === 'watch').length,
    act: fields.filter((f) => f.band === 'act').length,
  }
  const total = fields.length || 1

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<><BarChart3 className="h-4 w-4" /> {t.nav.insights}</>}
        title={t.insightsTitle}
        subtitle={t.insightsSub}
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

      {data && fields.length === 0 && <EmptyState title={t.insightsTitle} description={t.insWindow} />}

      {data && fields.length > 0 && (
        <div className="space-y-6">
          {/* Status distribution — one honest stacked bar across the three real bands. */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">{t.insStatusDist}</h3>
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {(['act', 'watch', 'safe'] as const).map((b) =>
                counts[b] > 0 ? (
                  <div
                    key={b}
                    style={{ width: `${(counts[b] / total) * 100}%`, backgroundColor: bandToSemantic(b).color }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {(
                [
                  { b: 'act', label: t.insAct, n: counts.act },
                  { b: 'watch', label: t.insWatch, n: counts.watch },
                  { b: 'safe', label: t.insSafe, n: counts.safe },
                ] as const
              ).map((row) => (
                <span key={row.b} className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bandToSemantic(row.b).color }} />
                  {row.label}: <span className="font-semibold text-foreground">{row.n}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Per-field detail — real numbers only. */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.insPerField}</h3>
            <div className="grid gap-4">
              {fields.map((f) => {
                const threshold = f.severity.sprayThresholdDsv || 1
                const dsvPct = Math.min(100, (f.dsvAccum / threshold) * 100)
                return (
                  <div key={f.fieldId} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">{fieldLabel(f, lang)}</span>
                      <BandChip band={f.band} label={f.advisory.bandLabel} />
                    </div>

                    {/* DSV toward spray threshold */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t.insDsvProgress}</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {f.dsvAccum.toFixed(1)} / {f.severity.sprayThresholdDsv}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${dsvPct}%`, backgroundColor: bandToSemantic(f.band).color }}
                        />
                      </div>
                    </div>

                    {/* Real supporting metrics */}
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-muted/40 p-3">
                        <Droplets className="mx-auto h-4 w-4 text-muted-foreground" />
                        <div className="mt-1 text-lg font-bold tabular-nums text-foreground">{f.wetHours}</div>
                        <div className="text-[11px] leading-tight text-muted-foreground">{t.insWetHours}</div>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3">
                        <Thermometer className="mx-auto h-4 w-4 text-muted-foreground" />
                        <div className="mt-1 text-lg font-bold tabular-nums text-foreground">{f.minTempC.toFixed(1)}°</div>
                        <div className="text-[11px] leading-tight text-muted-foreground">{t.insColdest}</div>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3">
                        <CalendarClock className="mx-auto h-4 w-4 text-muted-foreground" />
                        <div className="mt-1 text-lg font-bold tabular-nums text-foreground">{f.consecutiveQualifyingDays}</div>
                        <div className="text-[11px] leading-tight text-muted-foreground">{t.insRiskyDays}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">{t.insWindow}</p>
          </section>
        </div>
      )}
    </div>
  )
}
