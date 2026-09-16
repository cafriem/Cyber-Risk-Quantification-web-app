// FAIR-inspired calculation engine. UI code consumes these pure functions.
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function createRng(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function sampleTriangular(min, mode, max, rng) {
  if (max <= min) return min;
  const split = (mode - min) / (max - min);
  const roll = rng();
  return roll < split
    ? min + Math.sqrt(roll * (max - min) * (mode - min))
    : max - Math.sqrt((1 - roll) * (max - min) * (max - mode));
}

export function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function histogram(values, buckets = 28) {
  const max = Math.max(...values, 1);
  const step = max / buckets;
  const counts = Array.from({ length: buckets }, () => 0);
  values.forEach((value) => counts[Math.min(buckets - 1, Math.floor(value / step))]++);
  return counts.map((count, index) => ({ x: index * step, count }));
}

export function summarize(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    mean: total / values.length,
    median: percentile(values, 0.5),
    p75: percentile(values, 0.75),
    p90: percentile(values, 0.9),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    max: Math.max(...values),
    histogram: histogram(values),
  };
}

export function runMonteCarlo({ tef, vulnerability, loss, iterations = 100000, seed = 42, treatment = {} }) {
  const rng = createRng(seed);
  const losses = [];
  const tefFactor = 1 - (treatment.tefReduction || 0);
  const vulnerabilityFactor = 1 - (treatment.vulnerabilityReduction || 0);
  const lossFactor = 1 - (treatment.lossReduction || 0);
  const count = Math.min(iterations, 250000);
  for (let i = 0; i < count; i++) {
    const frequency = sampleTriangular(tef.min, tef.mode, tef.max, rng) * tefFactor;
    const success = sampleTriangular(vulnerability.min, vulnerability.mode, vulnerability.max, rng) * vulnerabilityFactor;
    const magnitude = sampleTriangular(loss.min, loss.mode, loss.max, rng) * lossFactor;
    losses.push(frequency * success * magnitude);
  }
  return { ...summarize(losses), losses, iterations: count };
}

export function exceedanceProbability(losses, threshold) {
  return losses.filter((loss) => loss > threshold).length / losses.length;
}

export function calculateFinancials(before, after, implementationCost, annualCost) {
  const reduction = before.mean - after.mean;
  const firstYearCost = implementationCost + annualCost;
  return {
    reduction,
    firstYearCost,
    annualBenefit: reduction - annualCost,
    firstYearRoi: firstYearCost ? ((reduction - firstYearCost) / firstYearCost) * 100 : 0,
    ongoingRoi: annualCost ? ((reduction - annualCost) / annualCost) * 100 : 0,
    paybackMonths: reduction > 0 ? (implementationCost / reduction) * 12 : null,
  };
}
