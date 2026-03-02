import { VehicleType } from "./ParkingSpot";

export type SessionStatus = "ACTIVE" | "COMPLETED";

export interface ParkingSession {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  spotId: string | null;
  entryTime: Date;
  exitTime: Date | null;
  totalFee: string | null;
  status: SessionStatus;
}
