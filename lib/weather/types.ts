/**
 * Shared hourly-weather shape consumed by the disease-risk engine.
 *
 * Both providers (live Open-Meteo and synthetic demo scenarios) produce this exact structure,
 * so the engine cannot tell — and must not care — where the numbers came from. That is the
 * §29.7 "one interface, >= 2 implementations" rule: swapping the source is a caller decision,
 * never an engine change.
 *
 * `dewPoint` is optional because the engine's band logic never reads it; it is carried only so
 * synthetic series stay physically self-consistent (RH and dew point agree) and so a future
 * downscaling step could recompute RH from it.
 */
export interface HourlySeries {
  /** Requested latitude (the field's own coordinate, not a snapped grid point). */
  lat: number
  /** Requested longitude. */
  lon: number
  /** ISO local times, e.g. "2026-12-18T00:00" — one entry per hour. */
  times: string[]
  /** temperature_2m, °C. */
  temperature: number[]
  /** relative_humidity_2m, %. */
  relativeHumidity: number[]
  /** precipitation, mm. */
  precipitation: number[]
  /** dew_point_2m, °C (carried for consistency; not used by band logic). */
  dewPoint?: number[]
}

/** How a series was obtained — surfaced to the UI so synthetic data can never masquerade as a forecast. */
export type DataStatus = 'live' | 'scenario'
