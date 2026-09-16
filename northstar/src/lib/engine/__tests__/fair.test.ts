import { describe, it, expect } from "vitest";
import {
  createRng,
  calculateThreatEventFrequency,
  calculateVulnerability,
  calculateLossEventFrequency,
  calculateLossMagnitude,
  calculateAnnualLoss,
  calculateMultiYearBreakdown,
  runMonteCarlo,
} from "../index";

describe("calculateThreatEventFrequency", () => {
  it("returns sampled values within bounds", () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const value = calculateThreatEventFrequency(
        { type: "triangular", min: 5, mode: 15, max: 40 },
        rng,
      );
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(40);
    }
  });
});

describe("calculateVulnerability", () => {
  it("returns direct vulnerability clamped to [0, 1]", () => {
    const rng = createRng(42);
    const value = calculateVulnerability(
      { direct: { type: "triangular", min: 0.1, mode: 0.2, max: 0.4 } },
      rng,
    );
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  it("resolves capability vs. resistance into [0, 1]", () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const value = calculateVulnerability(
        {
          capability: { type: "triangular", min: 20, mode: 50, max: 80 },
          resistance: { type: "triangular", min: 30, mode: 60, max: 90 },
        },
        rng,
      );
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("returns 0 when resistance is 100 and capability is 0", () => {
    const rng = createRng(42);
    const value = calculateVulnerability(
      {
        capability: { type: "triangular", min: 0, mode: 0, max: 0 },
        resistance: { type: "triangular", min: 100, mode: 100, max: 100 },
      },
      rng,
    );
    expect(value).toBe(0);
  });
});

describe("calculateLossEventFrequency", () => {
  it("computes LEF = TEF × Vulnerability", () => {
    expect(calculateLossEventFrequency(10, 0.2)).toBe(2);
    expect(calculateLossEventFrequency(0, 0.5)).toBe(0);
    expect(calculateLossEventFrequency(100, 0)).toBe(0);
  });
});

describe("calculateLossMagnitude", () => {
  const components = [
    {
      name: "Productivity",
      category: "primary" as const,
      distribution: { type: "triangular" as const, min: 1000, mode: 5000, max: 10000 },
      enabled: true,
    },
    {
      name: "Legal",
      category: "secondary" as const,
      distribution: { type: "triangular" as const, min: 2000, mode: 8000, max: 20000 },
      enabled: true,
    },
    {
      name: "Notification",
      category: "secondary" as const,
      distribution: { type: "triangular" as const, min: 500, mode: 2000, max: 5000 },
      enabled: false,
    },
  ];

  it("sums only enabled components", () => {
    const rng = createRng(42);
    const result = calculateLossMagnitude(components, rng);
    expect(result.total).toBe(result.primary + result.secondary);
    expect(result.primary).toBeGreaterThan(0);
    expect(result.secondary).toBeGreaterThan(0);
  });

  it("returns zero when all components disabled", () => {
    const rng = createRng(42);
    const disabled = components.map((c) => ({ ...c, enabled: false }));
    const result = calculateLossMagnitude(disabled, rng);
    expect(result.total).toBe(0);
  });
});

describe("calculateAnnualLoss", () => {
  it("computes annual loss = LEF × LM", () => {
    expect(calculateAnnualLoss(2, 100000)).toBe(200000);
    expect(calculateAnnualLoss(0, 500000)).toBe(0);
  });
});

describe("calculateMultiYearBreakdown", () => {
  it("produces arrays of correct length", () => {
    const result = calculateMultiYearBreakdown(420000, 110000, 30000, 8000, 5);
    expect(result.withoutTreatment).toHaveLength(5);
    expect(result.withTreatment).toHaveLength(5);
    expect(result.cumulativeSavings).toHaveLength(5);
    expect(result.netBenefit).toHaveLength(5);
  });

  it("without-treatment grows linearly", () => {
    const result = calculateMultiYearBreakdown(420000, 110000, 30000, 8000, 5);
    expect(result.withoutTreatment[0]).toBe(420000);
    expect(result.withoutTreatment[4]).toBe(2100000);
  });

  it("with-treatment includes implementation cost in year 1", () => {
    const result = calculateMultiYearBreakdown(420000, 110000, 30000, 8000, 5);
    expect(result.withTreatment[0]).toBe(30000 + 110000 + 8000);
  });

  it("cumulative savings grows over time", () => {
    const result = calculateMultiYearBreakdown(420000, 110000, 30000, 8000, 5);
    for (let i = 1; i < result.cumulativeSavings.length; i++) {
      expect(result.cumulativeSavings[i]).toBeGreaterThanOrEqual(result.cumulativeSavings[i - 1]);
    }
  });
});

describe("runMonteCarlo with loss components", () => {
  const baseInput = {
    tef: { type: "triangular" as const, min: 1, mode: 2, max: 4 },
    vulnerability: { type: "triangular" as const, min: 0.1, mode: 0.2, max: 0.4 },
    loss: { type: "triangular" as const, min: 10, mode: 20, max: 40 },
  };

  it("supports loss component breakdown", () => {
    const result = runMonteCarlo({
      ...baseInput,
      iterations: 500,
      seed: 42,
      lossComponents: [
        { name: "Productivity", category: "primary", distribution: { type: "triangular", min: 100, mode: 500, max: 1000 }, enabled: true },
        { name: "Legal", category: "secondary", distribution: { type: "triangular", min: 200, mode: 800, max: 2000 }, enabled: true },
      ],
    });
    expect(result.losses.every(Number.isFinite)).toBe(true);
    expect(result.mean).toBeGreaterThan(0);
  });

  it("supports capability vs. resistance vulnerability", () => {
    const result = runMonteCarlo({
      ...baseInput,
      iterations: 500,
      seed: 42,
      capabilityVsResistance: {
        capability: { type: "triangular", min: 20, mode: 50, max: 80 },
        resistance: { type: "triangular", min: 30, mode: 60, max: 90 },
      },
    });
    expect(result.losses.every(Number.isFinite)).toBe(true);
    expect(result.mean).toBeGreaterThan(0);
  });
});
