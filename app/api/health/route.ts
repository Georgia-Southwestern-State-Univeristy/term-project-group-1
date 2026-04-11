import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/health
 *
 * Unauthenticated health check for load balancers, container orchestrators,
 * and operator diagnostics. Returns 200 when the server is up and the
 * database is reachable, or 503 with details when it is not.
 */
export async function GET() {
  const uptime = process.uptime();

  let dbStatus: "ok" | "unreachable" = "ok";
  let dbLatencyMs: number | null = null;

  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Math.round(performance.now() - start);
  } catch {
    dbStatus = "unreachable";
  }

  const healthy = dbStatus === "ok";

  const payload = {
    status: healthy ? "healthy" : "degraded",
    uptime: Math.round(uptime),
    database: {
      status: dbStatus,
      ...(dbLatencyMs !== null && { latencyMs: dbLatencyMs }),
    },
    env: {
      JWT_SECRET: process.env.JWT_SECRET ? "set" : "default (insecure)",
      ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY ? "set" : "missing",
      DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    },
  };

  if (!healthy) {
    logger.warn("health.check", {
      data: { status: "degraded", database: dbStatus },
    });
  }

  return NextResponse.json(payload, { status: healthy ? 200 : 503 });
}
