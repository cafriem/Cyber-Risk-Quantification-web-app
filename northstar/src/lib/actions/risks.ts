"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/auth/audit";
import { CreateRiskSchema } from "@/lib/validation/schemas";

type WizardDistribution = {
  target: "tef" | "vulnerability" | "loss";
  type: "TRIANGULAR" | "UNIFORM" | "NORMAL" | "LOGNORMAL" | "PERT";
  min?: number;
  mode?: number;
  max?: number;
  mean?: number;
  standardDeviation?: number;
  lambda?: number;
  confidence?: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  dataSource?: string;
  notes?: string;
};

function readWizardDistributions(formData: FormData): WizardDistribution[] {
  const targets = [
    { target: "tef", prefix: "tef" },
    { target: "vulnerability", prefix: "vuln" },
    { target: "loss", prefix: "loss" },
  ] as const;

  const distributions: WizardDistribution[] = [];

  for (const { target, prefix } of targets) {
    const type = formData.get(`${prefix}-type`);
    if (typeof type !== "string") continue;
    const confidence = (formData.get(`${prefix}-confidence`) ?? "MEDIUM") as NonNullable<WizardDistribution["confidence"]>;
    const dataSource = String(formData.get(`${prefix}-dataSource`) ?? "");
    const notes = String(formData.get(`${prefix}-notes`) ?? "");

    if (type === "NORMAL" || type === "LOGNORMAL") {
      distributions.push({
        target,
        type,
        mean: Number(formData.get(`${prefix}-mean`)),
        standardDeviation: Number(formData.get(`${prefix}-sd`)),
        confidence,
        dataSource,
        notes,
      });
      continue;
    }

    distributions.push({
      target,
      type: type as Exclude<WizardDistribution["type"], "NORMAL" | "LOGNORMAL">,
      min: Number(formData.get(`${prefix}-min`)),
      mode: Number(formData.get(`${prefix}-mode`)),
      max: Number(formData.get(`${prefix}-max`)),
      lambda: type === "PERT" ? Number(formData.get(`${prefix}-lambda`) ?? 4) : undefined,
      confidence,
      dataSource,
      notes,
    });
  }

  return distributions;
}

export async function createRisk(formData: FormData) {
  const guard = await requireOrgAccess("risk:create");
  if (!guard.ok) {
    throw new Error(guard.error);
  }

  const intent = formData.get("intent") === "quantify" ? "quantify" : "draft";
  const distributions = readWizardDistributions(formData);
  const parsed = CreateRiskSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    asset: formData.get("asset"),
    businessProcess: formData.get("businessProcess") || "",
    threatActor: formData.get("threatActor"),
    threatType: formData.get("threatType"),
    department: formData.get("department") || "",
    businessOwnerId: formData.get("businessOwnerId") || "",
    distributions,
  });

  const allRisks = await db.orm.RiskScenario.all();
  const riskId = `RSK-${String(allRisks.length + 1).padStart(3, "0")}`;

  const risk = await db.orm.RiskScenario.create({
    id: crypto.randomUUID(),
    organizationId: guard.organizationId,
    riskId,
    name: parsed.name,
    description: parsed.description,
    asset: parsed.asset,
    businessProcess: parsed.businessProcess,
    threatActor: parsed.threatActor,
    threatType: parsed.threatType,
    department: parsed.department,
    ownerId: guard.session.user.id,
    businessOwnerId: parsed.businessOwnerId,
    status: intent === "quantify" ? "QUANTIFYING" : "DRAFT",
    seed: Math.floor(Math.random() * 100000),
  });

  if (parsed.distributions?.length) {
    for (const dist of parsed.distributions) {
      await db.orm.Distribution.create({
        id: crypto.randomUUID(),
        riskScenarioId: (risk as { id: string }).id,
        target: dist.target,
        type: dist.type,
        min: dist.min,
        mode: dist.mode,
        max: dist.max,
        mean: dist.mean,
        standardDeviation: dist.standardDeviation,
        lambda: dist.lambda,
        confidence: dist.confidence,
        dataSource: dist.dataSource,
        notes: dist.notes,
      });
    }
  }

  await createAuditLog({
    organizationId: guard.organizationId,
    userId: guard.session.user.id,
    riskScenarioId: (risk as { id: string }).id,
    action: "risk.created",
    newValue: JSON.stringify({ riskId, name: risk.name }),
  });

  revalidatePath("/risks");
  revalidatePath("/");
  redirect(`/risks/${risk.id}`);
}

export async function deleteRisk(id: string) {
  const guard = await requireOrgAccess("risk:delete");
  if (!guard.ok) {
    throw new Error(guard.error);
  }

  const risk = await db.orm.RiskScenario.where({ id }).first();
  if (!risk) {
    throw new Error("Risk not found");
  }

  await db.orm.RiskScenario.where({ id }).delete();

  await createAuditLog({
    organizationId: guard.organizationId,
    userId: guard.session.user.id,
    action: "risk.deleted",
    oldValue: JSON.stringify({ riskId: risk.riskId, name: risk.name }),
  });

  revalidatePath("/risks");
  revalidatePath("/");
  redirect("/risks");
}

export async function planTreatment(riskId: string, treatmentId: string) {
  const guard = await requireOrgAccess("risk:update");
  if (!guard.ok) {
    throw new Error(guard.error);
  }

  const risk = await db.orm.RiskScenario.where({ id: riskId }).first();
  if (!risk) {
    throw new Error("Risk not found");
  }

  const treatment = await db.orm.Treatment.where({ id: treatmentId }).first();
  if (!treatment) {
    throw new Error("Treatment not found");
  }

  await db.orm.RiskScenario.where({ id: riskId }).update({
    status: "TREATMENT_PLANNED",
  });

  await createAuditLog({
    organizationId: guard.organizationId,
    userId: guard.session.user.id,
    riskScenarioId: riskId,
    action: "treatment.planned",
    newValue: JSON.stringify({ treatmentId, treatmentName: treatment.name }),
  });

  revalidatePath(`/risks/${riskId}`);
  revalidatePath(`/risks/${riskId}/treatment`);
  revalidatePath("/risks");
  revalidatePath("/");
}
