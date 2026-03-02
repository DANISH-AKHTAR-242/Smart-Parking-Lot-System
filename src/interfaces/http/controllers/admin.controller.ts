import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";
import {
  UpdatePricingDTO,
  UpdateSpotStatusDTO,
} from "../../validation/parking.schema";

export const getOccupancy = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await adminService.getOccupancyByFloor();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getActiveSessions = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await adminService.getActiveSessions();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getPricing = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await adminService.getAllPricing();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updatePricing = async (
  req: Request<object, object, UpdatePricingDTO>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { vehicleType, pricePerHour, minimumCharge } = req.body;
    const result = await adminService.updatePricing(
      vehicleType,
      pricePerHour,
      minimumCharge,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const setSpotStatus = async (
  req: Request<{ spotId: string }, object, UpdateSpotStatusDTO>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await adminService.setSpotStatus(req.params.spotId, req.body.status);
    res.json({ message: "Spot status updated" });
  } catch (err) {
    next(err);
  }
};

export const getDailyRevenue = async (
  req: Request<object, object, object, { date?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await adminService.getDailyRevenue(date);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAvailability = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await adminService.getAvailabilityStats();
    res.json(data);
  } catch (err) {
    next(err);
  }
};
