import Link from "next/link";
import { db } from "@/lib/db/prisma";
import { formatMoney } from "@/components/money";

interface SimRow {
  riskScenarioId: string;
  createdAt: string;
  mean: number;
  p90: number;
}

export default async function DashboardPage() {
  const risks = await db.orm.RiskScenario.all() as unknown[];
  const simulations = await db.orm.SimulationResult.all() as unknown as SimRow[];

  const latestByRisk = new Map<string, SimRow>();
  for (const sim of simulations) {
    const existing = latestByRisk.get(sim.riskScenarioId);
    if (!existing || new Date(sim.createdAt) > new Date(existing.createdAt)) {
      latestByRisk.set(sim.riskScenarioId, sim);
    }
  }

  const latest = [...latestByRisk.values()];
  const totalEal = latest.reduce((sum, sim) => sum + sim.mean, 0);
  const totalP90 = latest.reduce((sum, sim) => sum + sim.p90, 0);

  const stats = [
    { label: "Total Risks", value: String(risks.length) },
    { label: "Expected Annual Loss", value: formatMoney(totalEal, true) },
    { label: "90th Percentile Exposure", value: formatMoney(totalP90, true) },
    { label: "Simulations Run", value: String(simulations.length) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Portfolio-level cyber risk overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h2>
        </div>
        <div className="flex gap-3 p-5">
          <Link href="/risks/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Create Risk Scenario
          </Link>
          <Link href="/risks" className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            View Risk Register
          </Link>
        </div>
      </div>
    </div>
  );
}
