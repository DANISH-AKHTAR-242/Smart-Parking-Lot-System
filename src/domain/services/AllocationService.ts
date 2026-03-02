import { VehicleType } from "../entities/ParkingSpot";

/**
 * Maps a vehicle type to the corresponding parking spot type.
 * Strategy: strict type matching only (MOTORCYCLE→MOTORCYCLE, CAR→CAR, BUS→BUS).
 */
export function resolveRequiredSpotType(vehicleType: VehicleType): VehicleType {
  return vehicleType;
}
