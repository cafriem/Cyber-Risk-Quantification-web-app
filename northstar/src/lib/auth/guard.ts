import { auth } from "./auth";
import { db } from "../db/prisma";
import { requirePermission } from "./rbac";
import type { Permission } from "./rbac";
import type { Role } from "../validation/schemas";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized", status: 401 };
  }
  return { ok: true as const, session };
}

export async function requireOrgAccess(permission: Permission) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return { ok: false as const, error: "Unauthorized", status: 401 };
  }
  const role = session.user.role as Role;
  const check = requirePermission(role, permission);
  if (!check.ok) {
    return { ok: false as const, error: check.error, status: 403 };
  }
  return {
    ok: true as const,
    session,
    organizationId: session.user.organizationId,
    role,
  };
}

export async function requireRiskAccess(riskId: string, permission: Permission) {
  const result = await requireOrgAccess(permission);
  if (!result.ok) return result;

  const risk = await db.orm.RiskScenario.where({ id: riskId }).first();


  if (!risk) {
    return { ok: false as const, error: "Risk not found", status: 404 };
  }

  if (risk.organizationId !== result.organizationId) {
    return { ok: false as const, error: "Forbidden", status: 403 };
  }

  return {
    ok: true as const,
    session: result.session,
    organizationId: result.organizationId,
    role: result.role,
    risk,
  };
}
