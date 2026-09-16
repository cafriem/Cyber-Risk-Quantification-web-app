import type { Role } from "../validation/schemas";

type Permission =
  | "risk:create"
  | "risk:read"
  | "risk:update"
  | "risk:delete"
  | "risk:accept"
  | "simulation:run"
  | "treatment:create"
  | "treatment:save"
  | "report:view"
  | "control:manage"
  | "settings:manage"
  | "user:manage";

export type { Permission };

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "risk:create", "risk:read", "risk:update", "risk:delete", "risk:accept",
    "simulation:run", "treatment:create", "treatment:save",
    "report:view", "control:manage", "settings:manage", "user:manage",
  ],
  RISK_MANAGER: [
    "risk:create", "risk:read", "risk:update", "risk:delete", "risk:accept",
    "simulation:run", "treatment:create", "treatment:save",
    "report:view", "control:manage",
  ],
  ANALYST: [
    "risk:create", "risk:read", "risk:update",
    "simulation:run", "treatment:create", "report:view",
  ],
  VIEWER: ["risk:read", "report:view"],
  EXECUTIVE: ["risk:read", "report:view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function requirePermission(
  role: Role,
  permission: Permission,
): { ok: true } | { ok: false; error: string } {
  if (hasPermission(role, permission)) return { ok: true };
  return {
    ok: false,
    error: `Role ${role} does not have permission: ${permission}`,
  };
}
