import { sampleDistribution } from "./distributions";
import type { RngFunction } from "./rng-types";
import type { CapabilityVsResistance, DistributionParams } from "./types";

export function calculateThreatEventFrequency(
  distribution: DistributionParams,
  rng: RngFunction,
): number {
  return sampleDistribution(distribution, rng);
}

export function calculateVulnerability(
  params: CapabilityVsResistance | { direct: DistributionParams },
  rng: RngFunction,
): number {
  if ("direct" in params) {
    return Math.min(1, Math.max(0, sampleDistribution(params.direct, rng)));
  }

  const capability = sampleDistribution(params.capability, rng);
  const resistance = sampleDistribution(params.resistance, rng);

  if (resistance >= 100) return 0;
  if (capability <= 0) return 0;

  const difference = capability - resistance;
  return Math.min(1, Math.max(0, 0.5 + difference / 200));
}

export function calculateLossEventFrequency(
  tef: number,
  vulnerability: number,
): number {
  return tef * vulnerability;
}

export interface LossComponent {
  name: string;
  category: "primary" | "secondary";
  distribution: DistributionParams;
  enabled: boolean;
}

export function calculateLossMagnitude(
  components: LossComponent[],
  rng: RngFunction,
): { total: number; primary: number; secondary: number } {
  let primary = 0;
  let secondary = 0;
  for (const component of components) {
    if (!component.enabled) continue;
    const value = sampleDistribution(component.distribution, rng);
    if (component.category === "primary") {
      primary += value;
    } else {
      secondary += value;
    }
  }
  return { total: primary + secondary, primary, secondary };
}

export function calculateAnnualLoss(
  lossEventFrequency: number,
  lossMagnitude: number,
): number {
  return lossEventFrequency * lossMagnitude;
}
