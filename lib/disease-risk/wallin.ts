/**
 * Wallin (1962) Disease Severity Value (DSV) table lookup.
 * Faithful TypeScript port of Prahari engine/wallin.py (pure, no I/O).
 *
 * The band boundaries and hour breakpoints mirror pipeline/config/models.yaml.
 * DSV is the value of the highest hour-breakpoint that the wet spell reaches.
 * Temperatures below the coldest band or above the warmest yield DSV 0.
 *
 * Bands are treated as CONTIGUOUS: as published they read 7.2-11.6, 11.7-15.0, 15.1-26.6,
 * and the 0.1 C gaps are a printing artefact. A temperature between two bands falls into the
 * WARMER of them, so interpolated cell temperatures in a seam (e.g. 15.05 C) are never
 * silently scored 0 in the middle of the pathogen's ideal range.
 */

export interface DsvBand {
  t_min: number
  t_max: number
  /** [wetHours, dsvValue] breakpoints, ascending by hours. */
  breaks: readonly (readonly [number, number])[]
}

// Mirror of models.yaml -> potato_late_blight_hutton.severity.dsv_table.
export const DEFAULT_DSV_TABLE: readonly DsvBand[] = [
  { t_min: 7.2, t_max: 11.6, breaks: [[15, 0], [18, 1], [21, 2], [24, 3]] },
  { t_min: 11.7, t_max: 15.0, breaks: [[12, 0], [15, 1], [18, 2], [21, 3], [24, 4]] },
  { t_min: 15.1, t_max: 26.6, breaks: [[9, 0], [12, 1], [15, 2], [18, 3], [24, 4]] },
]

/**
 * Daily Disease Severity Value (0-4) from wet-spell mean temperature and duration.
 *
 * `meanWetTemp` is the mean temperature DURING THE WET SPELL, not the daily mean.
 */
export function wallinDsv(
  meanWetTemp: number,
  wetHours: number,
  dsvTable: readonly DsvBand[] = DEFAULT_DSV_TABLE,
): number {
  const bands = [...dsvTable].sort((a, b) => a.t_min - b.t_min)
  if (bands.length === 0) return 0
  if (meanWetTemp < bands[0].t_min || meanWetTemp > bands[bands.length - 1].t_max) return 0

  // First band whose t_max >= temp. Between-band temps snap to the warmer band because the
  // cooler band's t_max sits below the temperature.
  const band = bands.find((b) => meanWetTemp <= b.t_max) ?? bands[bands.length - 1]

  let dsv = 0
  for (const [hours, value] of band.breaks) {
    if (wetHours >= hours) dsv = value
    else break
  }
  return dsv
}
