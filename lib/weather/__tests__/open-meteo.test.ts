/**
 * Open-Meteo parser tests — the three documented traps, exercised with fixtures (no network).
 * These guard the most bug-prone seam: turning Open-Meteo's shape-shifting JSON into a clean series.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOpenMeteoResponse, alignFromDate, WeatherError } from '../open-meteo'

function block(lat: number, lon: number, times: string[]) {
  return {
    latitude: lat,
    longitude: lon,
    hourly: {
      time: times,
      temperature_2m: times.map(() => 15),
      relative_humidity_2m: times.map(() => 92),
      dew_point_2m: times.map(() => 13),
      precipitation: times.map(() => 0),
    },
  }
}

// Trap #1a: a SINGLE coordinate comes back as an OBJECT, not an array.
test('single-coord response (object) is normalised to one series', () => {
  const data = block(27.4, 79.6, ['2026-12-18T00:00', '2026-12-18T01:00'])
  const out = parseOpenMeteoResponse(data, [[27.4, 79.6]])
  assert.equal(out.length, 1)
  assert.equal(out[0].lat, 27.4)
  assert.equal(out[0].temperature.length, 2)
})

// Trap #1b: multiple coords come back as an ARRAY, in order.
test('multi-coord response (array) maps one series per coord, in order', () => {
  const data = [block(27.34, 79.52, ['2026-12-18T00:00']), block(27.53, 79.71, ['2026-12-18T00:00'])]
  const out = parseOpenMeteoResponse(data, [[27.34, 79.52], [27.53, 79.71]])
  assert.equal(out.length, 2)
  assert.equal(out[1].lon, 79.71)
})

test('block-count mismatch is a clear shape error', () => {
  const data = [block(27.4, 79.6, ['2026-12-18T00:00'])]
  assert.throws(() => parseOpenMeteoResponse(data, [[27.4, 79.6], [27.5, 79.7]]), (e: unknown) => e instanceof WeatherError && e.kind === 'shape')
})

// Trap #3: reject when the grid snaps the coordinate too far from the request.
test('a coordinate snapped beyond tolerance is rejected, not silently used', () => {
  const data = block(27.9, 79.6, ['2026-12-18T00:00']) // 0.5° off the requested 27.4
  assert.throws(() => parseOpenMeteoResponse(data, [[27.4, 79.6]]), (e: unknown) => e instanceof WeatherError && e.kind === 'snap')
})

test('missing hourly variables is a clear shape error, never a guess', () => {
  const bad = { latitude: 27.4, longitude: 79.6, hourly: { time: ['2026-12-18T00:00'] } }
  assert.throws(() => parseOpenMeteoResponse(bad, [[27.4, 79.6]]), (e: unknown) => e instanceof WeatherError && e.kind === 'shape')
})

// Trap #2: past_days shifts the origin; index 0 is NOT today. alignFromDate trims to today onward.
test('alignFromDate trims past_days so day[0] is today', () => {
  const times = [
    '2026-12-16T00:00', '2026-12-16T23:00', // past_days = 2
    '2026-12-17T00:00', '2026-12-17T23:00',
    '2026-12-18T00:00', '2026-12-18T01:00', // today
  ]
  const [series] = parseOpenMeteoResponse(block(27.4, 79.6, times), [[27.4, 79.6]])
  const aligned = alignFromDate(series, '2026-12-18')
  assert.equal(aligned.times[0], '2026-12-18T00:00')
  assert.equal(aligned.times.length, 2)
  assert.equal(aligned.temperature.length, 2)
  assert.equal(aligned.dewPoint?.length, 2)
})
