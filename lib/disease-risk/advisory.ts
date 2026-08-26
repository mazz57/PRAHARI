/**
 * Advisory text generation — the four-part script: WHICH FIELD → WHAT → WHY → WHEN. Pure.
 * Faithful port of Prahari engine/advisory.py (the audio-hashing/TTS parts are omitted; this MVP
 * has no pre-generated audio, so there is nothing to content-address).
 *
 * 🔴 The field name comes FIRST, always. For a farmer with three parcels, "which field" is the
 * most important word in the message.
 *
 * 🔴 The why_too_hot / why_too_cold cases exist because the Hutton criterion can be met while
 * Wallin severity stays 0 (humid, but outside the pathogen's viable temperature). Saying so plainly
 * is what keeps a safe-but-humid day from reading as a hidden risk.
 */
import { ADVISORY_TEMPLATES } from '@/lib/i18n/advisory-templates'
import type { AdvisoryTemplate, Band, Lang } from '@/lib/i18n/advisory-templates'

/** Wallin's overall development range: outside it the pathogen does not progress. */
export const DEFAULT_VIABLE_TEMP_C: readonly [number, number] = [7.2, 26.6]

export type WhyKey = 'why_wet' | 'why_dry' | 'why_too_hot' | 'why_too_cold'

export interface WhyInput {
  band: Band
  criterionMet: boolean
  dsvAccum: number
  wetHours: number
  meanWetTempC: number
  minWetHours: number
  viableTempC?: readonly [number, number]
}

/** Pick the explanation key that is actually TRUE for this cell. */
export function whyReason(input: WhyInput): WhyKey {
  const { band, criterionMet, dsvAccum, wetHours, meanWetTempC, minWetHours } = input
  const [lo, hi] = input.viableTempC ?? DEFAULT_VIABLE_TEMP_C
  if (criterionMet && dsvAccum === 0) {
    if (meanWetTempC > hi) return 'why_too_hot'
    if (meanWetTempC < lo) return 'why_too_cold'
  }
  if (band === 'safe' && wetHours < minWetHours) return 'why_dry'
  if (wetHours >= minWetHours) return 'why_wet'
  return 'why_dry'
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  )
}

function whyText(t: AdvisoryTemplate, key: WhyKey, wetHours: number): string {
  switch (key) {
    case 'why_wet':
      return fill(t.whyWet, { wet_hours: wetHours })
    case 'why_dry':
      return t.whyDry
    case 'why_too_hot':
      return t.whyTooHot
    case 'why_too_cold':
      return t.whyTooCold
  }
}

export interface Advisory {
  lang: Lang
  which: string
  what: string
  why: string
  when: string
  whyKey: WhyKey
  /** Full four-part message. */
  text: string
  action: string
  bandLabel: string
}

export interface BuildAdvisoryInput {
  lang: Lang
  fieldName: string
  cropKey: string
  band: Band
  criterionMet: boolean
  dsvAccum: number
  wetHours: number
  meanWetTempC: number
  minWetHours: number
  /** Prerendered human phrase for the spray window; when absent we give honest general timing. */
  sprayWindow?: string
  viableTempC?: readonly [number, number]
}

/** Render the four-part advisory for one field in one language. */
export function buildAdvisory(input: BuildAdvisoryInput): Advisory {
  const t = ADVISORY_TEMPLATES[input.lang]
  const cropWord = t.crops[input.cropKey] ?? input.cropKey
  const diseaseWord = t.disease

  const which = fill(t.which, { field: input.fieldName })
  const what = fill(t.what[input.band], { crop: cropWord, disease: diseaseWord })
  const key = whyReason({
    band: input.band,
    criterionMet: input.criterionMet,
    dsvAccum: input.dsvAccum,
    wetHours: input.wetHours,
    meanWetTempC: input.meanWetTempC,
    minWetHours: input.minWetHours,
    viableTempC: input.viableTempC,
  })
  const why = whyText(t, key, input.wetHours)

  let when: string
  if (input.band === 'act') {
    when = input.sprayWindow ? fill(t.whenAct, { window: input.sprayWindow }) : t.whenActNoWindow
  } else if (input.band === 'watch') {
    when = t.whenWatch
  } else {
    when = t.whenSafe
  }

  const text = [which, what, why, when].map((p) => p.trim()).filter(Boolean).join(' ')

  return {
    lang: input.lang,
    which,
    what,
    why,
    when,
    whyKey: key,
    text,
    action: t.action[input.band],
    bandLabel: t.bandLabel[input.band],
  }
}
