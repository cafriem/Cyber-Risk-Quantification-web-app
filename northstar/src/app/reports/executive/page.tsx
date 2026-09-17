import Link from "next/link";
import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { formatMoney } from "@/components/money";
import { generateReportData } from "@/lib/reports";
import type { ReportRisk } from "@/lib/reports";

interface RiskRow { id: string; name: string; threatType: string; [key: string]: unknown }
interface SimRow { id: string; riskScenarioId: string; inherent: number; createdAt: string; mean: number; p90: number; p95: number }
interface TreatmentRow { id: string; name: string; riskScenarioId: string; implementationCost: number; annualCost: number; [key: string]: unknown }

export default async function ExecutiveReportPage() {
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
      .map(({ inherent, mean, p90, p95, createdAt }) => ({ inherent: inherent === 1, mean, p90, p95, createdAt })),
    treatments: treatments
      .filter((treatment) => treatment.riskScenarioId === risk.id)
      .map(({ id, name, implementationCost, annualCost }) => ({ id, name, implementationCost, annualCost })),
  }));

  const report = generateReportData(organization?.name as string | undefined ?? "", reportRisks);
  const riskReduction = report.totalEal > 0
    ? Math.max(0, Math.round(((report.totalEal - report.residualEal) / report.totalEal) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/reports" className="inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">← Full Report</Link>
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cyber Risk Exposure</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{report.organizationName}</p>

        <div className="mt-6 space-y-4">
          <Metric label="Expected annual loss" value={formatMoney(report.totalEal, true)} />
          <Metric label="Annual loss after recommended controls" value={formatMoney(report.residualEal, true)} />
          <Metric label="Risk reduction" value={`${riskReduction}%`} />
          <Metric label="Recommended first-year investment" value={formatMoney(report.firstYearInvestment, true)} />
          <Metric label="Expected annual savings" value={formatMoney(report.annualSavings, true)} />
          <Metric label="Expected ROI" value={`${report.portfolioRoi.toFixed(0)}%`} />
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          {report.annualSavings > 0
            ? "Recommended controls are expected to pay for themselves through reduced cyber risk."
            : "Run simulations and save treatment recommendations to calculate expected financial benefit."}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
