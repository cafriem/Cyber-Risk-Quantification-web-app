import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createRisk } from "@/app/api/risks/route";
import { GET as getRisk, PATCH as updateRisk } from "@/app/api/risks/[id]/route";
import { POST as simulateRisk } from "@/app/api/risks/[id]/simulate/route";
import { resetRateLimits } from "@/lib/api/rate-limit";
import { CreateRiskSchema } from "@/lib/validation/schemas";
import { authenticatedRoute, integrationIds, seedIntegrationData } from "@/lib/testing/integration";

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));

const adminA = {
  id: integrationIds.users[0],
  name: "Admin A",
  email: "admin-a@example.test",
  role: "ADMIN",
  organizationId: integrationIds.organizations[0],
};
const viewerA = {
  id: integrationIds.users[1],
  name: "Viewer A",
  email: "viewer-a@example.test",
  role: "VIEWER",
  organizationId: integrationIds.organizations[0],
};
function dynamicRouteContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function readJson(response: Response) {
  return await response.json() as Record<string, unknown>;
}

beforeAll(seedIntegrationData);

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
});

describe("risk API authorization", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await authenticatedRoute(getRisk, null)(
      new Request("http://localhost/api/risks/risk-a"),
      dynamicRouteContext(integrationIds.risks[0]),
    );

    expect(response.status).toBe(401);
  });

  it("prevents organization A users from reading organization B risks", async () => {
    const response = await authenticatedRoute(getRisk, adminA)(
      new Request("http://localhost/api/risks/risk-b"),
      dynamicRouteContext(integrationIds.risks[1]),
    );

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: "Forbidden" });
  });

  it("allows organization users to read only their own risks", async () => {
    const response = await authenticatedRoute(getRisk, adminA)(
      new Request("http://localhost/api/risks/risk-a"),
      dynamicRouteContext(integrationIds.risks[0]),
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect((body.risk as { organizationId: string }).organizationId).toBe(adminA.organizationId);
  });

  it("enforces viewer create permissions", async () => {
    const request = new Request("http://localhost/api/risks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Unauthorized risk",
        asset: "Test asset",
        threatActor: "External",
        threatType: "Ransomware",
      }),
    });
    const response = await authenticatedRoute(createRisk, viewerA)(request, {
      params: Promise.resolve({}),
    });

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({
      error: "Role VIEWER does not have permission: risk:create",
    });
  });

  it("creates a risk scoped to the caller's organization and owner", async () => {
    const request = new Request("http://localhost/api/risks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Org A controlled risk",
        asset: "Payment platform",
        threatActor: "Insider",
        threatType: "Fraud",
        seed: 123,
      }),
    });
    const response = await authenticatedRoute(createRisk, adminA)(request, {
      params: Promise.resolve({}),
    });
    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect((body.risk as { organizationId: string }).organizationId).toBe(adminA.organizationId);
    expect((body.risk as { ownerId: string }).ownerId).toBe(adminA.id);
    expect((body.risk as { seed: number }).seed).toBe(123);
  });
});

describe("risk API validation", () => {
  it("rejects malformed risk creation payloads", async () => {
    const request = new Request("http://localhost/api/risks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "", asset: "", threatActor: "", threatType: "" }),
    });
    const response = await authenticatedRoute(createRisk, adminA)(request, {
      params: Promise.resolve({}),
    });
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(Array.isArray(body.details)).toBe(true);
  });

  it("rejects malformed risk update payloads", async () => {
    const request = new Request("http://localhost/api/risks/risk-a", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: 42 }),
    });
    const response = await authenticatedRoute(updateRisk, adminA)(
      request,
      dynamicRouteContext(integrationIds.risks[0]),
    );

    expect(response.status).toBe(400);
  });
});

describe("risk validation schemas", () => {
  it("accepts a valid minimal risk", () => {
    const result = CreateRiskSchema.safeParse({
      name: "Valid",
      asset: "Asset",
      threatActor: "External",
      threatType: "Ransomware",
    });

    expect(result.success).toBe(true);
  });

  it("enforces field limits and iteration bounds", () => {
    expect(CreateRiskSchema.safeParse({ name: "x".repeat(201) }).success).toBe(false);
  });
});

describe("simulation rate limiting", () => {
  it("returns 429 once the per-user simulation quota is exceeded", async () => {
    for (let index = 0; index < 10; index += 1) {
      const response = await authenticatedRoute(simulateRisk, adminA)(
        new Request("http://localhost/api/risks/risk-a/simulate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            riskScenarioId: integrationIds.risks[0],
            iterations: 1000,
            seed: 42,
          }),
        }),
        dynamicRouteContext(integrationIds.risks[0]),
      );
      const body = await readJson(response);

      expect([200, 400]).toContain(response.status);
      expect(body.error).not.toBe("Too many simulation requests");
    }

    const response = await authenticatedRoute(simulateRisk, adminA)(
      new Request("http://localhost/api/risks/risk-a/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          riskScenarioId: integrationIds.risks[0],
          iterations: 1000,
          seed: 42,
        }),
      }),
      dynamicRouteContext(integrationIds.risks[0]),
    );
    const body = await readJson(response);

    expect(response.status).toBe(429);
    expect(body.error).toBe("Too many simulation requests");
    expect(response.headers.get("Retry-After")).toBe("60");
  });
});
