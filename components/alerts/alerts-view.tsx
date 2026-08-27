'use client'

import { Bell, RefreshCw, AlertTriangle, Eye, Info, CloudSun, Beaker } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app-shell/page-header'
import { AlertCard, type AlertItem } from '@/components/alerts/alert-card'
import { EmptyState, ErrorState, LoadingState } from '@/components/app-shell/states'
import { useDiseaseRisk } from '@/lib/hooks/use-disease-risk'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'
import { resolveField, fieldDisplayName } from '@/lib/fields'
import type { FieldRiskResult } from '@/lib/disease-risk/api-types'
import type { Lang } from '@/lib/i18n/advisory-templates'

function fieldLabel(f: FieldRiskResult, lang: Lang): string {
  const meta = resolveField(f.fieldId)
  return meta ? fieldDisplayName(meta, lang) : f.fieldName
}

/**
 * Alerts — the same live engine output, re-framed as a prioritised action list. Severity is derived
 * honestly from each field's real band (act → Urgent, watch → Attention, humid-but-not-viable →
 * Watch), plus one low-priority Info card describing the data source. Nothing here is invented.
 */
export function AlertsView() {
  const { lang } = useLanguage()
  const { data, error, loading, reload, demo } = useDiseaseRisk()
  const t = APP_STRINGS[lang]

  const items: AlertItem[] = []
  if (data) {
    for (const f of data.fields) {
      const where = fieldLabel(f, lang)
      if (f.band === 'act') {
        items.push({
          id: f.fieldId,
          severity: 'urgent',
          colorVar: 'var(--risk-act)',
          sevLabel: t.sevUrgent,
          icon: AlertTriangle,
          title: f.advisory.what,
          where,
          why: f.advisory.why,
          what: f.advisory.action,
        })
      } else if (f.band === 'watch') {
        items.push({
          id: f.fieldId,
          severity: 'attention',
          colorVar: 'var(--risk-watch)',
          sevLabel: t.sevAttention,
          icon: Eye,
          title: f.advisory.what,
          where,
          why: f.advisory.why,
          what: f.advisory.action,
        })
      } else if (f.criterionMet) {
        // Safe band but the Hutton criterion was met (humid, yet outside the pathogen's viable
        // temperature). A real, low-level "worth knowing" signal — not a call to act.
        items.push({
          id: f.fieldId,
          severity: 'watch',
          colorVar: 'var(--primary)',
          sevLabel: t.sevWatch,
          icon: Eye,
          title: f.advisory.what,
          where,
          why: f.advisory.why,
          what: f.advisory.action,
        })
      }
    }

    // Lowest-priority context: where today's numbers came from.
    items.push({
      id: 'source',
      severity: 'info',
      colorVar: 'var(--muted-foreground)',
      sevLabel: t.sevInfo,
      icon: demo ? Beaker : CloudSun,
      title: demo ? t.homeSourceDemo : t.homeSourceLive,
      note: `${data.method.approach} · ${data.district.nameEn}, ${data.district.state}`,
    })
  }

  const order: Record<AlertItem['severity'], number> = { urgent: 0, attention: 1, watch: 2, info: 3 }
  const sorted = [...items].sort((a, b) => order[a.severity] - order[b.severity])
  const hasRealAlerts = items.some((i) => i.severity !== 'info')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<><Bell className="h-4 w-4" /> {t.nav.alerts}</>}
        title={t.alertsTitle}
        subtitle={t.alertsSub}
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

      {data && !hasRealAlerts && (
        <EmptyState
          title={t.alertsAllClearTitle}
          description={t.alertsAllClearBody}
          icon={<Info className="h-6 w-6" />}
        />
      )}

      {data && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((item) => (
            <AlertCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
