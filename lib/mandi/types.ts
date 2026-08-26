export type MandiDataStatus = 'live' | 'unavailable'

export interface RawGovMandiRecord {
  state?: string
  district?: string
  market?: string
  commodity?: string
  variety?: string
  grade?: string
  arrival_date?: string
  min_price?: string | number
  max_price?: string | number
  modal_price?: string | number
  [key: string]: unknown
}

export interface RawGovMandiResponse {
  index_name?: string
  title?: string
  desc?: string
  created?: number | string
  updated?: number | string
  created_date?: string
  updated_date?: string
  status?: string
  total?: number
  count?: number
  limit?: string | number
  offset?: string | number
  records?: RawGovMandiRecord[]
  message?: string
  [key: string]: unknown
}

export interface MandiRecord {
  state: string
  district: string
  market: string
  commodity: string
  variety: string
  grade: string
  arrivalDate: string
  minPrice: number
  modalPrice: number
  maxPrice: number
}

export interface MandiResponse {
  dataStatus: MandiDataStatus
  source: string
  commodity: string
  state?: string
  district?: string
  market?: string
  updatedAt?: string
  message?: string
  totalRecords: number
  records: MandiRecord[]
}

export interface MandiQueryParams {
  commodity?: string
  state?: string
  district?: string
  market?: string
  limit?: number
  offset?: number
}
