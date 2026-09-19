"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/auth/audit";
import {
  ControlSchema,
  OrgSettingsSchema,
  RoleSchema,
} from "@/lib/validation/schemas";

export async function createControl(formData: FormData) {
  const guard = await requireOrgAccess("control:manage");
  if (!guard.ok) throw new Error(guard.error);

  const input = ControlSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    ownerId: formData.get("ownerId") || "",
    implementationStatus: formData.get("implementationStatus") || "Planned",
    effectiveness: formData.get("effectiveness") || "EFFECTIVE",
    cost: Number(formData.get("cost") || 0),
    annualOperatingCost: Number(formData.get("annualOperatingCost") || 0),
  });

  const control = await db.orm.Control.create({
    id: crypto.randomUUID(),
    organizationId: guard.organizationId,
    name: input.name,
    description: input.description,
    ownerId: input.ownerId,
    implementationStatus: input.implementationStatus,
    effectiveness: input.effectiveness,
    cost: input.cost,
    annualOperatingCost: input.annualOperatingCost,
  });

  await createAuditLog({
    organizationId: guard.organizationId,
    userId: guard.session.user.id,
    action: "control.created",
    newValue: JSON.stringify({ id: control.id, name: control.name }),
  });

  revalidatePath("/controls");
}

export async function saveSettings(formData: FormData) {
  const guard = await requireOrgAccess("settings:manage");
  if (!guard.ok) throw new Error(guard.error);

  const input = OrgSettingsSchema.parse({
    currency: formData.get("currency"),
    fiscalYear: Number(formData.get("fiscalYear")),
    iterations: Number(formData.get("iterations")),
  });

  const existing = await db.orm.OrgSettings
    .where({ organizationId: guard.organizationId })
    .first();

  if (existing) {
    await db.orm.OrgSettings
      .where({ organizationId: guard.organizationId })
      .update(input);
  } else {
    await db.orm.OrgSettings.create({
      id: crypto.randomUUID(),
      organizationId: guard.organizationId,
      ...input,
    });
  }

  await db.orm.Organization
    .where({ id: guard.organizationId })
    .update({ currency: input.currency });

  await createAuditLog({
    organizationId: guard.organizationId,
    userId: guard.session.user.id,
    action: "settings.updated",
    newValue: JSON.stringify(input),
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function createUser(formData: FormData) {
  const guard = await requireOrgAccess("user:manage");
  if (!guard.ok) throw new Error(guard.error);

  const email = String(formData.get("email") ?? "").toLowerCase();
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = RoleSchema.parse(formData.get("role"));

  if (name.length < 1 || password.length < 8) {
    throw new Error("Name is required and password must be at least 8 characters.");
  }

  const existing = await db.orm.User.where({ email }).first();
  if (existing) throw new Error("A user with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.orm.User.create({
    id: crypto.randomUUID(),
    email,
    name,
    passwordHash,
    role,
    organizationId: guard.organizationId,
  });

  await createAuditLog({
    organizationId: guard.organizationId,
    userId: guard.session.user.id,
    action: "user.created",
    newValue: JSON.stringify({ id: user.id, email, role }),
  });

  revalidatePath("/settings");
}
