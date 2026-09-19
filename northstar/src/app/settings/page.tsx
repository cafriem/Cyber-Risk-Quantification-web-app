import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { saveSettings, createUser } from "@/lib/actions/admin";
import type { Role } from "@/lib/validation/schemas";

interface SettingsRow {
  currency: string;
  fiscalYear: number;
  iterations: number;
  [key: string]: unknown;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  [key: string]: unknown;
}

const roleOptions: Role[] = ["ADMIN", "RISK_MANAGER", "ANALYST", "VIEWER", "EXECUTIVE"];

const inputClass = "mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default async function SettingsPage() {
  const guard = await requireOrgAccess("risk:read");
  if (!guard.ok) return <p className="text-sm text-zinc-600 dark:text-zinc-300">Sign in to view settings.</p>;

  const [organization, settings, users] = await Promise.all([
    db.orm.Organization.where({ id: guard.organizationId }).first() as unknown as { name: string } | undefined,
    db.orm.OrgSettings.where({ organizationId: guard.organizationId }).first(),
    db.orm.User.where({ organizationId: guard.organizationId }).all() as unknown as UserRow[],
  ]);

  const settingsData = settings as SettingsRow | undefined;
  const canManageSettings = await requireOrgAccess("settings:manage");
  const canManageUsers = await requireOrgAccess("user:manage");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{organization?.name ?? "Organization"} workspace configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={saveSettings} className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Organization Settings</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">
              Currency
              <select name="currency" defaultValue={settingsData?.currency ?? "USD"} disabled={!canManageSettings.ok} className={inputClass}>
                {["USD", "AED", "EUR", "GBP", "SAR"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">
              Fiscal Year
              <input name="fiscalYear" type="number" min="2000" max="2100" defaultValue={settingsData?.fiscalYear ?? 2026} disabled={!canManageSettings.ok} className={inputClass} />
            </label>
            <label className="col-span-2 text-xs text-zinc-600 dark:text-zinc-400">
              Default Simulation Iterations
              <input name="iterations" type="number" min="1000" max="1000000" step="1000" defaultValue={settingsData?.iterations ?? 100000} disabled={!canManageSettings.ok} className={inputClass} />
            </label>
          </div>
          {canManageSettings.ok && (
            <button type="submit" className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save Settings</button>
          )}
        </form>

        <form action={createUser} className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add User</h2>
          {canManageUsers.ok ? (
            <>
              <div className="space-y-3">
                <input name="name" required placeholder="Full name" className={inputClass} />
                <input name="email" type="email" required placeholder="email@company.com" className={inputClass} />
                <input name="password" type="password" required minLength={8} placeholder="Temporary password (8+ characters)" className={inputClass} />
                <select name="role" defaultValue="VIEWER" className={inputClass}>
                  {roleOptions.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
                </select>
              </div>
              <button type="submit" className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Create User</button>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Only administrators can manage users.</p>
          )}
        </form>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Users ({users.length})</h2>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {user.role.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
