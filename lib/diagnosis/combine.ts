/**
 * Combines the two INDEPENDENT signals PRAHARI produces for a field:
 *   1) the weather-driven disease risk band (Hutton + Wallin)  — from /api/disease-risk
 *   2) the leaf-image diagnosis                                — from /api/crop-diagnosis
 *
 * It deliberately does NOT force them to agree. When they disagree we say so plainly and steer the
 * farmer toward inspection / expert confirmation, because a weather model and a single leaf photo are
 * measuring different things and either can be right. The image feature stays fully usable even when
 * there is no field-risk context.
 */
import type { Band } from '@/lib/disease-risk/band'
import type { DiagnosisResult } from './types'
import { labelText } from './labels'

export type CombinedStatus =
  | 'both-attention' // weather elevated AND image shows symptoms  -> agree: act
  | 'both-clear' //     weather low AND image healthy             -> agree: reassure
  | 'weather-only' //   weather elevated but leaf looks healthy   -> disagree
  | 'image-only' //     weather low but leaf shows symptoms       -> disagree
  | 'na' //             no usable image result to combine

export interface CombinedSignal {
  status: CombinedStatus
  headline: string
  detail: string
  /** Echoed so the UI can render the band chip next to the combined note. */
  weatherBand: Band
  /** true only when BOTH signals agree (used for accent colour, not for hiding disagreement). */
  agree: boolean
}

type ImageDirection = 'symptoms' | 'healthy' | 'na'

function imageDirection(image: DiagnosisResult): ImageDirection {
  if (image.status !== 'ok' && image.status !== 'uncertain') return 'na'
  const top = image.prediction?.class
  if (!top) return 'na'
  return top === 'healthy' ? 'healthy' : 'symptoms'
}

export function combineSignals(band: Band, image: DiagnosisResult): CombinedSignal {
  const elevated = band === 'act' || band === 'watch'
  const dir = imageDirection(image)
  const confident = image.status === 'ok'
  const top = image.prediction?.class
  const named = top && top !== 'healthy' ? labelText(top).toLowerCase() : 'disease'

  if (dir === 'na') {
    return {
      status: 'na',
      headline: 'Showing the weather-based field risk only',
      detail:
        'There is no leaf-image result to combine yet. Run a crop photo check to cross-check the weather model.',
      weatherBand: band,
      agree: false,
    }
  }

  if (elevated && dir === 'symptoms') {
    return {
      status: 'both-attention',
      headline: 'Both signals point to a problem',
      detail: confident
        ? `The environmental risk and the leaf photo both indicate this field needs attention (image: ${named}). Inspect it and consider acting on the advisory above.`
        : `The weather model shows elevated risk and the leaf photo shows possible symptoms (${named}). Inspect this field closely or seek expert confirmation.`,
      weatherBand: band,
      agree: true,
    }
  }

  if (!elevated && dir === 'healthy') {
    return {
      status: 'both-clear',
      headline: 'Both signals look clear',
      detail:
        'The weather model shows low risk and the leaf photo looks healthy right now. Keep monitoring as conditions change.',
      weatherBand: band,
      agree: true,
    }
  }

  if (elevated && dir === 'healthy') {
    return {
      status: 'weather-only',
      headline: 'Weather risk is up, but this leaf looks healthy',
      detail:
        'Conditions currently favour disease even though this leaf looks healthy. Symptoms can lag behind the weather — keep monitoring and re-check soon.',
      weatherBand: band,
      agree: false,
    }
  }

  // !elevated && dir === 'symptoms'
  return {
    status: 'image-only',
    headline: 'This leaf shows symptoms, but weather risk is low',
    detail: `The weather model currently shows low risk, but the image check shows possible symptoms (${named}). Inspect the crop carefully or seek expert confirmation.`,
    weatherBand: band,
    agree: false,
  }
}
