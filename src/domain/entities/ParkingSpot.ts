export type VehicleType = "MOTORCYCLE" | "CAR" | "BUS";
export type SpotStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export interface ParkingSpot {
  id: string;
  floorId: string | null;
  spotNumber: string;
  spotType: VehicleType;
  status: SpotStatus;
}
