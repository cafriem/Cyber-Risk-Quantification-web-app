"use client";

import { formatMoney } from "@/components/money";

interface TreatmentComparisonRow {
  id: string;
  name: string;
  type: string;
  implementationCost: number;
  annualCost: number;
  tefReduction: number | null;
  vulnerabilityReduction: number | null;
  lossReduction: number | null;
  confidence: string;
}

interface SimulationSummary {
  mean: number;
  p90: number;
}

export function TreatmentComparison({
  treatments,
  inherent,
  results,
}: {
  treatments: TreatmentComparisonRow[];
  inherent: SimulationSummary;
  results: Record<string, SimulationSummary>;
}) {
  const rows = [
    {
      name: "Do Nothing",
      type: "—",
      cost: 0,
      annual: 0,
      mean: inherent.mean,
      p90: inherent.p90,
      reduction: 0,
      roi: null as number | null,
      confidence: "—",
    },
    ...treatments.map((t) => {
      const result = results[t.id];
      const mean = result?.mean ?? inherent.mean;
      const p90 = result?.p90 ?? inherent.p90;
      const reduction = inherent.mean - mean;
      const totalCost = t.implementationCost + t.annualCost;
      return {
        name: t.name,
        type: t.type,
        cost: t.implementationCost,
        annual: t.annualCost,
        mean,
        p90,
        reduction,
        roi: totalCost > 0 ? ((reduction - t.annualCost) / totalCost) * 100 : null,
        confidence: t.confidence,
      };
    }),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-3 py-2">Treatment</th>
            <th className="px-3 py-2 text-right">Impl Cost</th>
            <th className="px-3 py-2 text-right">Annual Cost</th>
            <th className="px-3 py-2 text-right">Expected Loss</th>
            <th className="px-3 py-2 text-right">P90</th>
            <th className="px-3 py-2 text-right">Risk Reduction</th>
            <th className="px-3 py-2 text-right">ROI</th>
            <th className="px-3 py-2">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">{row.name}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-600 dark:text-zinc-300">{row.cost ? formatMoney(row.cost, true) : "—"}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-600 dark:text-zinc-300">{row.annual ? formatMoney(row.annual, true) : "—"}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-600 dark:text-zinc-300">{formatMoney(row.mean, true)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-600 dark:text-zinc-300">{formatMoney(row.p90, true)}</td>
              <td className={`px-3 py-2 text-right font-mono ${row.reduction > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}>
                {row.reduction > 0 ? formatMoney(row.reduction, true) : "—"}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${row.roi !== null && row.roi > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}>
                {row.roi !== null ? `${row.roi.toFixed(0)}%` : "—"}
              </td>
              <td className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">{row.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
