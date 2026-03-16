import { PricingConfig } from "../entities/PricingConfig";
import { InvalidFeeCalculationError } from "../errors/DomainError";

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

  if (durationMs < 0) {
    throw new InvalidFeeCalculationError(
      "Exit time cannot be before entry time",
    );
  }

  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
  const fee = Math.max(
    durationHours * Number(pricing.pricePerHour),
    Number(pricing.minimumCharge),
  );
  return { fee, durationMinutes, durationHours };
}
