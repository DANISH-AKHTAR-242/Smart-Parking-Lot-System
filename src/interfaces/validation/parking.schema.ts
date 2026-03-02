import { z } from "zod";

export const vehicleTypeSchema = z.enum(["MOTORCYCLE", "CAR", "BUS"]);

export const entrySchema = z.object({
  vehicleNumber: z.string().min(1).max(20).trim(),
  vehicleType: vehicleTypeSchema,
});

export const exitSchema = z.object({
  vehicleNumber: z.string().min(1).max(20).trim(),
});

export const updatePricingSchema = z.object({
  vehicleType: vehicleTypeSchema,
  pricePerHour: z.number().positive(),
  minimumCharge: z.number().nonnegative(),
});

export const updateSpotStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "MAINTENANCE"]),
});

export type EntryDTO = z.infer<typeof entrySchema>;
export type ExitDTO = z.infer<typeof exitSchema>;
export type UpdatePricingDTO = z.infer<typeof updatePricingSchema>;
export type UpdateSpotStatusDTO = z.infer<typeof updateSpotStatusSchema>;
