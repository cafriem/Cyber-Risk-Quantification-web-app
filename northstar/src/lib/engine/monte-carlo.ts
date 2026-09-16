import { createRng } from "./rng";
import type { RngFunction } from "./rng-types";
import { sampleDistribution } from "./distributions";
import { summarize } from "./statistics";
import {
  calculateLossEventFrequency,
  calculateLossMagnitude,
  calculateAnnualLoss,
  calculateVulnerability,
} from "./fair";
import type {
  LossComponent,
} from "./fair";
import type {
  MonteCarloResult,
  SimulationInput,

  CapabilityVsResistance,
} from "./types";

export interface ExtendedSimulationInput extends SimulationInput {
  lossComponents?: LossComponent[];
  capabilityVsResistance?: CapabilityVsResistance;
}

export function runMonteCarlo(input: ExtendedSimulationInput): MonteCarloResult {
  const {
    tef,
    vulnerability,
    loss,
    iterations = 100000,
    seed = 42,
    treatment = {},
  } = input;
  const rng: RngFunction = createRng(seed);
  const losses: number[] = [];
  const tefFactor = 1 - (treatment.tefReduction ?? 0);
  const vulnerabilityFactor = 1 - (treatment.vulnerabilityReduction ?? 0);
  const lossFactor = 1 - (treatment.lossReduction ?? 0);
  const count = Math.min(iterations, 250000);
  for (let i = 0; i < count; i++) {
    const frequency = sampleDistribution(tef, rng) * tefFactor;
    const success = (input.capabilityVsResistance
      ? calculateVulnerability(input.capabilityVsResistance, rng)
      : sampleDistribution(vulnerability, rng)) * vulnerabilityFactor;

    const lef = calculateLossEventFrequency(frequency, success);

    if (input.lossComponents?.length) {
      const lm = calculateLossMagnitude(input.lossComponents, rng);
      const magnitude = lm.total * lossFactor;
      losses.push(calculateAnnualLoss(lef, magnitude));
    } else {
      const magnitude = sampleDistribution(loss, rng) * lossFactor;
      losses.push(calculateAnnualLoss(lef, magnitude));
    }
  }
  return { ...summarize(losses), losses, iterations: count };
}

export function exceedanceProbability(
  losses: number[],
  threshold: number,
): number {
  if (!losses.length) throw new RangeError("Cannot compute exceedance on empty data.");
  return losses.filter((loss) => loss > threshold).length / losses.length;
}
