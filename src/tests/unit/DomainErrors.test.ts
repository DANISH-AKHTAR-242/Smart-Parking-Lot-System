import { describe, it, expect } from "vitest";
import {
  DomainError,
  ParkingFullError,
  SessionNotFoundError,
  VehicleAlreadyParkedError,
  SpotOccupiedError,
  InvalidFeeCalculationError,
} from "../../domain/errors/DomainError";

describe("DomainError classes", () => {
  describe("ParkingFullError", () => {
    it("should have correct code and status", () => {
      const error = new ParkingFullError("CAR");
      expect(error.code).toBe("PARKING_FULL");
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain("CAR");
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe("SessionNotFoundError", () => {
    it("should have correct code and status", () => {
      const error = new SessionNotFoundError("ABC123");
      expect(error.code).toBe("SESSION_NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain("ABC123");
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe("VehicleAlreadyParkedError", () => {
    it("should have correct code and status", () => {
      const error = new VehicleAlreadyParkedError("XYZ789");
      expect(error.code).toBe("VEHICLE_ALREADY_PARKED");
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain("XYZ789");
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe("SpotOccupiedError", () => {
    it("should have correct code and status", () => {
      const error = new SpotOccupiedError("spot-123");
      expect(error.code).toBe("SPOT_OCCUPIED");
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain("spot-123");
      expect(error.message).toContain("occupied");
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe("InvalidFeeCalculationError", () => {
    it("should have correct code and status", () => {
      const error = new InvalidFeeCalculationError("test message");
      expect(error.code).toBe("INVALID_FEE_CALCULATION");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("test message");
      expect(error).toBeInstanceOf(DomainError);
    });
  });
});
