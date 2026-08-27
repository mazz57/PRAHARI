'use client'

import type { LucideIcon } from 'lucide-react'
import { MapPin, HelpCircle, ListChecks } from 'lucide-react'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'

export type Severity = 'urgent' | 'attention' | 'watch' | 'info'

export interface AlertItem {
  id: string
  severity: Severity
  colorVar: string
  sevLabel: string
  icon: LucideIcon
  /** WHAT is happening — the headline. */
  title: string
  /** WHERE — field name. */
  where?: string
  /** WHY — plain-language reason. */
  why?: string
  /** WHAT TO DO — the action. */
  what?: string
  /** For Info cards: a plain contextual note instead of the where/why/what triplet. */
  note?: string
}

/**
 * One alert, structured to answer a farmer's four questions at a glance: WHAT (title), WHERE (field),
 * WHY (plain reason), and WHAT TO DO (action). A coloured rail encodes severity so the list scans
 * top-to-bottom by urgency.
 */
export function AlertCard({ item }: { item: AlertItem }) {
  const { lang } = useLanguage()
  const t = APP_STRINGS[lang]
  const Icon = item.icon

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card"
      style={{ borderLeftWidth: 4, borderLeftColor: item.colorVar }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide"
            style={{ backgroundColor: `color-mix(in oklch, ${item.colorVar} 18%, var(--background))`, color: item.colorVar }}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.sevLabel}
          </span>
          {item.where && <span className="text-sm font-semibold text-foreground">{item.where}</span>}
        </div>

        <h3 className="mt-2 font-semibold text-foreground">{item.title}</h3>

        {item.note ? (
          <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
        ) : (
          <dl className="mt-3 space-y-2 text-sm">
            {item.where && (
              <div className="flex gap-2">
                <dt className="inline-flex w-24 shrink-0 items-center gap-1.5 font-medium text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {t.alertWhere}
                </dt>
                <dd className="text-foreground">{item.where}</dd>
              </div>
            )}
            {item.why && (
              <div className="flex gap-2">
                <dt className="inline-flex w-24 shrink-0 items-center gap-1.5 font-medium text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5" /> {t.alertWhy}
                </dt>
                <dd className="text-foreground">{item.why}</dd>
              </div>
            )}
            {item.what && (
              <div className="flex gap-2">
                <dt className="inline-flex w-24 shrink-0 items-center gap-1.5 font-medium text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" /> {t.alertWhat}
                </dt>
                <dd className="font-medium text-foreground">{item.what}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  )
}
