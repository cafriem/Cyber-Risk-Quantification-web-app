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
  validateRange(min, mode, max);
  if (max <= min) return min;
  const split = (mode - min) / (max - min);
  const roll = rng();
  return roll < split
    ? min + Math.sqrt(roll * (max - min) * (mode - min))
    : max - Math.sqrt((1 - roll) * (max - min) * (max - mode));
}

function validateRange(min, mode, max) {
  if (![min, mode, max].every(Number.isFinite) || min < 0 || mode < min || max < mode) {
    throw new RangeError('Distribution range must satisfy 0 <= min <= mode <= max.');
  }
}

function sampleNormal(mean, standardDeviation, rng) {
  if (!Number.isFinite(mean) || !Number.isFinite(standardDeviation) || standardDeviation < 0) {
    throw new RangeError('Normal distribution requires a finite mean and non-negative standard deviation.');
  }
  const first = Math.max(rng(), Number.EPSILON);
  const second = rng();
  return mean + standardDeviation * Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function sampleGamma(shape, rng) {
  if (shape < 1) return sampleGamma(shape + 1, rng) * Math.pow(Math.max(rng(), Number.EPSILON), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    const normal = sampleNormal(0, 1, rng);
    const candidate = 1 + c * normal;
    if (candidate <= 0) continue;
    const cube = candidate ** 3;
    const roll = rng();
    if (roll < 1 - 0.0331 * normal ** 4 || Math.log(roll) < 0.5 * normal ** 2 + d * (1 - cube + Math.log(cube))) return d * cube;
  }
}

function sampleBeta(alpha, beta, rng) {
  if (![alpha, beta].every((value) => Number.isFinite(value) && value > 0)) throw new RangeError('PERT shape parameters must be positive.');
  const left = sampleGamma(alpha, rng);
  const right = sampleGamma(beta, rng);
  return left / (left + right);
}

export function sampleDistribution(distribution, rng) {
  const type = distribution?.type || 'triangular';
  if (type === 'triangular') return sampleTriangular(distribution.min, distribution.mode, distribution.max, rng);
  if (type === 'uniform') {
    validateRange(distribution.min, distribution.min, distribution.max);
    return distribution.min + rng() * (distribution.max - distribution.min);
  }
  if (type === 'normal') return sampleNormal(distribution.mean, distribution.standardDeviation, rng);
  if (type === 'lognormal') {
    const value = sampleNormal(distribution.mean, distribution.standardDeviation, rng);
    return Math.max(0, Math.exp(value));
  }
  if (type === 'pert') {
    validateRange(distribution.min, distribution.mode, distribution.max);
    if (distribution.max === distribution.min) return distribution.min;
    const lambda = distribution.lambda || 4;
    const range = distribution.max - distribution.min;
    const alpha = 1 + lambda * (distribution.mode - distribution.min) / range;
    const beta = 1 + lambda * (distribution.max - distribution.mode) / range;
    return distribution.min + sampleBeta(alpha, beta, rng) * range;
  }
  throw new RangeError(`Unsupported distribution type: ${type}`);
}

export function percentile(values, p) {
  if (!values.length || p < 0 || p > 1) throw new RangeError('Percentile requires values and p between 0 and 1.');
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
  if (!values.length) throw new RangeError('Cannot summarize an empty simulation.');
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
    const frequency = sampleDistribution(tef, rng) * tefFactor;
    const success = sampleDistribution(vulnerability, rng) * vulnerabilityFactor;
    const magnitude = sampleDistribution(loss, rng) * lossFactor;
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
