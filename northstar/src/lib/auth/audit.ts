import { db } from "../db/prisma";

export async function createAuditLog(entry: {
  organizationId: string;
  userId: string;
  riskScenarioId?: string;
  action: string;
  oldValue?: string;
  newValue?: string;
}): Promise<void> {
  await db.orm.AuditLog.create({
    id: crypto.randomUUID(),
    organizationId: entry.organizationId,
    userId: entry.userId,
    riskScenarioId: entry.riskScenarioId,
    action: entry.action,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
  });
}
