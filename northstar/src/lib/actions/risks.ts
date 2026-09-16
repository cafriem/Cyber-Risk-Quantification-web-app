"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/auth/audit";
import { CreateRiskSchema } from "@/lib/validation/schemas";

export async function createRisk(formData: FormData) {
  const guard = await requireOrgAccess("risk:create");
  if (!guard.ok) {
    throw new Error(guard.error);
  }

  const distributions = (formData.get("distributions") as string | null) ?? "[]";
  const parsed = CreateRiskSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    asset: formData.get("asset"),
    businessProcess: formData.get("businessProcess") || "",
    threatActor: formData.get("threatActor"),
    threatType: formData.get("threatType"),
    department: formData.get("department") || "",
    businessOwnerId: formData.get("businessOwnerId") || "",
    distributions: JSON.parse(distributions),
  });

  const allRisks = await db.orm.RiskScenario.all();
  const riskId = `RSK-${String(allRisks.length + 1).padStart(3, "0")}`;

  const risk = await db.orm.RiskScenario.create({
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
    status: "QUANTIFYING",
    seed: Math.floor(Math.random() * 100000),
  });

  if (parsed.distributions?.length) {
    for (const dist of parsed.distributions) {
      await db.orm.Distribution.create({
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
