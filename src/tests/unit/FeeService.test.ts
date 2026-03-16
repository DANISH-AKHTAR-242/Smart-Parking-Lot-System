import { describe, it, expect } from "vitest";
import { calculateFee } from "../../domain/services/FeeService";
import { InvalidFeeCalculationError } from "../../domain/errors/DomainError";
import { PricingConfig } from "../../domain/entities/PricingConfig";

const carPricing: PricingConfig = {
  vehicleType: "CAR",
  pricePerHour: "20.00",
  minimumCharge: "20.00",
};

const motorcyclePricing: PricingConfig = {
  vehicleType: "MOTORCYCLE",
  pricePerHour: "10.00",
  minimumCharge: "10.00",
};

const busPricing: PricingConfig = {
  vehicleType: "BUS",
  pricePerHour: "50.00",
  minimumCharge: "50.00",
};

describe("FeeService - calculateFee", () => {
  it("should charge minimum fee for duration under 1 hour", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T10:30:00Z"); // 30 minutes
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: carPricing,
    });

    expect(result.fee).toBe(20); // 1 hour ceiling * 20 = 20, max(20, 20) = 20
    expect(result.durationMinutes).toBe(30);
    expect(result.durationHours).toBe(1);
  });

  it("should charge per hour using ceiling for fractional hours", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T12:30:00Z"); // 2.5 hours → ceil to 3
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: carPricing,
    });

    expect(result.fee).toBe(60); // 3 * 20 = 60
    expect(result.durationMinutes).toBe(150);
    expect(result.durationHours).toBe(3);
  });

  it("should charge exactly for whole hours", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T12:00:00Z"); // exactly 2 hours
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: carPricing,
    });

    expect(result.fee).toBe(40); // 2 * 20 = 40
    expect(result.durationMinutes).toBe(120);
    expect(result.durationHours).toBe(2);
  });

  it("should apply minimum charge when computed fee is lower", () => {
    const highMinPricing: PricingConfig = {
      vehicleType: "CAR",
      pricePerHour: "5.00",
      minimumCharge: "50.00",
    };
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T11:00:00Z"); // 1 hour

    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: highMinPricing,
    });

    expect(result.fee).toBe(50); // max(5, 50) = 50
  });

  it("should handle zero duration (instant exit) with minimum charge", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T10:00:00Z"); // 0 duration
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: carPricing,
    });

    expect(result.fee).toBe(20); // max(0 * 20, 20) = 20
    expect(result.durationMinutes).toBe(0);
    expect(result.durationHours).toBe(0);
  });

  it("should throw InvalidFeeCalculationError when exit time is before entry time", () => {
    const entry = new Date("2025-01-01T12:00:00Z");
    const exit = new Date("2025-01-01T10:00:00Z"); // before entry

    expect(() =>
      calculateFee({
        entryTime: entry,
        exitTime: exit,
        pricing: carPricing,
      }),
    ).toThrow(InvalidFeeCalculationError);

    expect(() =>
      calculateFee({
        entryTime: entry,
        exitTime: exit,
        pricing: carPricing,
      }),
    ).toThrow("Exit time cannot be before entry time");
  });

  it("should calculate correctly for motorcycle pricing", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T13:00:00Z"); // 3 hours
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: motorcyclePricing,
    });

    expect(result.fee).toBe(30); // 3 * 10 = 30
  });

  it("should calculate correctly for bus pricing", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T12:00:00Z"); // 2 hours
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: busPricing,
    });

    expect(result.fee).toBe(100); // 2 * 50 = 100
  });

  it("should handle long durations correctly", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-02T10:00:00Z"); // 24 hours
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: carPricing,
    });

    expect(result.fee).toBe(480); // 24 * 20 = 480
    expect(result.durationMinutes).toBe(1440);
    expect(result.durationHours).toBe(24);
  });

  it("should handle very short duration (1 minute) by ceiling to 1 hour", () => {
    const entry = new Date("2025-01-01T10:00:00Z");
    const exit = new Date("2025-01-01T10:01:00Z"); // 1 minute
    const result = calculateFee({
      entryTime: entry,
      exitTime: exit,
      pricing: carPricing,
    });

    expect(result.fee).toBe(20); // ceil(1/60) = 1 hour * 20 = 20
    expect(result.durationMinutes).toBe(1);
    expect(result.durationHours).toBe(1);
  });
});
