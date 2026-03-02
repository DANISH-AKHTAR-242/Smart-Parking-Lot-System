import { VehicleType } from "./ParkingSpot";

export interface PricingConfig {
  vehicleType: VehicleType;
  pricePerHour: string;
  minimumCharge: string;
}
