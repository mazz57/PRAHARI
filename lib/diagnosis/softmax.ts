/**
 * Numerically-stable softmax over raw logits. Pure and dependency-free so it can be unit-tested
 * directly with `node --test`. Returns probabilities that sum to 1 in the SAME order as the input.
 */
export function softmax(logits: number[]): number[] {
  if (logits.length === 0) return []
  const max = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  if (sum === 0 || !Number.isFinite(sum)) {
    // Degenerate input — fall back to a uniform distribution rather than NaNs.
    return logits.map(() => 1 / logits.length)
  }
  return exps.map((e) => e / sum)
}
