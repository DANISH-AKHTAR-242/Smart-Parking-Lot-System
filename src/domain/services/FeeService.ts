import { PricingConfig } from "../entities/PricingConfig";

export interface FeeCalculationInput {
  entryTime: Date;
  exitTime: Date;
  pricing: PricingConfig;
}

export interface FeeCalculationResult {
  fee: number;
  durationMinutes: number;
  durationHours: number;
}

export function calculateFee(input: FeeCalculationInput): FeeCalculationResult {
  const { entryTime, exitTime, pricing } = input;
  const durationMs = exitTime.getTime() - entryTime.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
  const fee = Math.max(
    durationHours * Number(pricing.pricePerHour),
    Number(pricing.minimumCharge),
  );
  return { fee, durationMinutes, durationHours };
}
