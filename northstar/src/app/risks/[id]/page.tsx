import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/prisma";
import { formatMoney } from "@/components/money";

interface DistRow {
  id: string;
  target: string;
  type: string;
  min: number | null;
  mode: number | null;
  max: number | null;
  mean: number | null;
  standardDeviation: number | null;
  lambda: number | null;
}

interface TreatmentRow {
  id: string;
  name: string;
  implementationCost: number;
  annualCost: number;
  lossReduction: number | null;
}

interface SimRow {
  id: string;
  riskScenarioId: string;
  createdAt: string;
  iterations: number;
  mean: number;
  median: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
}

interface RiskRow {
  id: string;
  riskId: string;
  name: string;
  description: string;
  asset: string;
  threatActor: string;
  threatType: string;
  status: string;
  [key: string]: unknown;
}

export default async function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const risk = await db.orm.RiskScenario.where({ id }).first() as unknown as RiskRow | undefined;

  if (!risk) {
    notFound();
  }

  const distributions = await db.orm.Distribution.where({ riskScenarioId: id }).all() as unknown as DistRow[];
  const treatments = await db.orm.Treatment.where({ riskScenarioId: id }).all() as unknown as TreatmentRow[];
  const simulations = await db.orm.SimulationResult.where({ riskScenarioId: id }).all() as unknown as SimRow[];

  const latestSim = [...simulations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const tef = distributions.find((d) => d.target === "tef");
  const vuln = distributions.find((d) => d.target === "vulnerability");
  const loss = distributions.find((d) => d.target === "loss");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{risk.riskId}</p>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{risk.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{risk.asset} · {risk.threatActor}</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {risk.status}
        </span>
      </div>

      {risk.description && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Scenario</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{risk.description}</p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { label: "Threat Event Frequency", dist: tef },
          { label: "Vulnerability", dist: vuln },
          { label: "Loss Magnitude", dist: loss },
        ].map(({ label, dist }) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</h3>
            {dist ? (
              <div className="mt-2">
                <p className="text-sm font-mono text-zinc-900 dark:text-zinc-50">{dist.type}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {dist.type === "NORMAL" || dist.type === "LOGNORMAL"
                    ? `μ=${dist.mean} σ=${dist.standardDeviation}`
                    : `min=${dist.min} mode=${dist.mode} max=${dist.max}`}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">Not defined</p>
            )}
          </div>
        ))}
      </section>

      {latestSim && (
        <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Latest Simulation ({latestSim.iterations.toLocaleString()} iterations)
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Mean", value: latestSim.mean },
              { label: "Median", value: latestSim.median },
              { label: "P75", value: latestSim.p75 },
              { label: "P90", value: latestSim.p90 },
              { label: "P95", value: latestSim.p95 },
              { label: "P99", value: latestSim.p99 },
              { label: "Max", value: latestSim.max },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
                <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatMoney(value, true)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Treatments ({treatments.length})</h2>
        </div>
        {treatments.length === 0 ? (
          <p className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">No treatments defined yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {treatments.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t.name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Impl {formatMoney(t.implementationCost, true)} · Annual {formatMoney(t.annualCost, true)}
                  {t.lossReduction ? ` · ${Math.round(t.lossReduction * 100)}% loss reduction` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <Link href="/risks" className="rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          ← Back to Register
        </Link>
      </div>
    </div>
  );
}
