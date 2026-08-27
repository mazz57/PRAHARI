'use client'

import { Sprout, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app-shell/page-header'
import { FieldCard } from '@/components/fields/field-card'
import { ErrorState, LoadingState, EmptyState } from '@/components/app-shell/states'
import { useDiseaseRisk } from '@/lib/hooks/use-disease-risk'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'
import { sortWorstFirst } from '@/lib/disease-risk/band'

/**
 * My Fields — the plots the farmer works, worst-first, each with its real metadata and today's
 * status. Reads the same shared engine hook as the rest of the app; never invents a field or a band.
 */
export function FieldsView() {
  const { lang } = useLanguage()
  const { data, error, loading, reload } = useDiseaseRisk()
  const t = APP_STRINGS[lang]
  const fields = data ? sortWorstFirst(data.fields) : []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<><Sprout className="h-4 w-4" /> {t.nav.fields}</>}
        title={t.fieldsTitle}
        subtitle={t.fieldsSub}
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

      {data && fields.length === 0 && <EmptyState title={t.fieldsTitle} description={t.fieldsSub} />}

      {data && fields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <FieldCard key={f.fieldId} field={f} />
          ))}
        </div>
      )}
    </div>
  )
}
