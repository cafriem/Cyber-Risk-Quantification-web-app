import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/prisma";
import { requireRiskAccess } from "@/lib/auth/guard";
import { runMonteCarlo, calculateFinancials } from "@/lib/engine";
import type { TriangularParams, UniformParams, NormalParams, LognormalParams, PertParams } from "@/lib/engine";
import { TreatmentComparison } from "@/components/charts/treatment-comparison";
import { formatMoney } from "@/components/money";

function toDistributionParams(record: {
  type: string;
  min: number | null;
  mode: number | null;
  max: number | null;
  mean: number | null;
  standardDeviation: number | null;
  lambda: number | null;
}) {
  switch (record.type) {
    case "UNIFORM":
      return { type: "uniform", min: record.min ?? 0, max: record.max ?? 0 } as UniformParams;
    case "NORMAL":
      return { type: "normal", mean: record.mean ?? 0, standardDeviation: record.standardDeviation ?? 0 } as NormalParams;
    case "LOGNORMAL":
      return { type: "lognormal", mean: record.mean ?? 0, standardDeviation: record.standardDeviation ?? 0 } as LognormalParams;
    case "PERT":
      return { type: "pert", min: record.min ?? 0, mode: record.mode ?? 0, max: record.max ?? 0, lambda: record.lambda ?? 4 } as PertParams;
    default:
      return { type: "triangular", min: record.min ?? 0, mode: record.mode ?? 0, max: record.max ?? 0 } as TriangularParams;
  }
}

const ITERATIONS = 10000;
const SEED = 42;

export default async function TreatmentSimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireRiskAccess(id, "risk:read");
  if (!guard.ok) notFound();

  const risk = guard.risk as { name: string };
  const distributions = await db.orm.Distribution.where({ riskScenarioId: id }).all() as never[];
  const treatments = await db.orm.Treatment.where({ riskScenarioId: id }).all() as never[];

  const tefRecord = (distributions as { target: string }[]).find((d) => d.target === "tef");
  const vulnRecord = (distributions as { target: string }[]).find((d) => d.target === "vulnerability");
  const lossRecord = (distributions as { target: string }[]).find((d) => d.target === "loss");

  if (!tefRecord || !vulnRecord || !lossRecord) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-zinc-500">Define distributions before running the treatment simulator.</p>
        <Link href={`/risks/${id}`} className="mt-3 inline-block text-sm text-blue-600 hover:underline">← Back to Risk</Link>
      </div>
    );
  }

  const baseInput = {
    tef: toDistributionParams(tefRecord as never),
    vulnerability: toDistributionParams(vulnRecord as never),
    loss: toDistributionParams(lossRecord as never),
    iterations: ITERATIONS,
    seed: SEED,
  };

  const inherent = runMonteCarlo(baseInput);

  const results: Record<string, { mean: number; p90: number }> = {};
  for (const t of treatments as never[]) {
    const treatment = t as { id: string; tefReduction: number | null; vulnerabilityReduction: number | null; lossReduction: number | null };
    const residual = runMonteCarlo({
      ...baseInput,
      treatment: {
        tefReduction: treatment.tefReduction ?? undefined,
        vulnerabilityReduction: treatment.vulnerabilityReduction ?? undefined,
        lossReduction: treatment.lossReduction ?? undefined,
      },
    });
    results[treatment.id] = { mean: residual.mean, p90: residual.p90 };
  }

  const bestTreatment = (treatments as { id: string; name: string; implementationCost: number; annualCost: number }[])
    .map((t) => {
      const after = results[t.id];
      if (!after) return null;
      const financials = calculateFinancials(
        { mean: inherent.mean } as never,
        { mean: after.mean } as never,
        t.implementationCost,
        t.annualCost,
      );
      return { ...t, financials };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => b.financials.firstYearRoi - a.financials.firstYearRoi)[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={`/risks/${id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">← {risk.name}</Link>
        <h1 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">Treatment Simulator</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {ITERATIONS.toLocaleString()} iterations, seed {SEED} — same seed for all runs (controlled comparison)
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Treatment Comparison</h2>
        <TreatmentComparison
          treatments={treatments as never}
          inherent={{ mean: inherent.mean, p90: inherent.p90 }}
          results={results}
        />
      </section>

      {bestTreatment && (
        <section className="rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950">
          <h2 className="text-sm font-semibold text-green-800 dark:text-green-300">
            Recommended: {bestTreatment.name}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase text-green-600 dark:text-green-400">Risk Reduction</p>
              <p className="font-mono text-sm font-bold text-green-800 dark:text-green-200">{formatMoney(bestTreatment.financials.reduction, true)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-green-600 dark:text-green-400">First-Year ROI</p>
              <p className="font-mono text-sm font-bold text-green-800 dark:text-green-200">{bestTreatment.financials.firstYearRoi.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-green-600 dark:text-green-400">Payback</p>
              <p className="font-mono text-sm font-bold text-green-800 dark:text-green-200">
                {bestTreatment.financials.paybackMonths ? `${bestTreatment.financials.paybackMonths.toFixed(1)} mo` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-green-600 dark:text-green-400">Net Annual Benefit</p>
              <p className="font-mono text-sm font-bold text-green-800 dark:text-green-200">{formatMoney(bestTreatment.financials.annualBenefit, true)}</p>
            </div>
          </div>
        </section>
      )}

      {treatments.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No treatments defined yet. Add treatments via the API to compare them here.</p>
      )}
    </div>
  );
}
