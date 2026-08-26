import type { RawGovMandiRecord, MandiRecord } from './types'

function parsePrice(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val * 100) / 100
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : Math.round(num * 100) / 100
  }
  return 0
}

function cleanString(val: unknown, fallback = '—'): string {
  if (typeof val !== 'string') return fallback
  const trimmed = val.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

export function normalizeGovRecord(raw: RawGovMandiRecord): MandiRecord {
  return {
    state: cleanString(raw.state),
    district: cleanString(raw.district),
    market: cleanString(raw.market),
    commodity: cleanString(raw.commodity),
    variety: cleanString(raw.variety),
    grade: cleanString(raw.grade),
    arrivalDate: cleanString(raw.arrival_date),
    minPrice: parsePrice(raw.min_price),
    modalPrice: parsePrice(raw.modal_price),
    maxPrice: parsePrice(raw.max_price),
  }
}
