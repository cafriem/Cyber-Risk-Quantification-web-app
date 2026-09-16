import { describe, it, expect } from "vitest";
import {
  createRng,
  sampleDistribution,
  sampleTriangular,
  sampleNormal,
  percentile,
  histogram,
  summarize,
  runMonteCarlo,
  exceedanceProbability,
  calculateFinancials,
  calculateMultiYearAnalysis,
} from "../index";

describe("createRng", () => {
  it("produces deterministic sequences for the same seed", () => {
    const rng1 = createRng(9);
    const rng2 = createRng(9);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    const first = rng1();
    const second = rng2();
    expect(first).not.toBe(second);
  });

  it("produces values in [0, 1)", () => {
    const rng = createRng(123);
    for (let i = 0; i < 10000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("sampleTriangular", () => {
  it("returns values within the specified range", () => {
    const rng = createRng(42);
    for (let i = 0; i < 10000; i++) {
      const value = sampleTriangular(10, 15, 20, rng);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it("returns min when max equals min", () => {
    const rng = createRng(42);
    expect(sampleTriangular(10, 10, 10, rng)).toBe(10);
  });

  it("throws for invalid ranges", () => {
    const rng = createRng(42);
    expect(() => sampleTriangular(5, 2, 10, rng)).toThrow(RangeError);
    expect(() => sampleTriangular(-1, 0, 1, rng)).toThrow(RangeError);
  });
});

describe("sampleDistribution", () => {
  it("samples uniform within bounds", () => {
    const rng = createRng(12);
    for (let i = 0; i < 1000; i++) {
      const value = sampleDistribution({ type: "uniform", min: 10, max: 20 }, rng);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it("samples triangular within bounds", () => {
    const rng = createRng(12);
    for (let i = 0; i < 1000; i++) {
      const value = sampleDistribution(
        { type: "triangular", min: 10, mode: 15, max: 20 },
        rng,
      );
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it("samples PERT within bounds", () => {
    const rng = createRng(12);
    for (let i = 0; i < 1000; i++) {
      const value = sampleDistribution(
        { type: "pert", min: 10, mode: 15, max: 20 },
        rng,
      );
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it("samples normal returning finite values", () => {
    const rng = createRng(12);
    const value = sampleDistribution(
      { type: "normal", mean: 10, standardDeviation: 2 },
      rng,
    );
    expect(Number.isFinite(value)).toBe(true);
  });

  it("samples lognormal returning positive values", () => {
    const rng = createRng(12);
    for (let i = 0; i < 1000; i++) {
      const value = sampleDistribution(
        { type: "lognormal", mean: 2, standardDeviation: 0.2 },
        rng,
      );
      expect(value).toBeGreaterThan(0);
    }
  });

  it("defaults to triangular when type is missing", () => {
    const rng = createRng(12);
    const value = sampleDistribution({ min: 10, mode: 15, max: 20 } as never, rng);
    expect(value).toBeGreaterThanOrEqual(10);
    expect(value).toBeLessThanOrEqual(20);
  });

  it("throws for unsupported distribution type", () => {
    const rng = createRng(12);
    expect(() =>
      sampleDistribution({ type: "invalid" } as never, rng),
    ).toThrow(RangeError);
  });
});

describe("sampleNormal", () => {
  it("throws for negative standard deviation", () => {
    const rng = createRng(42);
    expect(() => sampleNormal(10, -1, rng)).toThrow(RangeError);
  });

  it("throws for non-finite mean", () => {
    const rng = createRng(42);
    expect(() => sampleNormal(NaN, 1, rng)).toThrow(RangeError);
  });
});

describe("percentile", () => {
  it("interpolates correctly", () => {
    expect(percentile([0, 10, 20, 30], 0.5)).toBe(15);
  });

  it("returns min at p=0", () => {
    expect(percentile([10, 20, 30], 0)).toBe(10);
  });

  it("returns max at p=1", () => {
    expect(percentile([10, 20, 30], 1)).toBe(30);
  });

  it("throws on empty array", () => {
    expect(() => percentile([], 0.5)).toThrow(RangeError);
  });

  it("throws on invalid p", () => {
    expect(() => percentile([1, 2], -0.1)).toThrow(RangeError);
    expect(() => percentile([1, 2], 1.1)).toThrow(RangeError);
  });
});

describe("histogram", () => {
  it("returns correct bucket count", () => {
    const result = histogram([1, 2, 3, 4, 5], 5);
    expect(result).toHaveLength(5);
  });

  it("distributes values across buckets", () => {
    const values = [0.5, 1.5, 2.5, 3.5, 4.5];
    const result = histogram(values, 5);
    const total = result.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(total).toBe(values.length);
  });

  it("returns empty for empty input", () => {
    expect(histogram([], 10)).toEqual([]);
  });
});

describe("summarize", () => {
  it("computes correct statistics", () => {
    const values = [10, 20, 30, 40, 50];
    const result = summarize(values);
    expect(result.mean).toBe(30);
    expect(result.median).toBe(30);
    expect(result.max).toBe(50);
  });

  it("throws on empty array", () => {
    expect(() => summarize([])).toThrow(RangeError);
  });
});

describe("runMonteCarlo", () => {
  const input = {
    tef: { type: "triangular" as const, min: 1, mode: 2, max: 4 },
    vulnerability: { type: "triangular" as const, min: 0.1, mode: 0.2, max: 0.4 },
    loss: { type: "triangular" as const, min: 10, mode: 20, max: 40 },
  };

  it("produces identical results with same seed", () => {
    const first = runMonteCarlo({ ...input, iterations: 100, seed: 9 });
    const second = runMonteCarlo({ ...input, iterations: 100, seed: 9 });
    expect(first.losses).toEqual(second.losses);
  });

  it("produces different results with different seeds", () => {
    const first = runMonteCarlo({ ...input, iterations: 100, seed: 1 });
    const second = runMonteCarlo({ ...input, iterations: 100, seed: 2 });
    expect(first.losses[0]).not.toBe(second.losses[0]);
  });

  it("returns finite losses and valid summary", () => {
    const result = runMonteCarlo({ ...input, iterations: 500, seed: 42 });
    expect(result.losses.every(Number.isFinite)).toBe(true);
    expect(result.iterations).toBe(500);
    expect(result.mean).toBeGreaterThan(0);
    expect(result.median).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThanOrEqual(result.p99);
    expect(result.p99).toBeGreaterThanOrEqual(result.p95);
    expect(result.p95).toBeGreaterThanOrEqual(result.p90);
    expect(result.histogram.length).toBeGreaterThan(0);
  });

  it("treatment reduction lowers expected loss", () => {
    const before = runMonteCarlo({ ...input, iterations: 500, seed: 3 });
    const after = runMonteCarlo({
      ...input,
      iterations: 500,
      seed: 3,
      treatment: { lossReduction: 0.5 },
    });
    expect(after.mean).toBeLessThan(before.mean);
  });

  it("caps iterations at maximum limit", () => {
    const result = runMonteCarlo({ ...input, iterations: 500000, seed: 42 });
    expect(result.iterations).toBe(250000);
  });
});

describe("exceedanceProbability", () => {
  it("computes correct probability", () => {
    const losses = [100, 200, 300, 400, 500];
    expect(exceedanceProbability(losses, 250)).toBe(0.6);
    expect(exceedanceProbability(losses, 600)).toBe(0);
    expect(exceedanceProbability(losses, 50)).toBe(1);
  });

  it("throws on empty array", () => {
    expect(() => exceedanceProbability([], 100)).toThrow(RangeError);
  });
});

describe("calculateFinancials", () => {
  const before = { mean: 420000 } as never;
  const after = { mean: 110000 } as never;

  it("computes reduction and costs correctly", () => {
    const result = calculateFinancials(before, after, 30000, 8000);
    expect(result.reduction).toBe(310000);
    expect(result.firstYearCost).toBe(38000);
    expect(result.annualBenefit).toBe(302000);
  });

  it("computes first-year ROI", () => {
    const result = calculateFinancials(before, after, 30000, 8000);
    expect(result.firstYearRoi).toBeCloseTo(
      ((310000 - 38000) / 38000) * 100,
      5,
    );
  });

  it("computes ongoing ROI", () => {
    const result = calculateFinancials(before, after, 30000, 8000);
    expect(result.ongoingRoi).toBeCloseTo(
      ((310000 - 8000) / 8000) * 100,
      5,
    );
  });

  it("computes payback period in months", () => {
    const result = calculateFinancials(before, after, 30000, 8000);
    expect(result.paybackMonths).toBeCloseTo((30000 / 310000) * 12, 5);
  });

  it("returns null payback when no reduction", () => {
    const result = calculateFinancials({ mean: 100 } as never, { mean: 100 } as never, 30000, 8000);
    expect(result.paybackMonths).toBeNull();
  });
});

describe("calculateMultiYearAnalysis", () => {
  it("computes cumulative savings over 5 years", () => {
    const result = calculateMultiYearAnalysis(420000, 110000, 30000, 8000, 5);
    expect(result.costWithoutTreatment).toBe(2100000);
    expect(result.costWithTreatment).toBe(550000 + 30000 + 40000);
    expect(result.netBenefit).toBe(310000 * 5 - 30000 - 40000);
  });

  it("computes cumulative ROI", () => {
    const result = calculateMultiYearAnalysis(420000, 110000, 30000, 8000, 5);
    const totalCost = 30000 + 8000 * 5;
    expect(result.cumulativeRoi).toBeCloseTo(
      ((310000 * 5 - totalCost) / totalCost) * 100,
      5,
    );
  });
});
