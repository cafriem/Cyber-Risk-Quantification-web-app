import type { HistogramBucket } from "./types";

export function percentile(values: number[], p: number): number {
  if (!values.length || p < 0 || p > 1) {
    throw new RangeError("Percentile requires values and p between 0 and 1.");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function histogram(values: number[], buckets = 28): HistogramBucket[] {
  if (!values.length) return [];
  let max = 0;
  for (const value of values) {
    if (value > max) max = value;
  }
  if (max === 0) max = 1;
  const step = max / buckets;
  const counts = Array.from({ length: buckets }, () => 0);
  for (const value of values) {
    const index = Math.min(buckets - 1, Math.floor(value / step));
    counts[index]++;
  }
  return counts.map((count, index) => ({
    x: index * step,
    count,
  }));
}

export interface SummaryResult {
  mean: number;
  median: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  histogram: HistogramBucket[];
}

export function summarize(values: number[]): SummaryResult {
  if (!values.length) {
    throw new RangeError("Cannot summarize an empty simulation.");
  }
  let total = 0;
  let max = values[0];
  for (const value of values) {
    total += value;
    if (value > max) max = value;
  }
  return {
    mean: total / values.length,
    median: percentile(values, 0.5),
    p75: percentile(values, 0.75),
    p90: percentile(values, 0.9),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    max,
    histogram: histogram(values),
  };
}
