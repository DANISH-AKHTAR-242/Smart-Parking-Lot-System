import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { parkingFloors, parkingSpots, pricingConfigs } from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

const FLOORS = 5;
const SPOTS_PER_FLOOR = {
  MOTORCYCLE: 20,
  CAR: 30,
  BUS: 10,
};

const PRICING = [
  {
    vehicleType: "MOTORCYCLE" as const,
    pricePerHour: "10.00",
    minimumCharge: "10.00",
  },
  {
    vehicleType: "CAR" as const,
    pricePerHour: "20.00",
    minimumCharge: "20.00",
  },
  {
    vehicleType: "BUS" as const,
    pricePerHour: "50.00",
    minimumCharge: "50.00",
  },
];

async function seed() {
  console.log("Seeding database...");

  // Upsert pricing configs
  for (const pricing of PRICING) {
    await db
      .insert(pricingConfigs)
      .values(pricing)
      .onConflictDoUpdate({
        target: pricingConfigs.vehicleType,
        set: {
          pricePerHour: pricing.pricePerHour,
          minimumCharge: pricing.minimumCharge,
        },
      });
  }
  console.log("Pricing configs seeded.");

  // Insert floors and spots
  for (let f = 1; f <= FLOORS; f++) {
    const [floor] = await db
      .insert(parkingFloors)
      .values({ floorNumber: f })
      .onConflictDoNothing()
      .returning();

    if (!floor) {
      console.log(`Floor ${f} already exists, skipping spots.`);
      continue;
    }

    const spotsToInsert: (typeof parkingSpots.$inferInsert)[] = [];

    const types = ["MOTORCYCLE", "CAR", "BUS"] as const;
    for (const type of types) {
      const count = SPOTS_PER_FLOOR[type];
      const prefix = type === "MOTORCYCLE" ? "M" : type === "CAR" ? "C" : "B";
      for (let s = 1; s <= count; s++) {
        spotsToInsert.push({
          floorId: floor.id,
          spotNumber: `${prefix}${f}${String(s).padStart(3, "0")}`,
          spotType: type,
          status: "AVAILABLE",
        });
      }
    }

    await db.insert(parkingSpots).values(spotsToInsert);
    console.log(`Floor ${f} seeded with ${spotsToInsert.length} spots.`);
  }

  console.log("Seeding complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
