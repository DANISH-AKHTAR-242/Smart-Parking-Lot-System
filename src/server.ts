import "dotenv/config";
import { app } from "./app";
import { pool } from "./infrastructure/db/db";
import { redis } from "./infrastructure/redis/redis";
import { initRedisCounters, startReconciliationJob } from "./jobs/redisReconciliation.job";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start(): Promise<void> {
  try {
    // Validate DB connection
    await pool.query("SELECT 1");
    console.log("[DB] Connected");

    // Connect Redis
    await redis.connect();

    // Initialize Redis counters from DB (source of truth)
    await initRedisCounters();
    console.log("[Redis] Availability counters initialized");

    // Start periodic reconciliation
    startReconciliationJob();

    const server = app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });

    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`[Server] Port ${PORT} is already in use. Please use a different port or kill the process using it.`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
}

start();
