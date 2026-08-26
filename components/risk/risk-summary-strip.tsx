'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { RiskBandBadge } from '@/components/risk/risk-band-badge'
import type { DiseaseRiskResponse, RiskErrorResponse } from '@/lib/disease-risk/api-types'

/**
 * Compact dashboard strip that reflects the REAL engine output for the demo district. It calls the
 * same /api/disease-risk endpoint the full page uses — no hardcoded bands or percentages. Defaults
 * to the blight-outbreak DEMO scenario so the card is alive year-round (late blight is a winter
 * disease; a live August call correctly returns Safe), and it says "DEMO" plainly when it is.
 */
export function RiskSummaryStrip({ scenario = 'blight_outbreak' }: { scenario?: string | null }) {
  const [data, setData] = useState<DiseaseRiskResponse | null>(null)
  const [error, setError] = useState<RiskErrorResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const qs = new URLSearchParams({ lang: 'en' })
    if (scenario) qs.set('scenario', scenario)
    fetch(`/api/disease-risk?${qs.toString()}`, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!alive) return
        if (!res.ok) {
          setError(json as RiskErrorResponse)
          setData(null)
        } else {
          setData(json as DiseaseRiskResponse)
        }
      })
      .catch((e) => alive && setError({ error: 'network', message: (e as Error).message }))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [scenario])

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Field Risk — live snapshot</h3>
          <p className="text-sm text-muted-foreground">
            {data?.district ? `${data.district.nameEn}, ${data.district.state}` : 'Demo district'} ·{' '}
            {data?.mode === 'demo' ? `DEMO (${data.scenario.label})` : data?.mode === 'live' ? 'Live forecast' : '—'}
          </p>
        </div>
        <Link href="/field-risk" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" /> Checking the weather…
        </div>
      )}

      {error && (
        <p className="py-3 text-sm text-destructive">
          Could not get weather: {error.message ?? error.error}. The engine never invents a band, so no risk is shown.
        </p>
      )}

      {data && (
        <div className="space-y-2">
          {data.fields.map((f) => (
            <div key={f.fieldId} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
              <span className="min-w-0 truncate text-sm font-medium">{f.fieldName}</span>
              <RiskBandBadge band={f.band} label={f.advisory.bandLabel} size="sm" />
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            Bands computed by the Hutton + Wallin engine (rule-based, no fabricated AI confidence).
          </p>
        </div>
      )}
    </div>
  )
}
