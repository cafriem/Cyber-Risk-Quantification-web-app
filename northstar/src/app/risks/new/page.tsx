"use client";

import { useState } from "react";
import Link from "next/link";
import { createRisk } from "@/lib/actions/risks";

type DistType = "TRIANGULAR" | "UNIFORM" | "NORMAL" | "LOGNORMAL" | "PERT";


const distLabels: Record<string, string> = {
  tef: "Threat Event Frequency (/year)",
  vulnerability: "Vulnerability (0–1)",
  loss: "Loss Magnitude ($)",
};

export default function CreateRiskPage() {
  const [tefType, setTefType] = useState<DistType>("TRIANGULAR");
  const [vulnType, setVulnType] = useState<DistType>("TRIANGULAR");
  const [lossType, setLossType] = useState<DistType>("TRIANGULAR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const distTypeOptions: DistType[] = ["TRIANGULAR", "PERT", "UNIFORM", "NORMAL", "LOGNORMAL"];


  function renderDistFields(prefix: string, distType: DistType, defaults: { min: string; mode: string; max: string }) {
    if (distType === "NORMAL" || distType === "LOGNORMAL") {
      return (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-600 dark:text-zinc-400">
            Mean
            <input id={`${prefix}-mean`} type="number" step="any" defaultValue={defaults.mode} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
          </label>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">
            Std Dev
            <input id={`${prefix}-sd`} type="number" step="any" defaultValue="1" className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
          </label>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Min
          <input id={`${prefix}-min`} type="number" step="any" defaultValue={defaults.min} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Most Likely
          <input id={`${prefix}-mode`} type="number" step="any" defaultValue={defaults.mode} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Max
          <input id={`${prefix}-max`} type="number" step="any" defaultValue={defaults.max} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Create Risk Scenario</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Define the scenario and set probability distributions for quantification.</p>
      </div>

      <form action={createRisk} onSubmit={() => setIsSubmitting(true)} className="space-y-6">
        <input type="hidden" name="distributions" defaultValue="[]" />

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Scenario Definition</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Scenario Name *
              <input name="name" required placeholder="e.g. Ransomware attack on payroll server" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </label>
            <label className="col-span-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Description
              <textarea name="description" rows={3} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </label>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Asset *
              <input name="asset" required placeholder="e.g. Payroll Server" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </label>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Business Process
              <input name="businessProcess" placeholder="e.g. Payroll Processing" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </label>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Threat Actor *
              <select name="threatActor" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <option>Cybercriminal</option>
                <option>Nation State</option>
                <option>Insider</option>
                <option>Hacktivist</option>
                <option>Opportunistic Attacker</option>
              </select>
            </label>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Threat Type *
              <select name="threatType" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <option>Ransomware</option>
                <option>Phishing</option>
                <option>Data Breach</option>
                <option>DDoS</option>
                <option>Vulnerability Exploitation</option>
                <option>Cloud Misconfiguration</option>
              </select>
            </label>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Department
              <input name="department" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Probability Distributions</h2>

          {[
            { key: "tef", type: tefType, setType: setTefType, defaults: { min: "5", mode: "15", max: "40" } },
            { key: "vuln", type: vulnType, setType: setVulnType, defaults: { min: "0.05", mode: "0.15", max: "0.35" } },
            { key: "loss", type: lossType, setType: setLossType, defaults: { min: "25000", mode: "150000", max: "750000" } },
          ].map(({ key, type, setType, defaults }) => (
            <div key={key} className="mb-6 last:mb-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{distLabels[key]}</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DistType)}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {distTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              {renderDistFields(key, type, defaults)}
            </div>
          ))}
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create & Quantify"}
          </button>
          <Link href="/risks" className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
