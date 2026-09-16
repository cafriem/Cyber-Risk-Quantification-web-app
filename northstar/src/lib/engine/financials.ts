import type { FinancialAnalysis, MonteCarloResult } from "./types";

export function calculateFinancials(
  before: MonteCarloResult,
  after: MonteCarloResult,
  implementationCost: number,
  annualCost: number,
): FinancialAnalysis {
  const reduction = before.mean - after.mean;
  const firstYearCost = implementationCost + annualCost;
  return {
    reduction,
    firstYearCost,
    annualBenefit: reduction - annualCost,
    firstYearRoi: firstYearCost
      ? ((reduction - firstYearCost) / firstYearCost) * 100
      : 0,
    ongoingRoi: annualCost
      ? ((reduction - annualCost) / annualCost) * 100
      : 0,
    paybackMonths:
      reduction > 0 ? (implementationCost / reduction) * 12 : null,
  };
}

export interface MultiYearAnalysis {
  years: number;
  costWithoutTreatment: number;
  costWithTreatment: number;
  cumulativeSavings: number;
  netBenefit: number;
  cumulativeRoi: number;
}

export function calculateMultiYearAnalysis(
  inherentMean: number,
  residualMean: number,
  implementationCost: number,
  annualCost: number,
  years: number,
): MultiYearAnalysis {
  const annualReduction = inherentMean - residualMean;
  const costWithoutTreatment = inherentMean * years;
  const costWithTreatment = residualMean * years + implementationCost + annualCost * years;
  const cumulativeSavings = costWithoutTreatment - costWithTreatment;
  const netBenefit = annualReduction * years - implementationCost - annualCost * years;
  const totalTreatmentCost = implementationCost + annualCost * years;
  const cumulativeRoi = totalTreatmentCost
    ? ((annualReduction * years - totalTreatmentCost) / totalTreatmentCost) * 100
    : 0;
  return {
    years,
    costWithoutTreatment,
    costWithTreatment,
    cumulativeSavings,
    netBenefit,
    cumulativeRoi,
  };
}

export interface MultiYearBreakdown {
  years: number;
  withoutTreatment: number[];
  withTreatment: number[];
  cumulativeSavings: number[];
  netBenefit: number[];
}

export function calculateMultiYearBreakdown(
  inherentMean: number,
  residualMean: number,
  implementationCost: number,
  annualCost: number,
  years: number,
): MultiYearBreakdown {
  const withoutTreatment: number[] = [];
  const withTreatment: number[] = [];
  const cumulativeSavings: number[] = [];
  const netBenefit: number[] = [];

  let cumulativeWithout = 0;
  let cumulativeWith = implementationCost;
  let cumulativeReduction = 0;

  for (let year = 1; year <= years; year++) {
    cumulativeWithout += inherentMean;
    cumulativeWith += residualMean + annualCost;
    cumulativeReduction += inherentMean - residualMean - annualCost;
    withoutTreatment.push(cumulativeWithout);
    withTreatment.push(cumulativeWith);
    cumulativeSavings.push(cumulativeWithout - cumulativeWith);
    netBenefit.push(cumulativeReduction);
  }

  return { years, withoutTreatment, withTreatment, cumulativeSavings, netBenefit };
}
