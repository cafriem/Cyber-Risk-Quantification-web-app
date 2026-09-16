import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { requireRiskAccess } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/auth/audit";
import { UpdateRiskSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireRiskAccess(id, "risk:read");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const risk = await db.orm.RiskScenario
    .where({ id })
    
    
    
    
    
    .first();
  return NextResponse.json({ risk });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireRiskAccess(id, "risk:update");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const body = await request.json();
    const input = UpdateRiskSchema.parse(body);
    const old = JSON.stringify(guard.risk);

    const risk = await db.orm.RiskScenario
      .where({ id })
      .update(input);

    await createAuditLog({
      organizationId: guard.organizationId,
      userId: guard.session.user.id,
      riskScenarioId: id,
      action: "risk.updated",
      oldValue: old,
      newValue: JSON.stringify(input),
    });

    return NextResponse.json({ risk });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireRiskAccess(id, "risk:delete");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  await db.orm.RiskScenario
    .where({ id })
    .delete();

  await createAuditLog({
    organizationId: guard.organizationId,
    userId: guard.session.user.id,
    action: "risk.deleted",
    oldValue: JSON.stringify({ riskId: guard.risk.riskId, name: guard.risk.name }),
  });

  return NextResponse.json({ ok: true });
}
