/**
 * Shared shape of the /api/disease-risk JSON response. Imported by both the route (server) and the
 * client view so they cannot drift. Type-only; no runtime code, safe in client components.
 */
import type { FieldRiskResult } from '@/lib/disease-risk/engine'
import type { DataStatus } from '@/lib/weather/types'

export type { FieldRiskResult }

export interface RiskMethod {
  model: string
  approach: string
  citation: string
  mlDelta: number
}

export interface DistrictInfo {
  key: string
  nameEn: string
  nameHi: string
  state: string
  center: { lat: number; lon: number }
}

export interface DiseaseRiskResponseBase {
  mode: 'live' | 'demo'
  dataStatus: DataStatus
  district: DistrictInfo
  method: RiskMethod
  generatedAt: string
  fields: FieldRiskResult[]
}

export interface LiveRiskResponse extends DiseaseRiskResponseBase {
  mode: 'live'
  dataStatus: 'live'
  weatherSource: string
}

export interface DemoRiskResponse extends DiseaseRiskResponseBase {
  mode: 'demo'
  dataStatus: 'scenario'
  scenario: { key: string; label: string; description: string; startDate: string }
  demoNotice: string
}

export type DiseaseRiskResponse = LiveRiskResponse | DemoRiskResponse

export interface RiskErrorResponse {
  error: string
  kind?: string
  message?: string
  hint?: string
}
