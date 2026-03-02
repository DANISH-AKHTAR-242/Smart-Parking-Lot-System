import cron from "node-cron";
import { redis, REDIS_KEYS } from "../infrastructure/redis/redis";
import { getAvailableCountByType } from "../infrastructure/repositories/ParkingSpotRepository";
import { VehicleType } from "../domain/entities/ParkingSpot";

const VEHICLE_TYPES: VehicleType[] = ["MOTORCYCLE", "CAR", "BUS"];

/**
 * Initializes Redis availability counters from the database.
 * Called on server startup.
 */
export async function initRedisCounters(): Promise<void> {
  const counts = await getAvailableCountByType();
  await Promise.all(
    VEHICLE_TYPES.map((type) =>
      redis.set(REDIS_KEYS.available(type), counts[type]),
    ),
  );
}

/**
 * Reconciles Redis counters against the database.
 * Auto-corrects any drift (e.g., from a crash or missed update).
 */
async function reconcile(): Promise<void> {
  try {
    const dbCounts = await getAvailableCountByType();

    for (const type of VEHICLE_TYPES) {
      const redisVal = await redis.get(REDIS_KEYS.available(type));
      const dbVal = dbCounts[type];

      if (redisVal === null || Number(redisVal) !== dbVal) {
        console.log(
          `[Reconciliation] Correcting ${type}: redis=${redisVal} → db=${dbVal}`,
        );
        await redis.set(REDIS_KEYS.available(type), dbVal);
      }
    }
  } catch (err) {
    console.error("[Reconciliation] Failed:", err);
  }
}

/**
 * Schedules the reconciliation job to run every 5 minutes.
 */
export function startReconciliationJob(): void {
  cron.schedule("*/5 * * * *", () => {
    reconcile().catch((err) =>
      console.error("[Reconciliation] Unhandled error:", err),
    );
  });
  console.log("[Reconciliation] Job scheduled (every 5 minutes)");
}
