import { VehicleType } from "../../domain/entities/ParkingSpot";

// Entry
export interface EntryRequestDTO {
  vehicleNumber: string;
  vehicleType: VehicleType;
}

export interface EntryResponseDTO {
  sessionId: string;
  spotId: string;
  spotNumber: string;
  entryTime: Date;
}

// Exit
export interface ExitRequestDTO {
  vehicleNumber: string;
}

export interface ExitResponseDTO {
  sessionId: string;
  totalFee: number;
  entryTime: Date;
  exitTime: Date;
  durationMinutes: number;
}
