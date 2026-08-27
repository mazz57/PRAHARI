'use client'

import Link from 'next/link'
import { Ruler, CalendarDays, ArrowRight } from 'lucide-react'
import { BandChip } from '@/components/shared/band-chip'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'
import { resolveField, fieldDisplayName } from '@/lib/fields'
import { formatDate } from '@/lib/i18n/format'
import type { FieldRiskResult } from '@/lib/disease-risk/api-types'

/**
 * A single plot, metadata-forward: what it is (name, area, sowing date), how it is today (band +
 * plain what-to-do), and a link to the weather forecast detail. Deliberately distinct from Field
 * Risk — no map, no science here; this answers "which of my plots, and is it OK?".
 */
export function FieldCard({ field }: { field: FieldRiskResult }) {
  const { lang } = useLanguage()
  const t = APP_STRINGS[lang]
  const meta = resolveField(field.fieldId)
  const name = meta ? fieldDisplayName(meta, lang) : field.fieldName

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <BandChip band={field.band} label={field.advisory.bandLabel} />
      </div>

      {meta && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="h-4 w-4" />
            {t.fieldArea}: <span className="font-medium text-foreground">{meta.areaLocal}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {t.fieldSown}: <span className="font-medium text-foreground">{formatDate(meta.sownOn, lang)}</span>
          </span>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-muted/40 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.fieldWhatToDo}</div>
        <p className="mt-1 text-sm text-foreground">{field.advisory.action}</p>
      </div>

      <Link
        href="/field-risk"
        className="group mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
      >
        {t.fieldViewForecast}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
