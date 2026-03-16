import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/db";
import { parkingSessions } from "../db/schema";
import {
  ParkingSession,
  SessionStatus,
} from "../../domain/entities/ParkingSession";
import { VehicleType } from "../../domain/entities/ParkingSpot";
import {
  SessionNotFoundError,
  VehicleAlreadyParkedError,
} from "../../domain/errors/DomainError";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function mapRow(row: typeof parkingSessions.$inferSelect): ParkingSession {
  return {
    id: row.id,
    vehicleNumber: row.vehicleNumber,
    vehicleType: row.vehicleType as VehicleType,
    spotId: row.spotId,
    entryTime: row.entryTime,
    exitTime: row.exitTime ?? null,
    totalFee: row.totalFee ?? null,
    status: row.status as SessionStatus,
  };
}

export async function insertSession(
  tx: Transaction,
  data: { vehicleNumber: string; vehicleType: VehicleType; spotId: string },
): Promise<ParkingSession> {
  const inserted = await tx.insert(parkingSessions).values(data).returning();
  return mapRow(inserted[0]);
}

export async function findActiveSessionForUpdate(
  tx: Transaction,
  vehicleNumber: string,
): Promise<ParkingSession> {
  const rows = await tx
    .select()
    .from(parkingSessions)
    .where(
      and(
        eq(parkingSessions.vehicleNumber, vehicleNumber),
        eq(parkingSessions.status, "ACTIVE"),
      ),
    )
    .for("update")
    .limit(1);

  if (rows.length === 0) {
    throw new SessionNotFoundError(vehicleNumber);
  }

  return mapRow(rows[0]);
}

export async function checkNoActiveSession(
  tx: Transaction,
  vehicleNumber: string,
): Promise<void> {
  const rows = await tx
    .select({ id: parkingSessions.id })
    .from(parkingSessions)
    .where(
      and(
        eq(parkingSessions.vehicleNumber, vehicleNumber),
        eq(parkingSessions.status, "ACTIVE"),
      ),
    )
    .for("update")
    .limit(1);

  if (rows.length > 0) {
    throw new VehicleAlreadyParkedError(vehicleNumber);
  }
}

/**
 * Acquires a transaction-scoped advisory lock based on the vehicle number.
 * This serializes concurrent entry requests for the same vehicle,
 * preventing duplicate active sessions even when no existing row exists to lock.
 */
export async function acquireVehicleLock(
  tx: Transaction,
  vehicleNumber: string,
): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${vehicleNumber}))`);
}

export async function completeSession(
  tx: Transaction,
  sessionId: string,
  exitTime: Date,
  totalFee: number,
): Promise<void> {
  await tx
    .update(parkingSessions)
    .set({ exitTime, totalFee: totalFee.toFixed(2), status: "COMPLETED" })
    .where(eq(parkingSessions.id, sessionId));
}

export async function getActiveSessions(): Promise<ParkingSession[]> {
  const rows = await db
    .select()
    .from(parkingSessions)
    .where(eq(parkingSessions.status, "ACTIVE"))
    .orderBy(desc(parkingSessions.entryTime));

  return rows.map(mapRow);
}

export async function getDailyRevenue(date: Date): Promise<number> {
  const { sql } = await import("drizzle-orm");
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const result = await db.execute(sql`
    SELECT COALESCE(SUM(total_fee), 0) AS revenue
    FROM parking_sessions
    WHERE status = 'COMPLETED'
      AND exit_time >= ${start.toISOString()}
      AND exit_time <= ${end.toISOString()}
  `);

  return Number((result.rows[0] as { revenue: string }).revenue);
}
