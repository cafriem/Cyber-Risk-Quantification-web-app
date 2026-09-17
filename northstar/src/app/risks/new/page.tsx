"use client";

import { useState } from "react";
import Link from "next/link";
import { createRisk } from "@/lib/actions/risks";

type DistType = "TRIANGULAR" | "UNIFORM" | "NORMAL" | "LOGNORMAL" | "PERT";
type Confidence = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

const distTypeOptions: DistType[] = ["TRIANGULAR", "PERT", "UNIFORM", "NORMAL", "LOGNORMAL"];
const confidenceOptions: Confidence[] = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"];
const steps = ["Scenario", "Threat Frequency", "Vulnerability", "Loss Magnitude", "Review"] as const;

const distributionFields = [
  {
    key: "tef",
    title: "Threat Event Frequency (/year)",
    explanation: "How often a threat actor is expected to act against this asset each year, before considering controls.",
    defaults: { min: "5", mode: "15", max: "40" },
  },
  {
    key: "vuln",
    title: "Vulnerability (0–1)",
    explanation: "The probability that a threat event becomes a loss event, based on threat capability versus control resistance.",
    defaults: { min: "0.05", mode: "0.15", max: "0.35" },
  },
  {
    key: "loss",
    title: "Loss Magnitude ($)",
    explanation: "The financial impact of one loss event, including response, replacement, productivity, and other primary losses.",
    defaults: { min: "25000", mode: "150000", max: "750000" },
  },
] as const;

function inputClass() {
  return "mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
}

export default function CreateRiskPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visibleStep = Math.min(step, steps.length - 1);

  function renderDistFields(prefix: string, distType: DistType, defaults: { min: string; mode: string; max: string }) {
    if (distType === "NORMAL" || distType === "LOGNORMAL") {
      return (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-600 dark:text-zinc-400">
            Mean
            <input name={`${prefix}-mean`} type="number" step="any" defaultValue={defaults.mode} className={inputClass()} />
          </label>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">
            Std Dev
            <input name={`${prefix}-sd`} type="number" step="any" min="0" defaultValue="1" className={inputClass()} />
          </label>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Min
          <input name={`${prefix}-min`} type="number" step="any" min="0" defaultValue={defaults.min} className={inputClass()} />
        </label>
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Most Likely
          <input name={`${prefix}-mode`} type="number" step="any" min="0" defaultValue={defaults.mode} className={inputClass()} />
        </label>
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Max
          <input name={`${prefix}-max`} type="number" step="any" min="0" defaultValue={defaults.max} className={inputClass()} />
        </label>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">FAIR Analysis Wizard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Define uncertainty in five guided steps. You can save a draft at any point.</p>
      </div>

      <ol className="grid grid-cols-5 gap-2 text-center text-xs">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`rounded-full px-2 py-1 font-medium ${
              index === visibleStep
                ? "bg-blue-600 text-white"
                : index < visibleStep
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      <form action={createRisk} onSubmit={() => setIsSubmitting(true)} className="space-y-6">
        {visibleStep === 0 && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Scenario Definition</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Scenario Name *
                <input name="name" required placeholder="e.g. Ransomware attack on payroll server" className={inputClass()} />
              </label>
              <label className="col-span-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Description
                <textarea name="description" rows={3} className={inputClass()} />
              </label>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Asset *
                <input name="asset" required placeholder="e.g. Payroll Server" className={inputClass()} />
              </label>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Business Process
                <input name="businessProcess" placeholder="e.g. Payroll Processing" className={inputClass()} />
              </label>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Threat Actor *
                <input name="threatActor" required placeholder="e.g. External cybercriminal" className={inputClass()} />
              </label>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Threat Type *
                <input name="threatType" required placeholder="e.g. Ransomware" className={inputClass()} />
              </label>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Department
                <input name="department" className={inputClass()} />
              </label>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Business Owner
                <input name="businessOwnerId" className={inputClass()} />
              </label>
            </div>
          </section>
        )}

        {visibleStep >= 1 && visibleStep <= 3 && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {distributionFields[visibleStep - 1].title}
            </h2>
            <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
              {distributionFields[visibleStep - 1].explanation}
            </p>
            <DistInputs field={distributionFields[visibleStep - 1]} renderFields={renderDistFields} />
          </section>
        )}

        {visibleStep === 4 && (
          <section className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Review</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                “Create & Quantify” saves the scenario as quantifying; earlier steps can be submitted as an incomplete draft.
              </p>
              <details className="mt-4 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                <summary className="cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">How is risk calculated?</summary>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Monte Carlo simulation samples each distribution, combines threat event frequency with vulnerability to estimate loss event frequency, then multiplies each loss event by sampled loss magnitude to produce annual loss.
                </p>
              </details>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Inputs Captured</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                {distributionFields.map((field) => <li key={field.key}>{field.title}</li>)}
              </ul>
            </div>
          </section>
        )}

        <input type="hidden" name="intent" value={visibleStep === steps.length - 1 ? "quantify" : "draft"} />

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={visibleStep === 0 || isSubmitting}
              className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            {visibleStep < steps.length - 1 && (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {visibleStep < steps.length - 1 && (
              <button type="submit" disabled={isSubmitting} className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                {isSubmitting ? "Saving..." : "Save Draft"}
              </button>
            )}
            {visibleStep === steps.length - 1 && (
              <button type="submit" disabled={isSubmitting} className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? "Creating..." : "Create & Quantify"}
              </button>
            )}
            <Link href="/risks" className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

function DistInputs({
  field,
  renderFields,
}: {
  field: (typeof distributionFields)[number];
  renderFields: (prefix: string, distType: DistType, defaults: { min: string; mode: string; max: string }) => React.ReactNode;
}) {
  const [distType, setDistType] = useState<DistType>("TRIANGULAR");
  const [confidence, setConfidence] = useState<Confidence>("MEDIUM");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <select
          value={distType}
          onChange={(event) => setDistType(event.target.value as DistType)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {distTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select
          name={`${field.key}-confidence`}
          value={confidence}
          onChange={(event) => setConfidence(event.target.value as Confidence)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {confidenceOptions.map((option) => <option key={option} value={option}>Confidence: {option.replace("_", " ").toLowerCase()}</option>)}
        </select>
      </div>
      <input type="hidden" name={`${field.key}-type`} value={distType} />
      {renderFields(field.key, distType, field.defaults)}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Data Source
          <input name={`${field.key}-dataSource`} placeholder="e.g. incident data, expert estimate" className={inputClass()} />
        </label>
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Assumptions / Notes
          <input name={`${field.key}-notes`} className={inputClass()} />
        </label>
      </div>
    </div>
  );
}
