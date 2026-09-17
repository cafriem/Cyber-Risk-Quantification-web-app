import { percentile, summarize } from "@/lib/engine";

export interface PortfolioRiskInput {
  id: string;
  name: string;
  category: string;
  annualLosses: number[];
}

export interface PortfolioAnalytics {
  totalEal: number;
  totalP90: number;
  totalP95: number;
  totalMax: number;
  topRisks: {
    id: string;
    name: string;
    category: string;
    mean: number;
    p90: number;
    p95: number;
  }[];
  categoryExposure: {
    category: string;
    expectedLoss: number;
    p90: number;
  }[];
  simulatedTotal: {
    mean: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export function calculatePortfolioAnalytics(
  risks: PortfolioRiskInput[],
  iterations = 20000,
): PortfolioAnalytics {
  const allEmpty = risks.every((risk) => risk.annualLosses.length === 0);
  if (allEmpty) {
    return {
      totalEal: 0,
      totalP90: 0,
      totalP95: 0,
      totalMax: 0,
      topRisks: [],
      categoryExposure: [],
      simulatedTotal: { mean: 0, p90: 0, p95: 0, p99: 0 },
    };
  }

  const riskStats = risks.map((risk) => {
    const stats = summarize(risk.annualLosses);
    return { ...risk, stats };
  });

  const categoryNames = [...new Set(risks.map((risk) => risk.category))].sort();
  const categoryExposure = categoryNames.map((category) => {
    const values = risks
      .filter((risk) => risk.category === category)
      .flatMap((risk) => risk.annualLosses);
    return {
      category,
      expectedLoss: values.reduce((sum, value) => sum + value, 0) / values.length,
      p90: percentile(values, 0.9),
    };
  });

  const seededRandom = (() => {
    let state = 0x4d595df4;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  })();

  const simulatedPortfolio: number[] = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let total = 0;
    for (const risk of risks) {
      if (!risk.annualLosses.length) continue;
      const index = Math.floor(seededRandom() * risk.annualLosses.length);
      total += risk.annualLosses[index];
    }
    simulatedPortfolio.push(total);
  }

  const portfolioStats = summarize(simulatedPortfolio);
  const topRisks = riskStats
    .sort((a, b) => b.stats.mean - a.stats.mean)
    .slice(0, 10)
    .map((risk) => ({
      id: risk.id,
      name: risk.name,
      category: risk.category,
      mean: risk.stats.mean,
      p90: risk.stats.p90,
      p95: risk.stats.p95,
    }));

  return {
    totalEal: riskStats.reduce((sum, risk) => sum + risk.stats.mean, 0),
    totalP90: riskStats.reduce((sum, risk) => sum + risk.stats.p90, 0),
    totalP95: riskStats.reduce((sum, risk) => sum + risk.stats.p95, 0),
    totalMax: riskStats.reduce((sum, risk) => sum + risk.stats.max, 0),
    topRisks,
    categoryExposure,
    simulatedTotal: {
      mean: portfolioStats.mean,
      p90: portfolioStats.p90,
      p95: portfolioStats.p95,
      p99: portfolioStats.p99,
    },
  };
}
