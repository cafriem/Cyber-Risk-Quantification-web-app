import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinancials, createRng, percentile, runMonteCarlo, sampleDistribution } from './engine.js';

test('seeded random sampling is reproducible', () => {
  const first = runMonteCarlo({ tef: { min: 1, mode: 2, max: 4 }, vulnerability: { min: .1, mode: .2, max: .4 }, loss: { min: 10, mode: 20, max: 40 }, iterations: 100, seed: 9 });
  const second = runMonteCarlo({ tef: { min: 1, mode: 2, max: 4 }, vulnerability: { min: .1, mode: .2, max: .4 }, loss: { min: 10, mode: 20, max: 40 }, iterations: 100, seed: 9 });
  assert.deepEqual(first.losses, second.losses);
});

test('supported distributions return finite values within expected bounds', () => {
  const rng = createRng(12);
  assert.ok(sampleDistribution({ type: 'uniform', min: 10, max: 20 }, rng) >= 10);
  assert.ok(sampleDistribution({ type: 'triangular', min: 10, mode: 15, max: 20 }, rng).between === undefined);
  assert.ok(sampleDistribution({ type: 'pert', min: 10, mode: 15, max: 20 }, rng) >= 10);
  assert.ok(Number.isFinite(sampleDistribution({ type: 'normal', mean: 10, standardDeviation: 2 }, rng)));
  assert.ok(sampleDistribution({ type: 'lognormal', mean: 2, standardDeviation: .2 }, rng) > 0);
});

test('percentiles interpolate and invalid ranges fail loudly', () => {
  assert.equal(percentile([0, 10, 20, 30], .5), 15);
  assert.throws(() => sampleDistribution({ type: 'triangular', min: 5, mode: 2, max: 10 }, createRng()), RangeError);
});

test('treatment reduction lowers expected loss and financials calculate ROI', () => {
  const input = { tef: { min: 5, mode: 10, max: 20 }, vulnerability: { min: .1, mode: .2, max: .4 }, loss: { min: 100, mode: 200, max: 500 }, iterations: 500, seed: 3 };
  const before = runMonteCarlo(input);
  const after = runMonteCarlo({ ...input, treatment: { lossReduction: .5 } });
  const financials = calculateFinancials(before, after, 100, 20);
  assert.ok(after.mean < before.mean);
  assert.ok(financials.reduction > 0);
  assert.equal(financials.firstYearCost, 120);
});