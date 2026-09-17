import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { generateReportData } from "@/lib/reports";
import type { ReportRisk } from "@/lib/reports";
import { formatMoney } from "@/components/money";

interface RiskRow { id: string; name: string; threatType: string; [key: string]: unknown }
interface SimRow { id: string; riskScenarioId: string; inherent: number; createdAt: string; mean: number; p90: number; p95: number }
interface TreatmentRow { id: string; name: string; riskScenarioId: string; implementationCost: number; annualCost: number; [key: string]: unknown }

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET() {
  const guard = await requireOrgAccess("report:view");
  if (!guard.ok) {
    return new Response("Forbidden", { status: guard.status });
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
  const rows = report.topRisks.map((risk) => `
    <tr>
      <td>${escapeHtml(risk.name)}<div class="muted">${escapeHtml(risk.category)}</div></td>
      <td>${escapeHtml(risk.recommendation ?? "—")}</td>
      <td class="number">${formatMoney(risk.mean, true)}</td>
      <td class="number">${formatMoney(risk.residualMean ?? 0, true)}</td>
      <td class="number">${formatMoney(risk.mean - (risk.residualMean ?? 0), true)}</td>
      <td class="number">${risk.financials ? `${risk.financials.firstYearRoi.toFixed(0)}%` : "—"}</td>
    </tr>
  `).join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(report.organizationName)} — Cyber Risk Report</title>
<style>
  body { font-family: system-ui, sans-serif; color: #111827; margin: 40px; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 28px; }
  .muted { color: #6b7280; font-size: 12px; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
  .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
  th { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 8px 6px; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  td { border-bottom: 1px solid #f3f4f6; padding: 8px 6px; vertical-align: top; }
  .number { text-align: right; font-variant-numeric: tabular-nums; }
  @media print { body { margin: 20px; } }
</style></head>
<body onload="window.print()">
<h1>${escapeHtml(report.organizationName)} — Cyber Risk Report</h1>
<p class="muted">Generated ${new Date(report.generatedAt).toLocaleString()}</p>
<h2>Executive Summary</h2>
<p>${report.analyzedScenarios} analyzed scenarios represent an expected annual loss of <strong>${formatMoney(report.totalEal, true)}</strong>. Recommended controls reduce expected annual loss to <strong>${formatMoney(report.residualEal, true)}</strong>.</p>
<div class="cards">
  <div class="card"><div class="label">Inherent EAL</div><div class="value">${formatMoney(report.totalEal, true)}</div></div>
  <div class="card"><div class="label">Residual EAL</div><div class="value">${formatMoney(report.residualEal, true)}</div></div>
  <div class="card"><div class="label">First-Year Investment</div><div class="value">${formatMoney(report.firstYearInvestment, true)}</div></div>
  <div class="card"><div class="label">Portfolio ROI</div><div class="value">${report.portfolioRoi.toFixed(0)}%</div></div>
</div>
<h2>Top Risks and Recommendations</h2>
<table><thead><tr><th>Risk</th><th>Recommendation</th><th>Inherent</th><th>Residual</th><th>Reduction</th><th>ROI</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6">Run simulations and save treatments to generate recommendations.</td></tr>'}</tbody></table>
<h2>Assumptions</h2>
<ul>${report.assumptions.map((assumption) => `<li>${escapeHtml(assumption)}</li>`).join("")}</ul>
<h2>Methodology</h2><p>${escapeHtml(report.methodology)}</p>
<p class="muted">Results are estimates, not guarantees. The application is FAIR-inspired and not FAIR-certified.</p>
</body></html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `inline; filename="cyber-risk-report-${report.generatedAt.slice(0, 10)}.html"`,
    },
  });
}
