/**
 * Hutton criterion primitives — agro-meteorological rules for late blight.
 * Faithful TypeScript port of Prahari engine/rules.py (pure, no I/O).
 *
 * References: Hutton criteria (2 consecutive days: Tmin >= 10 C and >= 6 h RH >= 90%);
 * Smith (1956); BLITECAST (Krause et al. 1975).
 */

/**
 * Count hours whose RH is at or above `threshold`.
 * The boundary is INCLUSIVE (>=). RH of exactly 90.0 counts as a wet hour.
 */
export function hoursRhAtOrAbove(rhHourly: readonly number[], threshold = 90.0): number {
  let count = 0
  for (const rh of rhHourly) {
    if (rh >= threshold) count += 1
  }
  return count
}

/**
 * Longest run of CONSECUTIVE hours at/above `threshold`.
 * Fragmented wet hours do not combine: two separate blocks of 4 give a spell of 4, never 8.
 */
export function longestWetSpellHours(rhHourly: readonly number[], threshold = 90.0): number {
  let longest = 0
  let current = 0
  for (const rh of rhHourly) {
    if (rh >= threshold) {
      current += 1
      if (current > longest) longest = current
    } else {
      current = 0
    }
  }
  return longest
}

/**
 * True when `consecutiveDays` qualifying days occur CONSECUTIVELY.
 * [true, false, true] is false (two qualifying days total but never back-to-back);
 * [true, true, false] is true. Hutton requires consecutive qualifying days, not a running total.
 */
export function criterionMet(dailyQualified: readonly boolean[], consecutiveDays = 2): boolean {
  let run = 0
  for (const qualified of dailyQualified) {
    if (qualified) {
      run += 1
      if (run >= consecutiveDays) return true
    } else {
      run = 0
    }
  }
  return false
}
