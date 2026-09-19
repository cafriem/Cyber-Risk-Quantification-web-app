import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { createControl } from "@/lib/actions/admin";
import { formatMoney } from "@/components/money";

const baselineControls = [
  { name: "Multi-Factor Authentication", description: "Phishing-resistant MFA for privileged and remote access.", implementationStatus: "Recommended", effectiveness: "HIGHLY_EFFECTIVE", cost: 25000, annualOperatingCost: 6000 },
  { name: "Endpoint Detection & Response", description: "Managed EDR coverage across servers and endpoints.", implementationStatus: "Recommended", effectiveness: "HIGHLY_EFFECTIVE", cost: 85000, annualOperatingCost: 24000 },
  { name: "Immutable Backups", description: "Isolated, immutable recovery copies with restore testing.", implementationStatus: "Recommended", effectiveness: "EFFECTIVE", cost: 45000, annualOperatingCost: 18000 },
  { name: "Security Awareness Training", description: "Role-based training and phishing simulations.", implementationStatus: "Recommended", effectiveness: "PARTIALLY_EFFECTIVE", cost: 12000, annualOperatingCost: 9000 },
  { name: "Network Segmentation", description: "Segment crown-jewel systems from user and internet zones.", implementationStatus: "Recommended", effectiveness: "EFFECTIVE", cost: 110000, annualOperatingCost: 15000 },
  { name: "SIEM & 24x7 Monitoring", description: "Central detection, correlation, and response workflow.", implementationStatus: "Recommended", effectiveness: "EFFECTIVE", cost: 140000, annualOperatingCost: 65000 },
] as const;

interface ControlRow {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  implementationStatus: string;
  effectiveness: string;
  cost: number;
  annualOperatingCost: number;
  riskScenarioId: string | null;
  [key: string]: unknown;
}

interface RiskRow { id: string; name: string; riskId: string; [key: string]: unknown }

export default async function ControlsPage() {
  const guard = await requireOrgAccess("risk:read");
  if (!guard.ok) return <p className="text-sm text-zinc-600 dark:text-zinc-300">Sign in to view controls.</p>;

  const [controls, risks] = await Promise.all([
    db.orm.Control.where({ organizationId: guard.organizationId }).all() as unknown as ControlRow[],
    db.orm.RiskScenario.where({ organizationId: guard.organizationId }).all() as unknown as RiskRow[],
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Controls Library</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Maintain baseline controls and attach them to quantified risks.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Library ({controls.length})</h2>
          </div>
          {controls.length === 0 ? (
            <p className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">No controls saved yet. Add one using the form.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {controls.map((control) => {
                const attachedRisk = risks.find((risk) => risk.id === control.riskScenarioId);
                return (
                  <div key={control.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{control.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{control.description || "No description"}</p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {control.effectiveness.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{control.implementationStatus}</span>
                      <span>Implementation {formatMoney(control.cost, true)}</span>
                      <span>Operating {formatMoney(control.annualOperatingCost, true)}</span>
                      {attachedRisk && <span>Attached: {attachedRisk.name}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <form action={createControl} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add Control</h2>
            <input name="name" required placeholder="Control name" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            <textarea name="description" rows={2} placeholder="Description" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            <div className="grid grid-cols-2 gap-2">
              <input name="implementationStatus" defaultValue="Planned" placeholder="Status" className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
              <select name="effectiveness" className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                {["EFFECTIVE", "HIGHLY_EFFECTIVE", "PARTIALLY_EFFECTIVE", "INEFFECTIVE"].map((value) => (
                  <option key={value} value={value}>{value.replace("_", " ")}</option>
                ))}
              </select>
              <input name="cost" type="number" min="0" step="any" defaultValue="0" placeholder="Implementation cost" className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
              <input name="annualOperatingCost" type="number" min="0" step="any" defaultValue="0" placeholder="Annual cost" className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
              <input name="ownerId" placeholder="Owner" className="col-span-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </div>
            <button type="submit" className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save Control</button>
          </form>

          {risks.length > 0 && controls.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recommended Baselines</h2>
              <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                {baselineControls.map((control) => <li key={control.name}>{control.name}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
