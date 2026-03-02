import * as SpotRepo from "../../../infrastructure/repositories/ParkingSpotRepository";
import * as SessionRepo from "../../../infrastructure/repositories/ParkingSessionRepository";
import * as PricingRepo from "../../../infrastructure/repositories/PricingRepository";
import { redis, REDIS_KEYS } from "../../../infrastructure/redis/redis";
import { VehicleType } from "../../../domain/entities/ParkingSpot";

export async function getOccupancyByFloor() {
  return SpotRepo.getOccupancyByFloor();
}

export async function getActiveSessions() {
  return SessionRepo.getActiveSessions();
}

export async function getAllPricing() {
  return PricingRepo.getAllPricing();
}

export async function updatePricing(
  vehicleType: VehicleType,
  pricePerHour: number,
  minimumCharge: number,
) {
  return PricingRepo.upsertPricing(vehicleType, pricePerHour, minimumCharge);
}

export async function setSpotStatus(
  spotId: string,
  status: "AVAILABLE" | "MAINTENANCE",
): Promise<void> {
  await SpotRepo.updateSpotStatus(spotId, status);
}

export async function getDailyRevenue(
  date: Date,
): Promise<{ date: string; revenue: number }> {
  const revenue = await SessionRepo.getDailyRevenue(date);
  return { date: date.toISOString().split("T")[0], revenue };
}

export async function getAvailabilityStats() {
  const [dbCounts, redisCounts] = await Promise.all([
    SpotRepo.getAvailableCountByType(),
    getRedisAvailability(),
  ]);
  return { db: dbCounts, redis: redisCounts };
}

async function getRedisAvailability(): Promise<
  Record<VehicleType, number | null>
> {
  const types: VehicleType[] = ["MOTORCYCLE", "CAR", "BUS"];
  const values = await Promise.all(
    types.map(async (t) => {
      try {
        const val = await redis.get(REDIS_KEYS.available(t));
        return val !== null ? Number(val) : null;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(types.map((t, i) => [t, values[i]])) as Record<
    VehicleType,
    number | null
  >;
}
