import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { requireRiskAccess } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/auth/audit";
import { TreatmentSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireRiskAccess(id, "risk:read");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const treatments = await db.orm.Treatment
    .where({ riskScenarioId: id })
    .all();
  return NextResponse.json({ treatments });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireRiskAccess(id, "treatment:create");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const body = await request.json();
    const input = TreatmentSchema.parse(body);

    const treatment = await db.orm.Treatment.create({
      id: crypto.randomUUID(),
      riskScenarioId: id,
      name: input.name,
      description: input.description,
      type: input.type,
      implementationCost: input.implementationCost,
      annualCost: input.annualCost,
      tefReduction: input.tefReduction,
      vulnerabilityReduction: input.vulnerabilityReduction,
      lossReduction: input.lossReduction,
      confidence: input.confidence,
    });

    await createAuditLog({
      organizationId: guard.organizationId,
      userId: guard.session.user.id,
      riskScenarioId: id,
      action: "treatment.created",
      newValue: JSON.stringify({ id: treatment.id, name: treatment.name }),
    });

    return NextResponse.json({ treatment }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
