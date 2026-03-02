import { Request, Response, NextFunction } from "express";
import { handleEntry } from "../../../application/use-cases/HandleEntry";
import { handleExit } from "../../../application/use-cases/HandleExit";
import { EntryDTO, ExitDTO } from "../../validation/parking.schema";

export const entry = async (
  req: Request<object, object, EntryDTO>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await handleEntry(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const exit = async (
  req: Request<object, object, ExitDTO>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await handleExit(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
