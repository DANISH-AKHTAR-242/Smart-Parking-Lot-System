import { db } from "../../infrastructure/db/db";
import * as SpotRepo from "../../infrastructure/repositories/ParkingSpotRepository";
import * as SessionRepo from "../../infrastructure/repositories/ParkingSessionRepository";
import { redis, REDIS_KEYS } from "../../infrastructure/redis/redis";
import { EntryRequestDTO, EntryResponseDTO } from "../dto/parking.dto";

export async function handleEntry(
  dto: EntryRequestDTO,
): Promise<EntryResponseDTO> {
  const result = await db.transaction(async (tx) => {
    // Guard: no duplicate active session for this vehicle
    await SessionRepo.checkNoActiveSession(tx, dto.vehicleNumber);

    // Allocate spot atomically
    const spot = await SpotRepo.findAndLockAvailableSpot(tx, dto.vehicleType);
    await SpotRepo.markSpotOccupied(tx, spot.id);

    // Create session
    const session = await SessionRepo.insertSession(tx, {
      vehicleNumber: dto.vehicleNumber,
      vehicleType: dto.vehicleType,
      spotId: spot.id,
    });

    return { session, spot };
  });

  // Update Redis counter (fire-and-forget, DB is source of truth)
  redis.decr(REDIS_KEYS.available(dto.vehicleType)).catch(() => {});

  return {
    sessionId: result.session.id,
    spotId: result.spot.id,
    spotNumber: result.spot.spotNumber,
    entryTime: result.session.entryTime,
  };
}
