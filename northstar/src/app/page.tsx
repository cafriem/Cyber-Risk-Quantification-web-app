import Link from "next/link";
import { db } from "@/lib/db/prisma";
import { formatMoney } from "@/components/money";
import { requireOrgAccess } from "@/lib/auth/guard";
import { calculatePortfolioAnalytics } from "@/lib/portfolio";
import { CategoryExposureChart } from "@/components/charts/category-exposure";

interface RiskRow {
  id: string;
  name: string;
  department: string;
  threatType: string;
  [key: string]: unknown;
}

interface SimRow {
  riskScenarioId: string;
  createdAt: string;
  losses: string;
  mean: number;
  p90: number;
}

export default async function DashboardPage() {
  const guard = await requireOrgAccess("risk:read");
  if (!guard.ok) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        Sign in to view the risk dashboard.
      </div>
    );
  }

  const risks = await db.orm.RiskScenario.where({ organizationId: guard.organizationId }).all() as unknown as RiskRow[];
  const simulations = await db.orm.SimulationResult.where({ organizationId: guard.organizationId }).all() as unknown as SimRow[];

  const latestByRisk = new Map<string, SimRow>();
  for (const sim of simulations) {
    const existing = latestByRisk.get(sim.riskScenarioId);
    if (!existing || new Date(sim.createdAt) > new Date(existing.createdAt)) {
      latestByRisk.set(sim.riskScenarioId, sim);
    }
  }

  const portfolio = calculatePortfolioAnalytics(
    [...latestByRisk.entries()].map(([id, sim]) => ({
      id,
      name: risks.find((risk) => risk.id === id)?.name ?? "Unnamed risk",
      category: risks.find((risk) => risk.id === id)?.threatType ?? "Uncategorized",
      annualLosses: sim.losses ? JSON.parse(sim.losses) : [],
    })),
  );

  const stats = [
    { label: "Total Risks", value: String(risks.length) },
    { label: "Expected Annual Loss", value: formatMoney(portfolio.totalEal, true) },
    { label: "90th Percentile Exposure", value: formatMoney(portfolio.totalP90, true) },
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Portfolio Monte Carlo</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Mean", value: portfolio.simulatedTotal.mean },
              { label: "P90", value: portfolio.simulatedTotal.p90 },
              { label: "P95", value: portfolio.simulatedTotal.p95 },
              { label: "P99", value: portfolio.simulatedTotal.p99 },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
                <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatMoney(value, true)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Exposure by Threat Type</h2>
          <CategoryExposureChart data={portfolio.categoryExposure} />
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Top 10 Risks by Expected Loss</h2>
        </div>
        {portfolio.topRisks.length === 0 ? (
          <p className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">Run simulations to rank portfolio risks.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {portfolio.topRisks.map((risk, index) => (
              <div key={risk.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <Link href={`/risks/${risk.id}`} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {index + 1}. {risk.name}
                  </Link>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{risk.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">{formatMoney(risk.mean, true)}</p>
                  <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">P90 {formatMoney(risk.p90, true)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
