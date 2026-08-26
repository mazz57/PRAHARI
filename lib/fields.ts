/**
 * Demo field registry — the hackathon stand-in for farmer-drawn boundaries.
 *
 * ⚠️ HACKATHON SCOPE (honesty): in the real product these come from a farmer walking their plot
 * boundary with GPS and naming it in their own words. We cannot bring real farmers to a hackathon,
 * so these three fields are FIXTURES — not real farmer data. Everything downstream (resolution,
 * risk assessment, advisory, UI) is the real code path; only the source of the coordinates is stubbed.
 *
 * 🔴 Names are in the farmer's own words ("the canal field"), not "Field 1" — the name is the first
 *    thing an advisory says, which is what makes it locatable.
 */

export interface DemoField {
  id: string
  district: string
  cropKey: string
  /** Display names per language (card label). name_kn is a placeholder — see below. */
  nameEn: string
  nameHi: string
  nameKn: string
  /** Oblique/spoken form for "in your ___" sentences (Hindi grammar). */
  nameHiSpoken: string
  center: { lat: number; lon: number }
  areaLocal: string
  sownOn: string
}

/** Farrukhabad district centre (Uttar Pradesh). Gradients in demo scenarios are measured from here. */
export const DEMO_DISTRICT = {
  key: 'farrukhabad',
  nameEn: 'Farrukhabad',
  nameHi: 'फ़र्रुख़ाबाद',
  state: 'Uttar Pradesh',
  center: { lat: 27.4, lon: 79.6 },
} as const

// [VERIFY-kn] Kannada field names reuse the English label for now (these UP fields have no natural
// Kannada name); a Kannada-speaking region would supply its own field names in production.
export const DEMO_FIELDS: DemoField[] = [
  {
    id: 'fld_nahar',
    district: 'farrukhabad',
    cropKey: 'potato',
    nameEn: 'Canal field',
    nameHi: 'नहर वाला खेत',
    nameKn: 'Canal field',
    nameHiSpoken: 'नहर वाले खेत',
    center: { lat: 27.34, lon: 79.52 },
    areaLocal: '२ बीघा',
    sownOn: '2026-08-01',
  },
  {
    id: 'fld_school',
    district: 'farrukhabad',
    cropKey: 'potato',
    nameEn: 'Behind the school',
    nameHi: 'स्कूल के पीछे',
    nameKn: 'Behind the school',
    nameHiSpoken: 'स्कूल के पीछे वाले खेत',
    center: { lat: 27.46, lon: 79.64 },
    areaLocal: '१.५ बीघा',
    sownOn: '2026-08-05',
  },
  {
    id: 'fld_bada',
    district: 'farrukhabad',
    cropKey: 'potato',
    nameEn: 'Big field',
    nameHi: 'बड़ा खेत',
    nameKn: 'Big field',
    nameHiSpoken: 'बड़े खेत',
    center: { lat: 27.53, lon: 79.71 },
    areaLocal: '३ बीघा',
    sownOn: '2026-07-28',
  },
]

export function fieldDisplayName(field: DemoField, lang: 'en' | 'hi' | 'kn'): string {
  if (lang === 'hi') return field.nameHi
  if (lang === 'kn') return field.nameKn
  return field.nameEn
}

/** Spoken/oblique form used inside the "in your ___" advisory sentence. */
export function fieldSpokenName(field: DemoField, lang: 'en' | 'hi' | 'kn'): string {
  if (lang === 'hi') return field.nameHiSpoken
  if (lang === 'kn') return field.nameKn
  return field.nameEn
}

export function resolveField(id: string): DemoField | undefined {
  return DEMO_FIELDS.find((f) => f.id === id)
}
