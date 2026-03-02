import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Use a unique vehicle number per test run to avoid conflicts
const vehicleNumber = `TEST${Date.now()}`;
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === "true";
const describeIntegration = runIntegrationTests ? describe : describe.skip;
let app: unknown;
let pool: any = null;
let redis: any = null;

beforeAll(async () => {
  if (!runIntegrationTests) return;
  app = (await import("../../app")).app;
  pool = (await import("../../infrastructure/db/db")).pool;
  redis = (await import("../../infrastructure/redis/redis")).redis;
  await pool.query("SELECT 1");
  if (redis.status !== "ready") {
    await redis.connect();
  }
});

afterAll(async () => {
  if (!runIntegrationTests) return;
  try {
    await pool?.end();
  } finally {
    await redis?.quit();
  }
});

describeIntegration("Parking Integration Flow", () => {
  it("should return 200 on health check", async () => {
    const res = await request(app as Parameters<typeof request>[0]).get(
      "/health",
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("should reject entry with invalid payload", async () => {
    const res = await request(app as Parameters<typeof request>[0])
      .post("/api/entry")
      .send({ vehicleNumber: "", vehicleType: "TRUCK" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("should allocate a parking spot on entry", async () => {
    const res = await request(app as Parameters<typeof request>[0])
      .post("/api/entry")
      .send({ vehicleNumber, vehicleType: "CAR" });

    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.spotId).toBeDefined();
    expect(res.body.spotNumber).toBeDefined();
    expect(res.body.entryTime).toBeDefined();
  });

  it("should reject duplicate entry for same vehicle", async () => {
    const res = await request(app as Parameters<typeof request>[0])
      .post("/api/entry")
      .send({ vehicleNumber, vehicleType: "CAR" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("VEHICLE_ALREADY_PARKED");
  });

  it("should reject exit for unknown vehicle", async () => {
    const res = await request(app as Parameters<typeof request>[0])
      .post("/api/exit")
      .send({ vehicleNumber: "UNKNOWN_VEHICLE_XYZ" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SESSION_NOT_FOUND");
  });

  it("should calculate fee and release spot on exit", async () => {
    const res = await request(app as Parameters<typeof request>[0])
      .post("/api/exit")
      .send({ vehicleNumber });

    expect(res.status).toBe(200);
    expect(res.body.totalFee).toBeGreaterThan(0);
    expect(res.body.entryTime).toBeDefined();
    expect(res.body.exitTime).toBeDefined();
    expect(typeof res.body.durationMinutes).toBe("number");
  });

  it("should reject exit after session is completed", async () => {
    const res = await request(app as Parameters<typeof request>[0])
      .post("/api/exit")
      .send({ vehicleNumber });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SESSION_NOT_FOUND");
  });
});

describeIntegration("Admin APIs", () => {
  it("should return floor occupancy", async () => {
    const res = await request(app as Parameters<typeof request>[0]).get(
      "/api/admin/occupancy",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return active sessions", async () => {
    const res = await request(app as Parameters<typeof request>[0]).get(
      "/api/admin/sessions/active",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return all pricing configs", async () => {
    const res = await request(app as Parameters<typeof request>[0]).get(
      "/api/admin/pricing",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should return daily revenue report", async () => {
    const res = await request(app as Parameters<typeof request>[0]).get(
      "/api/admin/reports/revenue",
    );
    expect(res.status).toBe(200);
    expect(typeof res.body.revenue).toBe("number");
  });
});
