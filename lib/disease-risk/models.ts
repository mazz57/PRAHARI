/**
 * Disease model registry. All science lives in DATA here (mirrors Prahari
 * pipeline/config/models.yaml), not in if-statements, so adding a crop/disease is a data edit.
 *
 * [VERIFY] Wallin dsv_table band boundaries/breakpoints should be confirmed against
 * Wallin (1962) before DSV output is presented as authoritative.
 */
import type { DsvBand } from './wallin'
import { DEFAULT_DSV_TABLE } from './wallin'

/** Hutton daily-gate parameters. */
export interface HuttonParams {
  /** RH % at/above which an hour counts as wet (inclusive). */
  rhThreshold: number
  /** Minimum wet hours in a day for the day to qualify. */
  minWetHours: number
  /** Minimum daily temperature (C) for the day to qualify. */
  minTempC: number
  /** Consecutive qualifying days required to meet the criterion. */
  consecutiveDays: number
}

/** Wallin severity thresholds on accumulated DSV. */
export interface SeverityConfig {
  /** Accumulated DSV at/above which the band escalates to "act". */
  sprayThresholdDsv: number
  /** Accumulated DSV at/above which the band escalates to "watch". */
  amberThresholdDsv: number
  dsvTable: readonly DsvBand[]
}

export interface DiseaseModel {
  id: string
  crop: string
  cropKey: string
  disease: string
  diseaseKey: string
  pathogen: string
  version: string
  citation: string
  params: HuttonParams
  severity: SeverityConfig
  /** Overall development temperature range (C); outside it the pathogen does not progress. */
  viableTempC: readonly [number, number]
}

// potato_late_blight_hutton — mirror of models.yaml.
export const POTATO_LATE_BLIGHT: DiseaseModel = {
  id: 'potato_late_blight_hutton',
  crop: 'Potato',
  cropKey: 'potato',
  disease: 'Late blight',
  diseaseKey: 'late_blight',
  pathogen: 'Phytophthora infestans',
  version: '2.0.0',
  citation: 'Hutton criteria; Wallin (1962); Smith (1956); BLITECAST (Krause et al. 1975)',
  params: {
    rhThreshold: 90.0,
    minWetHours: 6,
    minTempC: 10.0,
    consecutiveDays: 2,
  },
  severity: {
    sprayThresholdDsv: 18,
    amberThresholdDsv: 12,
    dsvTable: DEFAULT_DSV_TABLE,
  },
  viableTempC: [7.2, 26.6],
}

/** Registry keyed by "<cropKey>__<diseaseKey>" so more crops/diseases can be added later. */
export const MODELS: Record<string, DiseaseModel> = {
  potato__late_blight: POTATO_LATE_BLIGHT,
}

export function resolveModel(cropKey: string, diseaseKey: string): DiseaseModel | undefined {
  return MODELS[`${cropKey}__${diseaseKey}`]
}
