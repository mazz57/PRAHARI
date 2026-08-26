'use client'

import { Check, X, Thermometer, Droplets, CalendarDays } from 'lucide-react'
import type { FieldRiskResult } from '@/lib/disease-risk/api-types'
import type { UiStrings } from '@/lib/i18n/ui-strings'

/**
 * The honest WHY. Shows the ACTUAL computed inputs behind the band — the two Hutton legs, the
 * consecutive-day count, and the accumulated Wallin severity against its thresholds. No invented
 * "AI confidence"; every number here came out of the rule-based engine.
 */
function Leg({ met, icon, label, detail }: { met: boolean; icon: React.ReactNode; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: met ? 'var(--risk-act)' : 'var(--risk-safe)', color: 'white' }}
      >
        {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {icon}
          {label}
        </div>
        <div className="text-sm text-muted-foreground">{detail}</div>
      </div>
    </div>
  )
}

export function WhyExplanation({ field, ui }: { field: FieldRiskResult; ui: UiStrings }) {
  const { legs, dsvAccum, severity, meanWetTempC, viableTempC } = field
  const pct = Math.min(100, Math.round((dsvAccum / severity.sprayThresholdDsv) * 100))

  return (
    <div className="space-y-3">
      {/* Plain-language reason, straight from the advisory. */}
      <p className="text-sm">{field.advisory.why}</p>

      <div className="grid gap-2 sm:grid-cols-3">
        <Leg
          met={legs.minTemp.met}
          icon={<Thermometer className="h-4 w-4" />}
          label={ui.minTemp}
          detail={`${legs.minTemp.value.toFixed(1)}°C (≥ ${legs.minTemp.threshold}°C)`}
        />
        <Leg
          met={legs.wetHours.met}
          icon={<Droplets className="h-4 w-4" />}
          label={ui.wetHours}
          detail={`${legs.wetHours.value} ${ui.hours} (≥ ${legs.wetHours.threshold} ${ui.hours})`}
        />
        <Leg
          met={legs.consecutiveDays.met}
          icon={<CalendarDays className="h-4 w-4" />}
          label={ui.consecutiveDays}
          detail={`${legs.consecutiveDays.value} / ${legs.consecutiveDays.threshold} ${ui.days}`}
        />
      </div>

      {/* Accumulated Wallin severity vs the spray / watch thresholds. */}
      <div className="rounded-lg border border-border p-3">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium">{ui.accumulatedSeverity}</span>
          <span className="tabular-nums text-muted-foreground">
            {dsvAccum} / {severity.sprayThresholdDsv}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: bandColorForDsv(dsvAccum, severity) }} />
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground">
          {ui.wallin}: {meanWetTempC.toFixed(1)}°C · {viableTempC[0]}–{viableTempC[1]}°C
        </div>
      </div>
    </div>
  )
}

function bandColorForDsv(dsv: number, s: { sprayThresholdDsv: number; amberThresholdDsv: number }): string {
  if (dsv >= s.sprayThresholdDsv) return 'var(--risk-act)'
  if (dsv >= s.amberThresholdDsv || dsv > 0) return 'var(--risk-watch)'
  return 'var(--risk-safe)'
}
