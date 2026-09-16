import Link from "next/link";
import { db } from "@/lib/db/prisma";

interface RiskRow {
  id: string;
  riskId: string;
  name: string;
  asset: string;
  threatType: string;
  status: string;
  [key: string]: unknown;
}

export default async function RiskRegisterPage() {
  const risks = await db.orm.RiskScenario.all() as unknown as RiskRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Risk Register</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">All quantified risk scenarios</p>
        </div>
        <Link
          href="/risks/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Create Risk
        </Link>
      </div>

      {risks.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No risk scenarios yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Scenario</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Threat</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr key={risk.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">{risk.riskId}</td>
                  <td className="px-4 py-3">
                    <Link href={`/risks/${risk.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {risk.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{risk.asset}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{risk.threatType}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {risk.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
