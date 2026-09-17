import { calculateFinancials } from "@/lib/engine";

export interface ReportRisk {
  id: string;
  name: string;
  category: string;
  simulations: {
    inherent: boolean;
    mean: number;
    p90: number;
    p95: number;
    createdAt: string;
  }[];
  treatments: {
    id: string;
    name: string;
    implementationCost: number;
    annualCost: number;
    residual?: { mean: number; p90: number };
  }[];
}

export interface ReportData {
  organizationName: string;
  generatedAt: string;
  analyzedScenarios: number;
  totalEal: number;
  residualEal: number;
  firstYearInvestment: number;
  ongoingInvestment: number;
  annualSavings: number;
  portfolioRoi: number;
  topRisks: {
    id: string;
    name: string;
    category: string;
    mean: number;
    p90: number;
    p95: number;
    recommendation?: string;
    treatmentCost?: number;
    residualMean?: number;
    financials?: {
      firstYearCost: number;
      annualBenefit: number;
      firstYearRoi: number;
      ongoingRoi: number;
      paybackMonths: number | null;
    };
  }[];
  assumptions: string[];
  methodology: string;
}

export function generateReportData(
  organizationName: string,
  risks: ReportRisk[],
): ReportData {
  const latestInherentByRisk = new Map<string, ReportRisk["simulations"][number]>();
  for (const risk of risks) {
    const inherent = risk.simulations
      .filter((simulation) => simulation.inherent)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (inherent) latestInherentByRisk.set(risk.id, inherent);
  }

  const recommendations = risks.flatMap((risk) => {
    const inherent = latestInherentByRisk.get(risk.id);
    if (!inherent) return [];

    const scored = risk.treatments
      .filter((treatment) => treatment.residual)
      .map((treatment) => ({
        risk,
        treatment,
        financials: calculateFinancials(
          { mean: inherent.mean } as never,
          { mean: treatment.residual!.mean } as never,
          treatment.implementationCost,
          treatment.annualCost,
        ),
      }))
      .sort((a, b) => b.financials.firstYearRoi - a.financials.firstYearRoi);

    return scored.slice(0, 1).map(({ risk: riskItem, treatment, financials }) => ({
      id: riskItem.id,
      name: riskItem.name,
      category: riskItem.category,
      mean: inherent.mean,
      p90: inherent.p90,
      p95: inherent.p95,
      recommendation: treatment.name,
      treatmentCost: treatment.implementationCost + treatment.annualCost,
      residualMean: treatment.residual!.mean,
      financials,
    }));
  });

  const analyzed = [...latestInherentByRisk.values()];
  const totalEal = analyzed.reduce((sum, simulation) => sum + simulation.mean, 0);
  const residualEal = recommendations.reduce((sum, item) => sum + item.residualMean, 0);
  const firstYearInvestment = recommendations.reduce(
    (sum, item) => sum + item.financials.firstYearCost,
    0,
  );
  const ongoingInvestment = recommendations.reduce(
    (sum, item) => sum + item.treatmentCost! - item.financials.firstYearCost,
    0,
  );
  const annualSavings = recommendations.reduce(
    (sum, item) => sum + item.financials.annualBenefit,
    0,
  );

  return {
    organizationName: organizationName || "Your organization",
    generatedAt: new Date().toISOString(),
    analyzedScenarios: analyzed.length,
    totalEal,
    residualEal,
    firstYearInvestment,
    ongoingInvestment,
    annualSavings,
    portfolioRoi: firstYearInvestment > 0 ? ((annualSavings - ongoingInvestment) / firstYearInvestment) * 100 : 0,
    topRisks: recommendations.sort((a, b) => b.mean - a.mean).slice(0, 10),
    assumptions: [
      "Simulation results are estimates based on the probability distributions provided.",
      "Treatment effects are applied as percentage reductions to their affected FAIR parameters.",
      "Annual costs are treated as ongoing expenses; implementation costs are first-year expenses.",
      "Portfolio figures assume risks are independent and do not model correlated loss events.",
    ],
    methodology:
      "The platform follows a FAIR-inspired model. Monte Carlo simulation samples threat event frequency and vulnerability to estimate loss event frequency, then multiplies each loss event by sampled loss magnitude. Treatment effects modify one or more of those parameters to produce residual risk.",
  };
}
