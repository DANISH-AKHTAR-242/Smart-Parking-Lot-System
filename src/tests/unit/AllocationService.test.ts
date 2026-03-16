import { describe, it, expect } from "vitest";
import {
  resolveRequiredSpotType,
  validateVehicleType,
} from "../../domain/services/AllocationService";

describe("AllocationService", () => {
  describe("validateVehicleType", () => {
    it("should accept MOTORCYCLE as a valid type", () => {
      expect(() => validateVehicleType("MOTORCYCLE")).not.toThrow();
    });

    it("should accept CAR as a valid type", () => {
      expect(() => validateVehicleType("CAR")).not.toThrow();
    });

    it("should accept BUS as a valid type", () => {
      expect(() => validateVehicleType("BUS")).not.toThrow();
    });

    it("should reject unknown vehicle type", () => {
      expect(() => validateVehicleType("TRUCK")).toThrow(
        "Unknown vehicle type: TRUCK",
      );
    });

    it("should reject empty string", () => {
      expect(() => validateVehicleType("")).toThrow("Unknown vehicle type: ");
    });

    it("should be case-sensitive", () => {
      expect(() => validateVehicleType("car")).toThrow(
        "Unknown vehicle type: car",
      );
    });
  });

  describe("resolveRequiredSpotType", () => {
    it("should resolve MOTORCYCLE to MOTORCYCLE spot type", () => {
      expect(resolveRequiredSpotType("MOTORCYCLE")).toBe("MOTORCYCLE");
    });

    it("should resolve CAR to CAR spot type", () => {
      expect(resolveRequiredSpotType("CAR")).toBe("CAR");
    });

    it("should resolve BUS to BUS spot type", () => {
      expect(resolveRequiredSpotType("BUS")).toBe("BUS");
    });
  });
});
