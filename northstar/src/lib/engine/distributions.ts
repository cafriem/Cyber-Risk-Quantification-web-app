import type { DistributionParams } from "./types";
import type { RngFunction } from "./rng-types";

export function validateRange(min: number, mode: number, max: number): void {
  if (
    ![min, mode, max].every(Number.isFinite) ||
    min < 0 ||
    mode < min ||
    max < mode
  ) {
    throw new RangeError(
      "Distribution range must satisfy 0 <= min <= mode <= max.",
    );
  }
}

export function sampleTriangular(
  min: number,
  mode: number,
  max: number,
  rng: RngFunction,
): number {
  validateRange(min, mode, max);
  if (max <= min) return min;
  const split = (mode - min) / (max - min);
  const roll = rng();
  return roll < split
    ? min + Math.sqrt(roll * (max - min) * (mode - min))
    : max - Math.sqrt((1 - roll) * (max - min) * (max - mode));
}

export function sampleNormal(
  mean: number,
  standardDeviation: number,
  rng: RngFunction,
): number {
  if (
    !Number.isFinite(mean) ||
    !Number.isFinite(standardDeviation) ||
    standardDeviation < 0
  ) {
    throw new RangeError(
      "Normal distribution requires a finite mean and non-negative standard deviation.",
    );
  }
  const first = Math.max(rng(), Number.EPSILON);
  const second = rng();
  return (
    mean +
    standardDeviation *
      Math.sqrt(-2 * Math.log(first)) *
      Math.cos(2 * Math.PI * second)
  );
}

export function sampleGamma(shape: number, rng: RngFunction): number {
  if (shape < 1) {
    return (
      sampleGamma(shape + 1, rng) *
      Math.pow(Math.max(rng(), Number.EPSILON), 1 / shape)
    );
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    const normal = sampleNormal(0, 1, rng);
    const candidate = 1 + c * normal;
    if (candidate <= 0) continue;
    const cube = candidate ** 3;
    const roll = rng();
    if (
      roll < 1 - 0.0331 * normal ** 4 ||
      Math.log(roll) < 0.5 * normal ** 2 + d * (1 - cube + Math.log(cube))
    ) {
      return d * cube;
    }
  }
}

export function sampleBeta(
  alpha: number,
  beta: number,
  rng: RngFunction,
): number {
  if (![alpha, beta].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError("PERT shape parameters must be positive.");
  }
  const left = sampleGamma(alpha, rng);
  const right = sampleGamma(beta, rng);
  return left / (left + right);
}

export function sampleDistribution(
  distribution: DistributionParams | undefined,
  rng: RngFunction,
): number {
  const type = distribution?.type ?? "triangular";
  if (type === "triangular") {
    return sampleTriangular(
      (distribution as { min: number }).min,
      (distribution as { mode: number }).mode,
      (distribution as { max: number }).max,
      rng,
    );
  }
  if (type === "uniform") {
    const min = (distribution as { min: number }).min;
    const max = (distribution as { max: number }).max;
    validateRange(min, min, max);
    return min + rng() * (max - min);
  }
  if (type === "normal") {
    return sampleNormal(
      (distribution as { mean: number }).mean,
      (distribution as { standardDeviation: number }).standardDeviation,
      rng,
    );
  }
  if (type === "lognormal") {
    const value = sampleNormal(
      (distribution as { mean: number }).mean,
      (distribution as { standardDeviation: number }).standardDeviation,
      rng,
    );
    return Math.max(0, Math.exp(value));
  }
  if (type === "pert") {
    const min = (distribution as { min: number }).min;
    const mode = (distribution as { mode: number }).mode;
    const max = (distribution as { max: number }).max;
    validateRange(min, mode, max);
    if (max === min) return min;
    const lambda = (distribution as { lambda?: number }).lambda ?? 4;
    const range = max - min;
    const alpha = 1 + (lambda * (mode - min)) / range;
    const beta = 1 + (lambda * (max - mode)) / range;
    return min + sampleBeta(alpha, beta, rng) * range;
  }
  throw new RangeError(`Unsupported distribution type: ${type}`);
}
