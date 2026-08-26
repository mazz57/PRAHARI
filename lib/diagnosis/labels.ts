/**
 * lib/diagnosis/labels.ts
 *
 * Farmer-friendly display labels and guidance for crop diagnosis.
 * Formats both mapped condition tokens and raw PlantVillage class names.
 */

export const CONDITION_LABELS: Record<string, string> = {
  healthy: 'Healthy',
  early_blight: 'Early Blight',
  late_blight: 'Late Blight',
  uncertain: 'Uncertain / Needs Review',
}

export const RAW_CLASS_LABELS: Record<string, string> = {
  'Potato___healthy': 'Potato — Healthy',
  'Potato___Early_blight': 'Potato — Early Blight',
  'Potato___Late_blight': 'Potato — Late Blight',
  'Pepper__bell___Bacterial_spot': 'Bell Pepper — Bacterial Spot',
  'Pepper__bell___healthy': 'Bell Pepper — Healthy',
  'Tomato_Bacterial_spot': 'Tomato — Bacterial Spot',
  'Tomato_Early_blight': 'Tomato — Early Blight',
  'Tomato_Late_blight': 'Tomato — Late Blight',
  'Tomato_Leaf_Mold': 'Tomato — Leaf Mold',
  'Tomato_Septoria_leaf_spot': 'Tomato — Septoria Leaf Spot',
  'Tomato_Spider_mites_Two_spotted_spider_mite': 'Tomato — Spider Mites',
  'Tomato__Target_Spot': 'Tomato — Target Spot',
  'Tomato__Tomato_YellowLeaf__Curl_Virus': 'Tomato — Yellow Leaf Curl Virus',
  'Tomato__Tomato_mosaic_virus': 'Tomato — Mosaic Virus',
  'Tomato_healthy': 'Tomato — Healthy',
}

export function labelText(cls: string): string {
  if (CONDITION_LABELS[cls]) return CONDITION_LABELS[cls]
  if (RAW_CLASS_LABELS[cls]) return RAW_CLASS_LABELS[cls]
  return cls
    .replace(/___/g, ' — ')
    .replace(/__/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const AGRONOMIC_GUIDANCE: Record<string, { title: string; action: string; note: string }> = {
  healthy: {
    title: 'No Active Disease Symptoms',
    action: 'Continue regular field monitoring. Maintain optimal irrigation and balanced plant nutrition.',
    note: 'Keep checking during humid, overcast periods when blight spores can travel from nearby fields.',
  },
  early_blight: {
    title: 'Early Blight Symptoms (Alternaria solani)',
    action: 'Prune affected lower leaves, ensure adequate spacing for airflow, and avoid overhead sprinkler watering.',
    note: 'Consult your local Krishi Vigyan Kendra (KVK) or extension officer for recommended protectant sprays (e.g. Mancozeb).',
  },
  late_blight: {
    title: 'Late Blight Symptoms (Phytophthora infestans)',
    action: 'Act urgently — late blight spreads rapidly in cool, wet weather. Remove and safely dispose of infected foliage.',
    note: 'Contact your nearest KVK immediately for emergency systemic fungicide guidance to protect the remaining crop.',
  },
  uncertain: {
    title: 'Uncertain Symptom / Non-Potato Leaf',
    action: 'Inspect several leaves across the field. Re-take a clear, well-lit photo of a single leaf against a neutral background.',
    note: 'If symptoms persist or spread, take a physical sample to your local KVK or agricultural extension center.',
  },
}
