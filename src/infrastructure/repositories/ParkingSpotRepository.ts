import { sql, eq, and } from "drizzle-orm";
import { db } from "../db/db";
import { parkingSpots } from "../db/schema";
import { ParkingSpot, VehicleType } from "../../domain/entities/ParkingSpot";
import { ParkingFullError, SpotOccupiedError, SpotNotFoundError } from "../../domain/errors/DomainError";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function findAndLockAvailableSpot(
  tx: Transaction,
  vehicleType: VehicleType,
): Promise<ParkingSpot> {
  const result = await tx.execute(sql`
    SELECT ps.id, ps.floor_id, ps.spot_number, ps.spot_type, ps.status
    FROM parking_spots ps
    JOIN parking_floors pf ON pf.id = ps.floor_id
    WHERE ps.spot_type = ${vehicleType}
      AND ps.status = 'AVAILABLE'
    ORDER BY pf.floor_number, ps.spot_number
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    throw new ParkingFullError(vehicleType);
  }

  const row = result.rows[0] as {
    id: string;
    floor_id: string | null;
    spot_number: string;
    spot_type: VehicleType;
    status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  };

  return {
    id: row.id,
    floorId: row.floor_id,
    spotNumber: row.spot_number,
    spotType: row.spot_type,
    status: row.status,
  };
}

export async function markSpotOccupied(
  tx: Transaction,
  spotId: string,
): Promise<void> {
  await tx
    .update(parkingSpots)
    .set({ status: "OCCUPIED" })
    .where(eq(parkingSpots.id, spotId));
}

export async function markSpotAvailable(
  tx: Transaction,
  spotId: string,
): Promise<void> {
  await tx
    .update(parkingSpots)
    .set({ status: "AVAILABLE" })
    .where(eq(parkingSpots.id, spotId));
}

export async function updateSpotStatus(
  spotId: string,
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE",
): Promise<void> {
  // Only allow transitions from non-OCCUPIED states.
  // OCCUPIED spots must be freed through the normal exit flow.
  const result = await db
    .update(parkingSpots)
    .set({ status })
    .where(
      and(
        eq(parkingSpots.id, spotId),
        sql`${parkingSpots.status} != 'OCCUPIED'`,
      ),
    )
    .returning({ id: parkingSpots.id });

  if (result.length === 0) {
    // Determine whether the spot doesn't exist or is occupied
    const existing = await db
      .select({ status: parkingSpots.status })
      .from(parkingSpots)
      .where(eq(parkingSpots.id, spotId))
      .limit(1);

    if (existing.length === 0) {
      throw new SpotNotFoundError(spotId);
    }

    if (existing[0].status === "OCCUPIED") {
      throw new SpotOccupiedError(spotId);
    }
  }
}

export async function getOccupancyByFloor(): Promise<
  {
    floorNumber: number;
    total: number;
    occupied: number;
    available: number;
    maintenance: number;
  }[]
> {
  const result = await db.execute(sql`
    SELECT
      pf.floor_number,
      COUNT(ps.id) AS total,
      SUM(CASE WHEN ps.status = 'OCCUPIED' THEN 1 ELSE 0 END) AS occupied,
      SUM(CASE WHEN ps.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN ps.status = 'MAINTENANCE' THEN 1 ELSE 0 END) AS maintenance
    FROM parking_floors pf
    LEFT JOIN parking_spots ps ON ps.floor_id = pf.id
    GROUP BY pf.floor_number
    ORDER BY pf.floor_number
  `);

  return result.rows.map((r) => ({
    floorNumber: Number(r.floor_number),
    total: Number(r.total),
    occupied: Number(r.occupied),
    available: Number(r.available),
    maintenance: Number(r.maintenance),
  }));
}

export async function getAvailableCountByType(): Promise<
  Record<VehicleType, number>
> {
  const result = await db.execute(sql`
    SELECT spot_type, COUNT(*) AS cnt
    FROM parking_spots
    WHERE status = 'AVAILABLE'
    GROUP BY spot_type
  `);

  const counts: Record<VehicleType, number> = { MOTORCYCLE: 0, CAR: 0, BUS: 0 };
  for (const row of result.rows as { spot_type: VehicleType; cnt: string }[]) {
    counts[row.spot_type] = Number(row.cnt);
  }
  return counts;
}
