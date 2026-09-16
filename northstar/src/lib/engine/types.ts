export interface TriangularParams {
  type: "triangular";
  min: number;
  mode: number;
  max: number;
}

export interface UniformParams {
  type: "uniform";
  min: number;
  max: number;
}

export interface NormalParams {
  type: "normal";
  mean: number;
  standardDeviation: number;
}

export interface LognormalParams {
  type: "lognormal";
  mean: number;
  standardDeviation: number;
}

export interface PertParams {
  type: "pert";
  min: number;
  mode: number;
  max: number;
  lambda?: number;
}

export type DistributionParams =
  | TriangularParams
  | UniformParams
  | NormalParams
  | LognormalParams
  | PertParams;

export type DistributionType = DistributionParams["type"];

export interface TreatmentEffect {
  tefReduction?: number;
  vulnerabilityReduction?: number;
  lossReduction?: number;
}

export interface CapabilityVsResistance {
  capability: DistributionParams;
  resistance: DistributionParams;
}

export interface SimulationInput {
  tef: DistributionParams;
  vulnerability: DistributionParams;
  loss: DistributionParams;
  iterations?: number;
  seed?: number;
  treatment?: TreatmentEffect;
}

export interface HistogramBucket {
  x: number;
  count: number;
}

export interface SummaryStatistics {
  mean: number;
  median: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  histogram: HistogramBucket[];
}

export interface MonteCarloResult extends SummaryStatistics {
  losses: number[];
  iterations: number;
}

export interface FinancialAnalysis {
  reduction: number;
  firstYearCost: number;
  annualBenefit: number;
  firstYearRoi: number;
  ongoingRoi: number;
  paybackMonths: number | null;
}
