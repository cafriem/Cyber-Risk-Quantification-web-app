import Link from "next/link";
import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { formatMoney } from "@/components/money";
import { generateReportData } from "@/lib/reports";
import type { ReportRisk } from "@/lib/reports";

interface RiskRow {
  id: string;
  name: string;
  threatType: string;
  [key: string]: unknown;
}

interface SimRow {
  id: string;
  riskScenarioId: string;
  inherent: number;
  createdAt: string;
  mean: number;
  p90: number;
  p95: number;
}

interface TreatmentRow {
  id: string;
  name: string;
  riskScenarioId: string;
  implementationCost: number;
  annualCost: number;
  [key: string]: unknown;
}

export default async function ReportsPage() {
  const guard = await requireOrgAccess("report:view");
  if (!guard.ok) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-300">You do not have permission to view reports.</p>;
  }

  const [organization, risks, simulations, treatments] = await Promise.all([
    db.orm.Organization.where({ id: guard.organizationId }).first(),
    db.orm.RiskScenario.where({ organizationId: guard.organizationId }).all() as unknown as RiskRow[],
    db.orm.SimulationResult.all() as unknown as SimRow[],
    db.orm.Treatment.all() as unknown as TreatmentRow[],
  ]);

  const reportRisks: ReportRisk[] = risks.map((risk) => ({
    id: risk.id,
    name: risk.name,
    category: risk.threatType,
    simulations: simulations
      .filter((simulation) => simulation.riskScenarioId === risk.id)
      .map(({ inherent, mean, p90, p95, createdAt }) => ({
        inherent: inherent === 1,
        mean,
        p90,
        p95,
        createdAt,
      })),
    treatments: treatments
      .filter((treatment) => treatment.riskScenarioId === risk.id)
      .map(({ id, name, implementationCost, annualCost }) => ({
        id,
        name,
        implementationCost,
        annualCost,
      })),
  }));

  const report = generateReportData(
    organization?.name as string | undefined ?? "",
    reportRisks,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Management Report</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {report.organizationName} · Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/executive" className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Executive View
          </Link>
          <a href="/api/reports/pdf" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Export PDF
          </a>
        </div>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Executive Summary</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {report.analyzedScenarios} analyzed scenarios represent an expected annual loss of{" "}
          <strong>{formatMoney(report.totalEal, true)}</strong>. Implementing the recommended controls would reduce expected
          annual loss to <strong>{formatMoney(report.residualEal, true)}</strong>, with expected annual savings of{" "}
          <strong>{formatMoney(report.annualSavings, true)}</strong>.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Inherent EAL", value: formatMoney(report.totalEal, true) },
          { label: "Residual EAL", value: formatMoney(report.residualEal, true) },
          { label: "First-Year Investment", value: formatMoney(report.firstYearInvestment, true) },
          { label: "Portfolio ROI", value: `${report.portfolioRoi.toFixed(0)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Top Risks & Treatment Recommendations</h2>
        </div>
        {report.topRisks.length === 0 ? (
          <p className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
            Run inherent and residual simulations to generate recommendations.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Recommendation</th>
                  <th className="px-4 py-3 text-right">Inherent EAL</th>
                  <th className="px-4 py-3 text-right">Residual EAL</th>
                  <th className="px-4 py-3 text-right">Reduction</th>
                  <th className="px-4 py-3 text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
          {report.topRisks.map((risk) => (
                  <tr key={risk.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <Link href={`/risks/${risk.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">{risk.name}</Link>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{risk.category}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{risk.recommendation}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(risk.mean, true)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(risk.residualMean ?? 0, true)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600 dark:text-green-400">
                      {formatMoney(risk.mean - (risk.residualMean ?? 0), true)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{risk.financials ? `${risk.financials.firstYearRoi.toFixed(0)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Assumptions</h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {report.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Methodology</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{report.methodology}</p>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Results are estimates, not guarantees. The application is FAIR-inspired and not FAIR-certified.
          </p>
        </div>
      </section>
    </div>
  );
}
