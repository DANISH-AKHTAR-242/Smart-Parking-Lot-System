import { Router } from "express";
import {
  getOccupancy,
  getActiveSessions,
  getPricing,
  updatePricing,
  setSpotStatus,
  getDailyRevenue,
  getAvailability,
} from "../controllers/admin.controller";
import { validate } from "../middleware/validate.middleware";
import {
  updatePricingSchema,
  updateSpotStatusSchema,
} from "../../validation/parking.schema";

const router = Router();

// Occupancy & sessions
router.get("/occupancy", getOccupancy);
router.get("/sessions/active", getActiveSessions);

// Availability
router.get("/availability", getAvailability);

// Pricing
router.get("/pricing", getPricing);
router.put("/pricing", validate(updatePricingSchema), updatePricing);

// Spot management (maintenance)
router.patch(
  "/spots/:spotId/status",
  validate(updateSpotStatusSchema),
  setSpotStatus,
);

// Reporting
router.get("/reports/revenue", getDailyRevenue);

export default router;
