import { z } from "zod";

export const RoleSchema = z.enum([
  "ADMIN",
  "RISK_MANAGER",
  "ANALYST",
  "VIEWER",
  "EXECUTIVE",
]);

export const RiskStatusSchema = z.enum([
  "DRAFT",
  "QUANTIFYING",
  "ASSESSED",
  "TREATMENT_PLANNED",
  "TREATMENT_IN_PROGRESS",
  "MONITORING",
  "ACCEPTED",
  "TRANSFERRED",
  "AVOIDED",
  "CLOSED",
]);

export const DistributionTypeSchema = z.enum([
  "TRIANGULAR",
  "UNIFORM",
  "NORMAL",
  "LOGNORMAL",
  "PERT",
]);

export const ConfidenceSchema = z.enum([
  "VERY_LOW",
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
]);

export const ControlEffectivenessSchema = z.enum([
  "INEFFECTIVE",
  "PARTIALLY_EFFECTIVE",
  "EFFECTIVE",
  "HIGHLY_EFFECTIVE",
]);

export const TreatmentTypeSchema = z.enum([
  "MITIGATE",
  "TRANSFER",
  "AVOID",
  "ACCEPT",
]);

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  organizationName: z.string().min(1).max(200).optional(),
});

export const DistributionSchema = z.object({
  target: z.enum(["tef", "vulnerability", "loss"]),
  type: DistributionTypeSchema,
  min: z.number().min(0).optional(),
  mode: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  mean: z.number().optional(),
  standardDeviation: z.number().min(0).optional(),
  lambda: z.number().positive().optional(),
  confidence: ConfidenceSchema.default("MEDIUM"),
  dataSource: z.string().max(500).default(""),
  notes: z.string().max(2000).default(""),
});

export const CreateRiskSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  asset: z.string().min(1).max(200),
  businessProcess: z.string().max(200).default(""),
  threatActor: z.string().min(1).max(100),
  threatType: z.string().min(1).max(100),
  department: z.string().max(200).default(""),
  businessOwnerId: z.string().max(200).default(""),
  seed: z.number().int().min(0).optional(),
  distributions: z.array(DistributionSchema).optional(),
});

export const UpdateRiskSchema = CreateRiskSchema.partial();

export const TreatmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  type: TreatmentTypeSchema.default("MITIGATE"),
  implementationCost: z.number().min(0),
  annualCost: z.number().min(0),
  tefReduction: z.number().min(0).max(1).optional(),
  vulnerabilityReduction: z.number().min(0).max(1).optional(),
  lossReduction: z.number().min(0).max(1).optional(),
  confidence: ConfidenceSchema.default("MEDIUM"),
});

export const SimulationRequestSchema = z.object({
  riskScenarioId: z.string().min(1),
  iterations: z.number().int().min(1000).max(1000000).default(100000),
  seed: z.number().int().min(0).optional(),
  treatmentId: z.string().optional(),
});

export const ThresholdSchema = z.object({
  threshold: z.number().min(0),
});

export const AcceptRiskSchema = z.object({
  riskScenarioId: z.string().min(1),
  expirationDate: z.string().datetime().optional(),
  reason: z.string().min(1).max(2000),
  comments: z.string().max(2000).default(""),
});

export const ControlSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  ownerId: z.string().max(200).default(""),
  implementationStatus: z.string().max(100).default("Planned"),
  effectiveness: ControlEffectivenessSchema.default("EFFECTIVE"),
  cost: z.number().min(0).default(0),
  annualOperatingCost: z.number().min(0).default(0),
});

export const OrgSettingsSchema = z.object({
  currency: z.enum(["USD", "AED", "EUR", "GBP", "SAR"]).default("USD"),
  fiscalYear: z.number().int().min(2000).max(2100).default(2026),
  iterations: z.number().int().min(1000).max(1000000).default(100000),
});

export type Role = z.infer<typeof RoleSchema>;
export type RiskStatus = z.infer<typeof RiskStatusSchema>;
export type DistributionType = z.infer<typeof DistributionTypeSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type CreateRiskInput = z.infer<typeof CreateRiskSchema>;
export type UpdateRiskInput = z.infer<typeof UpdateRiskSchema>;
export type TreatmentInput = z.infer<typeof TreatmentSchema>;
export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;
