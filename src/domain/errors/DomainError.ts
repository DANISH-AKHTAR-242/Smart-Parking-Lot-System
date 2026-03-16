export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ParkingFullError extends DomainError {
  constructor(vehicleType: string) {
    super(
      `No available spots for vehicle type: ${vehicleType}`,
      "PARKING_FULL",
      409,
    );
  }
}

export class SessionNotFoundError extends DomainError {
  constructor(vehicleNumber: string) {
    super(
      `No active session found for vehicle: ${vehicleNumber}`,
      "SESSION_NOT_FOUND",
      404,
    );
  }
}

export class VehicleAlreadyParkedError extends DomainError {
  constructor(vehicleNumber: string) {
    super(
      `Vehicle ${vehicleNumber} already has an active session`,
      "VEHICLE_ALREADY_PARKED",
      409,
    );
  }
}

export class SpotOccupiedError extends DomainError {
  constructor(spotId: string) {
    super(
      `Spot ${spotId} is currently occupied and cannot be modified`,
      "SPOT_OCCUPIED",
      409,
    );
  }
}

export class InvalidFeeCalculationError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_FEE_CALCULATION", 400);
  }
}
