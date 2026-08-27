'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/components/providers/language-provider'
import { useDemoMode } from '@/components/providers/demo-mode-provider'
import type { DiseaseRiskResponse, RiskErrorResponse } from '@/lib/disease-risk/api-types'

/**
 * Shared client hook for the disease-risk engine. Every data page (Home, My Fields, Field Risk,
 * Alerts, Insights) reads through this so the fetch, the language param, the demo-scenario wiring,
 * and the honest error handling all live in ONE place — no duplicated logic and no page can quietly
 * invent a fallback. The response is exactly what /api/disease-risk returns; on failure we surface
 * the real error, never fake weather.
 */
export interface UseDiseaseRisk {
  data: DiseaseRiskResponse | null
  error: RiskErrorResponse | null
  loading: boolean
  reload: () => void
  demo: boolean
}

export function useDiseaseRisk(): UseDiseaseRisk {
  const { lang } = useLanguage()
  const { demo, scenario } = useDemoMode()
  const [data, setData] = useState<DiseaseRiskResponse | null>(null)
  const [error, setError] = useState<RiskErrorResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ lang })
      if (demo) qs.set('scenario', scenario)
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
  }, [lang, demo, scenario])

  useEffect(() => {
    void load()
  }, [load])

  return { data, error, loading, reload: load, demo }
}
