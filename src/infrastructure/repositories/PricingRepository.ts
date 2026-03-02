import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { pricingConfigs } from "../db/schema";
import { PricingConfig } from "../../domain/entities/PricingConfig";
import { VehicleType } from "../../domain/entities/ParkingSpot";
import { DomainError } from "../../domain/errors/DomainError";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function mapRow(row: typeof pricingConfigs.$inferSelect): PricingConfig {
  return {
    vehicleType: row.vehicleType as VehicleType,
    pricePerHour: row.pricePerHour,
    minimumCharge: row.minimumCharge,
  };
}

export async function getPricingForType(
  tx: Transaction,
  vehicleType: VehicleType,
): Promise<PricingConfig> {
  const rows = await tx
    .select()
    .from(pricingConfigs)
    .where(eq(pricingConfigs.vehicleType, vehicleType));

  if (rows.length === 0) {
    throw new DomainError(
      `No pricing config found for type: ${vehicleType}`,
      "PRICING_NOT_FOUND",
      500,
    );
  }

  return mapRow(rows[0]);
}

export async function getAllPricing(): Promise<PricingConfig[]> {
  const rows = await db.select().from(pricingConfigs);
  return rows.map(mapRow);
}

export async function upsertPricing(
  vehicleType: VehicleType,
  pricePerHour: number,
  minimumCharge: number,
): Promise<PricingConfig> {
  const rows = await db
    .insert(pricingConfigs)
    .values({
      vehicleType,
      pricePerHour: pricePerHour.toFixed(2),
      minimumCharge: minimumCharge.toFixed(2),
    })
    .onConflictDoUpdate({
      target: pricingConfigs.vehicleType,
      set: {
        pricePerHour: pricePerHour.toFixed(2),
        minimumCharge: minimumCharge.toFixed(2),
      },
    })
    .returning();

  return mapRow(rows[0]);
}
