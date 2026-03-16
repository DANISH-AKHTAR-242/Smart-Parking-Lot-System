import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  numeric,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "MOTORCYCLE",
  "CAR",
  "BUS",
]);
export const spotStatusEnum = pgEnum("spot_status", [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "ACTIVE",
  "COMPLETED",
]);

export const parkingFloors = pgTable("parking_floors", {
  id: uuid("id").defaultRandom().primaryKey(),
  floorNumber: integer("floor_number").unique().notNull(),
});

export const parkingSpots = pgTable(
  "parking_spots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    floorId: uuid("floor_id").references(() => parkingFloors.id),
    spotNumber: varchar("spot_number", { length: 20 }).notNull(),
    spotType: vehicleTypeEnum("spot_type").notNull(),
    status: spotStatusEnum("status").default("AVAILABLE").notNull(),
  },
  (table) => ({
    spotTypeStatusIdx: index("idx_spot_type_status").on(
      table.spotType,
      table.status,
    ),
  }),
);

export const parkingSessions = pgTable(
  "parking_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleNumber: varchar("vehicle_number", { length: 20 }).notNull(),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
    spotId: uuid("spot_id").references(() => parkingSpots.id),
    entryTime: timestamp("entry_time").defaultNow().notNull(),
    exitTime: timestamp("exit_time"),
    totalFee: numeric("total_fee", { precision: 10, scale: 2 }),
    status: sessionStatusEnum("status").default("ACTIVE").notNull(),
  },
  (table) => ({
    sessionVehicleStatusIdx: index("idx_session_vehicle_status").on(
      table.vehicleNumber,
      table.status,
    ),
    uniqueActiveVehicleIdx: uniqueIndex("idx_unique_active_vehicle")
      .on(table.vehicleNumber)
      .where(sql`status = 'ACTIVE'`),
  }),
);

export const pricingConfigs = pgTable("pricing_configs", {
  vehicleType: vehicleTypeEnum("vehicle_type").primaryKey(),
  pricePerHour: numeric("price_per_hour", {
    precision: 10,
    scale: 2,
  }).notNull(),
  minimumCharge: numeric("minimum_charge", {
    precision: 10,
    scale: 2,
  }).notNull(),
});
