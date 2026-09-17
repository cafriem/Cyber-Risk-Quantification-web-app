import { describe, expect, it } from "vitest";
import { calculatePortfolioAnalytics } from "../portfolio";

describe("calculatePortfolioAnalytics", () => {
  it("returns empty analytics when no simulated risks exist", () => {
    const result = calculatePortfolioAnalytics([
      { id: "one", name: "One", category: "Ransomware", annualLosses: [] },
    ]);

    expect(result.totalEal).toBe(0);
    expect(result.topRisks).toEqual([]);
    expect(result.categoryExposure).toEqual([]);
    expect(result.simulatedTotal.mean).toBe(0);
  });

  it("combines independent risks and computes portfolio percentiles", () => {
    const result = calculatePortfolioAnalytics(
      [
        { id: "one", name: "One", category: "Ransomware", annualLosses: [100000, 200000, 300000] },
        { id: "two", name: "Two", category: "Data Breach", annualLosses: [50000, 100000, 150000] },
      ],
      5000,
    );

    expect(result.totalEal).toBe(300000);
    expect(result.totalP90).toBe(420000);
    expect(result.topRisks[0].id).toBe("one");
    expect(result.categoryExposure).toHaveLength(2);
    expect(result.simulatedTotal.mean).toBeGreaterThan(100000);
    expect(result.simulatedTotal.p90).toBeGreaterThanOrEqual(result.simulatedTotal.mean);
  });
});
