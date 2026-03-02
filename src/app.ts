import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import parkingRoutes from "./interfaces/http/routes/parking.routes";
import adminRoutes from "./interfaces/http/routes/admin.routes";
import { errorMiddleware } from "./interfaces/http/middleware/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", parkingRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler (must be last)
app.use(errorMiddleware);
