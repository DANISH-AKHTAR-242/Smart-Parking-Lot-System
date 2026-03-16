import { VehicleType } from "../entities/ParkingSpot";

const VALID_VEHICLE_TYPES: ReadonlySet<string> = new Set<VehicleType>([
  "MOTORCYCLE",
  "CAR",
  "BUS",
]);

/**
 * Validates that the given vehicle type is a known, allocatable type.
 * Throws if the vehicle type is invalid.
 */
export function validateVehicleType(vehicleType: string): asserts vehicleType is VehicleType {
  if (!VALID_VEHICLE_TYPES.has(vehicleType)) {
    throw new Error(`Unknown vehicle type: ${vehicleType}`);
  }
}

/**
 * Maps a vehicle type to the corresponding parking spot type.
 * Validates the input and applies allocation rules.
 * Strategy: strict type matching only (MOTORCYCLE→MOTORCYCLE, CAR→CAR, BUS→BUS).
 */
export function resolveRequiredSpotType(vehicleType: VehicleType): VehicleType {
  validateVehicleType(vehicleType);
  return vehicleType;
}
