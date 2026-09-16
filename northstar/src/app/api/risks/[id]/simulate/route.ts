import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { requireRiskAccess } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/auth/audit";
import { SimulationRequestSchema } from "@/lib/validation/schemas";
import { runMonteCarlo, exceedanceProbability } from "@/lib/engine";
import type { TriangularParams, UniformParams, NormalParams, LognormalParams, PertParams } from "@/lib/engine";
import { ZodError } from "zod";

function toDistributionParams(record: {
  type: string;
  min: number | null;
  mode: number | null;
  max: number | null;
  mean: number | null;
  standardDeviation: number | null;
  lambda: number | null;
}) {
  switch (record.type) {
    case "TRIANGULAR":
      return { type: "triangular", min: record.min ?? 0, mode: record.mode ?? 0, max: record.max ?? 0 } as TriangularParams;
    case "UNIFORM":
      return { type: "uniform", min: record.min ?? 0, max: record.max ?? 0 } as UniformParams;
    case "NORMAL":
      return { type: "normal", mean: record.mean ?? 0, standardDeviation: record.standardDeviation ?? 0 } as NormalParams;
    case "LOGNORMAL":
      return { type: "lognormal", mean: record.mean ?? 0, standardDeviation: record.standardDeviation ?? 0 } as LognormalParams;
    case "PERT":
      return { type: "pert", min: record.min ?? 0, mode: record.mode ?? 0, max: record.max ?? 0, lambda: record.lambda ?? 4 } as PertParams;
    default:
      return { type: "triangular", min: record.min ?? 0, mode: record.mode ?? 0, max: record.max ?? 0 } as TriangularParams;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireRiskAccess(id, "simulation:run");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const body = await request.json();
    const input = SimulationRequestSchema.parse(body);

    const distributions = await db.orm.Distribution
      .where({ riskScenarioId: id })
      .all();

    const tefRecord = distributions.find((d) => (d as { target: string }).target === "tef");
    const vulnRecord = distributions.find((d) => (d as { target: string }).target === "vulnerability");
    const lossRecord = distributions.find((d) => (d as { target: string }).target === "loss");

    if (!tefRecord || !vulnRecord || !lossRecord) {
      return NextResponse.json({ error: "Missing distribution definitions" }, { status: 400 });
    }

    let treatment: { tefReduction?: number; vulnerabilityReduction?: number; lossReduction?: number } | undefined;
    if (input.treatmentId) {
      const t = await db.orm.Treatment
        .where({ id: input.treatmentId, riskScenarioId: id })
        .first();
      if (t) {
        treatment = {
          tefReduction: (t as { tefReduction?: number }).tefReduction ?? undefined,
          vulnerabilityReduction: (t as { vulnerabilityReduction?: number }).vulnerabilityReduction ?? undefined,
          lossReduction: (t as { lossReduction?: number }).lossReduction ?? undefined,
        };
      }
    }

    const result = runMonteCarlo({
      tef: toDistributionParams(tefRecord as never),
      vulnerability: toDistributionParams(vulnRecord as never),
      loss: toDistributionParams(lossRecord as never),
      iterations: input.iterations,
      seed: input.seed ?? (guard.risk as { seed: number }).seed,
      treatment,
    });

    const threshold = 500000;
    const exceedance = exceedanceProbability(result.losses, threshold);

    const simulation = await db.orm.SimulationResult.create({
      riskScenarioId: id,
      inherent: input.treatmentId ? 0 : 1,
      seed: input.seed ?? (guard.risk as { seed: number }).seed,
      iterations: result.iterations,
      mean: result.mean,
      median: result.median,
      p75: result.p75,
      p90: result.p90,
      p95: result.p95,
      p99: result.p99,
      max: result.max,
      histogramData: JSON.stringify(result.histogram),
      losses: JSON.stringify(result.losses),
    });

    await createAuditLog({
      organizationId: guard.organizationId,
      userId: guard.session.user.id,
      riskScenarioId: id,
      action: "simulation.performed",
      newValue: JSON.stringify({ iterations: result.iterations, mean: result.mean }),
    });

    return NextResponse.json({
      simulation: { id: simulation.id },
      summary: {
        mean: result.mean,
        median: result.median,
        p75: result.p75,
        p90: result.p90,
        p95: result.p95,
        p99: result.p99,
        max: result.max,
      },
      histogram: result.histogram,
      exceedance,
      threshold,
      iterations: result.iterations,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
