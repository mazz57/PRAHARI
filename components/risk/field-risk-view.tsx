'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Leaf, Camera, Sun, Cloud, CloudRain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldRiskCard } from '@/components/risk/field-risk-card'
import { FieldMap } from '@/components/risk/field-map'
import { UI } from '@/lib/i18n/ui-strings'
import type { Lang } from '@/lib/i18n/advisory-templates'
import type { DiseaseRiskResponse, RiskErrorResponse } from '@/lib/disease-risk/api-types'

type Mode = 'live' | 'blight_outbreak' | 'borderline_watch' | 'dry_spell'
const LANGS: Lang[] = ['en', 'hi', 'kn']
const LANG_LABEL: Record<Lang, string> = { en: 'English', hi: 'हिंदी', kn: 'ಕನ್ನಡ' }
const SCENARIO_MODES: { key: Mode; icon: React.ReactNode }[] = [
  { key: 'blight_outbreak', icon: <CloudRain className="h-4 w-4" /> },
  { key: 'borderline_watch', icon: <Cloud className="h-4 w-4" /> },
  { key: 'dry_spell', icon: <Sun className="h-4 w-4" /> },
]
const SCENARIO_LABEL: Record<string, string> = {
  blight_outbreak: 'Blight outbreak',
  borderline_watch: 'Borderline',
  dry_spell: 'Dry spell',
}

export function FieldRiskView() {
  const [lang, setLang] = useState<Lang>('en')
  const [mode, setMode] = useState<Mode>('blight_outbreak') // default to a demo so the page is alive in August
  const [data, setData] = useState<DiseaseRiskResponse | null>(null)
  const [error, setError] = useState<RiskErrorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const ui = UI[lang]

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ lang })
      if (mode !== 'live') qs.set('scenario', mode)
      const res = await fetch(`/api/disease-risk?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        setError(json as RiskErrorResponse)
        setData(null)
      } else {
        setData(json as DiseaseRiskResponse)
      }
    } catch (e) {
      setError({ error: 'network', message: (e as Error).message })
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [lang, mode])

  useEffect(() => {
    void load()
  }, [load])

  const isDemo = data?.mode === 'demo'

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Leaf className="h-4 w-4" />
          {ui.predictName}
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{ui.fieldRiskTitle}</h1>
        <p className="max-w-2xl text-muted-foreground">{ui.fieldRiskSubtitle}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Language */}
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 text-sm font-medium ${lang === l ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
            >
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
        {/* Mode: live + scenarios */}
        <div className="inline-flex flex-wrap overflow-hidden rounded-lg border border-border">
          <button
            onClick={() => setMode('live')}
            className={`px-3 py-1.5 text-sm font-medium ${mode === 'live' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
          >
            {ui.liveMode}
          </button>
          {SCENARIO_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${mode === m.key ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
            >
              {m.icon}
              {SCENARIO_LABEL[m.key]}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {ui.retry}
        </Button>
      </div>

      {/* DEMO MODE banner — clearly labelled, never hidden. */}
      {isDemo && data.mode === 'demo' && (
        <Alert style={{ borderColor: 'var(--risk-watch)' }}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{ui.demoMode} · {data.scenario.label}</AlertTitle>
          <AlertDescription>{data.demoNotice}</AlertDescription>
        </Alert>
      )}

      {/* Error — honest, no fake fallback. */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{ui.errorTitle}</AlertTitle>
          <AlertDescription>
            <p>{error.message ?? error.error}</p>
            {error.hint && <p className="mt-1 text-sm opacity-90">{error.hint}</p>}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Content */}
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
            <a href="/check-crop">{ui.openDetect}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
