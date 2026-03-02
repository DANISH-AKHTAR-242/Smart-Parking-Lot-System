import { Request, Response, NextFunction } from "express";
import { DomainError } from "../../../domain/errors/DomainError";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  console.error("[Unhandled Error]", err);
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Internal Server Error",
  });
};
