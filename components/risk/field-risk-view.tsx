'use client'

import { useState } from 'react'
import { RefreshCw, Camera, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/app-shell/page-header'
import { ErrorState, LoadingState } from '@/components/app-shell/states'
import { FieldRiskCard } from '@/components/risk/field-risk-card'
import { FieldMap } from '@/components/risk/field-map'
import { useDiseaseRisk } from '@/lib/hooks/use-disease-risk'
import { useLanguage } from '@/components/providers/language-provider'
import { UI } from '@/lib/i18n/ui-strings'
import type { Lang } from '@/lib/i18n/advisory-templates'

/**
 * Field Risk — the weather-driven EARLY WARNING. It reads the shared engine hook (so language and
 * Demo/Test mode are the app-wide ones, never a private copy) and keeps the honest WHY: the map, the
 * per-field Hutton/Wallin factors, and the method/citation. The callout up top is the guardrail that
 * keeps a FORECAST from being read as a CONFIRMED diagnosis — that is what Crop Health is for.
 */

const FORECAST_NOTE: Record<Lang, { title: string; body: string }> = {
  en: {
    title: 'This is a forecast — not a diagnosis',
    body: 'Field Risk warns you when the weather could bring disease, before anything shows on the plant. It does not confirm disease is present. If you can already see spots on a leaf, use Crop Health to check a photo.',
  },
  hi: {
    title: 'यह पूर्वानुमान है — पहचान नहीं',
    body: 'खेत का जोखिम आपको तब चेताता है जब मौसम बीमारी ला सकता है — पौधे पर कुछ दिखने से पहले। यह पुष्टि नहीं करता कि बीमारी मौजूद है। यदि पत्ते पर धब्बे पहले से दिख रहे हैं, तो फोटो जाँचने के लिए “फसल की सेहत” का उपयोग करें।',
  },
  kn: {
    title: 'ಇದು ಮುನ್ಸೂಚನೆ — ರೋಗನಿರ್ಣಯವಲ್ಲ',
    body: 'ಹೊಲದ ಅಪಾಯವು ಹವಾಮಾನ ರೋಗ ತರಬಹುದಾದಾಗ, ಗಿಡದ ಮೇಲೆ ಏನೂ ಕಾಣುವ ಮೊದಲೇ ಎಚ್ಚರಿಸುತ್ತದೆ. ರೋಗವಿದೆ ಎಂದು ಇದು ದೃಢೀಕರಿಸುವುದಿಲ್ಲ. ಎಲೆಯ ಮೇಲೆ ಈಗಾಗಲೇ ಕಲೆಗಳು ಕಂಡರೆ, ಫೋಟೋ ಪರಿಶೀಲಿಸಲು “ಬೆಳೆ ಆರೋಗ್ಯ” ಬಳಸಿ.',
  },
}

export function FieldRiskView() {
  const { lang } = useLanguage()
  const { data, error, loading, reload, demo } = useDiseaseRisk()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const ui = UI[lang]
  const note = FORECAST_NOTE[lang]

  return (
    <div className="space-y-6">
      <PageHeader
        title={ui.fieldRiskTitle}
        subtitle={ui.fieldRiskSubtitle}
        actions={
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {ui.retry}
          </Button>
        }
      />

      {/* FORECAST ≠ CONFIRMED — the key distinction from Crop Health. */}
      <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-sm">
          <span className="font-semibold text-foreground">{note.title}.</span>{' '}
          <span className="text-muted-foreground">{note.body}</span>
        </div>
      </div>

      {loading && !data && !error && <LoadingState label={ui.loading} />}

      {error && (
        <ErrorState
          title={ui.errorTitle}
          description={error.message ?? error.error}
          hint={error.hint}
          retryLabel={ui.retry}
          onRetry={reload}
        />
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="order-2 space-y-4 lg:order-1">
            {data.fields.map((f) => (
              <FieldRiskCard key={f.fieldId} field={f} ui={ui} />
            ))}
          </div>
          <div className="order-1 space-y-3 lg:order-2">
            <div className="aspect-square w-full">
              <FieldMap fields={data.fields} district={data.district} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
            <Card>
              <CardContent className="space-y-1 py-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">{ui.method}:</span> {data.method.approach}
                </div>
                <div>
                  <span className="font-medium text-foreground">{ui.weatherSource}:</span>{' '}
                  {data.mode === 'live' ? data.weatherSource : `${ui.demoMode} (${data.scenario.label})`}
                </div>
                <div>
                  <span className="font-medium text-foreground">{ui.district}:</span> {data.district.nameEn}, {data.district.state}
                </div>
                <div title={data.method.citation}>{data.method.citation}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cross-link to the other, clearly-different core feature. */}
      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{ui.detectName}</div>
              <div className="text-sm text-muted-foreground">{ui.detectQuestion}</div>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href="/crop-health">{ui.openDetect}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
