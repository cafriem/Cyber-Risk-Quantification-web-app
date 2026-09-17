import { describe, expect, it } from "vitest";
import { generateReportData } from "../reports";
import type { ReportRisk } from "../reports";

describe("generateReportData", () => {
  it("calculates residual risk, investment, savings, and ROI", () => {
    const risks: ReportRisk[] = [
      {
        id: "risk-1",
        name: "Ransomware",
        category: "Ransomware",
        simulations: [{ inherent: true, mean: 500000, p90: 800000, p95: 900000, createdAt: "2026-01-01T00:00:00Z" }],
        treatments: [
          {
            id: "treatment-1",
            name: "EDR",
            implementationCost: 100000,
            annualCost: 20000,
            residual: { mean: 300000, p90: 500000 },
          },
        ],
      },
      {
        id: "risk-2",
        name: "Data Breach",
        category: "Breach",
        simulations: [{ inherent: true, mean: 200000, p90: 300000, p95: 350000, createdAt: "2026-01-01T00:00:00Z" }],
        treatments: [
          {
            id: "treatment-2",
            name: "MFA",
            implementationCost: 20000,
            annualCost: 5000,
            residual: { mean: 100000, p90: 200000 },
          },
        ],
      },
    ];

    const report = generateReportData("Test Org", risks);

    expect(report.analyzedScenarios).toBe(2);
    expect(report.totalEal).toBe(700000);
    expect(report.residualEal).toBe(400000);
    expect(report.annualSavings).toBe(275000);
    expect(report.portfolioRoi).toBeGreaterThan(0);
    expect(report.topRisks[0].recommendation).toBe("EDR");
  });
});
