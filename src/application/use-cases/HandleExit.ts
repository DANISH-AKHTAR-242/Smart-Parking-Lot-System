import { db } from "../../infrastructure/db/db";
import * as SessionRepo from "../../infrastructure/repositories/ParkingSessionRepository";
import * as SpotRepo from "../../infrastructure/repositories/ParkingSpotRepository";
import * as PricingRepo from "../../infrastructure/repositories/PricingRepository";
import { calculateFee } from "../../domain/services/FeeService";
import { redis, REDIS_KEYS } from "../../infrastructure/redis/redis";
import { ExitRequestDTO, ExitResponseDTO } from "../dto/parking.dto";

export async function handleExit(
  dto: ExitRequestDTO,
): Promise<ExitResponseDTO> {
  const result = await db.transaction(async (tx) => {
    const session = await SessionRepo.findActiveSessionForUpdate(
      tx,
      dto.vehicleNumber,
    );
    const pricing = await PricingRepo.getPricingForType(
      tx,
      session.vehicleType,
    );

    const exitTime = new Date();
    const { fee, durationMinutes } = calculateFee({
      entryTime: session.entryTime,
      exitTime,
      pricing,
    });

    await SessionRepo.completeSession(tx, session.id, exitTime, fee);
    await SpotRepo.markSpotAvailable(tx, session.spotId!);

    return { session, fee, exitTime, durationMinutes };
  });

  // Update Redis counter
  redis.incr(REDIS_KEYS.available(result.session.vehicleType)).catch(() => {});

  return {
    sessionId: result.session.id,
    totalFee: result.fee,
    entryTime: result.session.entryTime,
    exitTime: result.exitTime,
    durationMinutes: result.durationMinutes,
  };
}
