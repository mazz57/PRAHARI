'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RiskBandBadge } from '@/components/risk/risk-band-badge'
import { WhyExplanation } from '@/components/risk/why-explanation'
import { FieldConfirmation } from '@/components/risk/field-confirmation'
import { SpeakButton } from '@/components/voice-assistant'
import { bandToSemantic } from '@/lib/disease-risk/band'
import type { FieldRiskResult } from '@/lib/disease-risk/api-types'
import type { UiStrings } from '@/lib/i18n/ui-strings'

/** One field's risk card: name → band → what-to-do → collapsible honest WHY. */
export function FieldRiskCard({ field, ui }: { field: FieldRiskResult; ui: UiStrings }) {
  const s = bandToSemantic(field.band)
  return (
    <Card className="overflow-hidden">
      {/* Coloured spine so the band reads at a glance. */}
      <div className="h-1.5 w-full" style={{ backgroundColor: s.color }} />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* WHICH FIELD comes first — the most important word for a farmer with several plots. */}
            <h3 className="truncate text-lg font-semibold">{field.fieldName}</h3>
            <p className="text-sm text-muted-foreground">{field.advisory.what}</p>
          </div>
          <RiskBandBadge band={field.band} label={field.advisory.bandLabel} size="lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* WHAT TO DO */}
        <div className="rounded-lg p-3" style={{ backgroundColor: s.color, color: s.onColor }}>
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wide opacity-80">{ui.whatToDo}</div>
            <SpeakButton text={field.advisory.text} lang={field.advisory.lang} label={ui.listen} />
          </div>
          <div className="font-medium">{field.advisory.action}</div>
          <div className="mt-0.5 text-sm opacity-90">{field.advisory.when}</div>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="why" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium">{ui.why}</AccordionTrigger>
            <AccordionContent>
              <WhyExplanation field={field} ui={ui} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* CONFIRM → MONITOR: record what actually happened (session-only, honestly labelled). */}
        <FieldConfirmation ui={ui} />
      </CardContent>
    </Card>
  )
}
