import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/auth/audit";
import { CreateRiskSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";

export async function GET() {
  const guard = await requireOrgAccess("risk:read");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const risks = await db.orm.RiskScenario
    .where({ organizationId: guard.organizationId })
    
    
    
    .all();
  return NextResponse.json({ risks });
}

export async function POST(request: Request) {
  const guard = await requireOrgAccess("risk:create");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const body = await request.json();
    const input = CreateRiskSchema.parse(body);

    const allRisks = await db.orm.RiskScenario
      .where({ organizationId: guard.organizationId })
      .all();
    const riskId = `RSK-${String(allRisks.length + 1).padStart(3, "0")}`;

    const risk = await db.orm.RiskScenario.create({
      id: crypto.randomUUID(),
      organizationId: guard.organizationId,
      riskId,
      name: input.name,
      description: input.description,
      asset: input.asset,
      businessProcess: input.businessProcess,
      threatActor: input.threatActor,
      threatType: input.threatType,
      department: input.department,
      ownerId: guard.session.user.id,
      businessOwnerId: input.businessOwnerId,
      seed: input.seed ?? 42,
    });

    await createAuditLog({
      organizationId: guard.organizationId,
      userId: guard.session.user.id,
      riskScenarioId: (risk as { id: string }).id,
      action: "risk.created",
      newValue: JSON.stringify({ riskId, name: risk.name }),
    });

    return NextResponse.json({ risk }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create risk", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
