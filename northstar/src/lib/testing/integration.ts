import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/prisma";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  organizationId: string;
};

type Session = {
  user: SessionUser;
};

export type SeededUser = SessionUser;

export const integrationIds = {
  organizations: ["org-a", "org-b"],
  users: ["user-a-admin", "user-a-viewer", "user-b-admin"],
  risks: ["risk-a", "risk-b"],
} as const;

export async function seedIntegrationData() {
  const existing = await db.orm.Organization.where({ id: "org-a" }).first();
  if (existing) return;

  await db.orm.Organization.create({ id: "org-a", name: "Organization A" });
  await db.orm.Organization.create({ id: "org-b", name: "Organization B" });

  await db.orm.User.create({
    id: "user-a-admin",
    email: "admin-a@example.test",
    name: "Admin A",
    passwordHash: "test",
    role: "ADMIN",
    organizationId: "org-a",
  });
  await db.orm.User.create({
    id: "user-a-viewer",
    email: "viewer-a@example.test",
    name: "Viewer A",
    passwordHash: "test",
    role: "VIEWER",
    organizationId: "org-a",
  });
  await db.orm.User.create({
    id: "user-b-admin",
    email: "admin-b@example.test",
    name: "Admin B",
    passwordHash: "test",
    role: "ADMIN",
    organizationId: "org-b",
  });

  await db.orm.RiskScenario.create({
    id: "risk-a",
    organizationId: "org-a",
    riskId: "RSK-A-001",
    name: "Organization A risk",
    description: "",
    asset: "Payment platform",
    businessProcess: "",
    threatActor: "External attacker",
    threatType: "Ransomware",
    department: "",
    ownerId: "user-a-admin",
    businessOwnerId: "",
    seed: 42,
  });
  await db.orm.RiskScenario.create({
    id: "risk-b",
    organizationId: "org-b",
    riskId: "RSK-B-001",
    name: "Organization B risk",
    description: "",
    asset: "Customer database",
    businessProcess: "",
    threatActor: "External attacker",
    threatType: "Data breach",
    department: "",
    ownerId: "user-b-admin",
    businessOwnerId: "",
    seed: 42,
  });
}

export function createTestId() {
  return crypto.randomUUID();
}

type GuardedRoute<Params extends Record<string, string> = Record<string, string>> = (
  request: Request,
  context: { params: Promise<Params> },
) => Promise<Response>;

export function authenticatedRoute<Params extends Record<string, string>>(
  handler: GuardedRoute<Params>,
  user: SeededUser | null,
): GuardedRoute<Params> {
  return async (request, context) => {
    const authMock = auth as unknown as {
      mockResolvedValueOnce: (value: Session | null) => unknown;
      mockRestore: () => void;
    };
    authMock.mockResolvedValueOnce(user ? { user } : null);
    try {
      return await handler(request, context);
    } finally {
      authMock.mockRestore();
    }
  };
}
