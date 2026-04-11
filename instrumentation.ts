import { logger } from "@/lib/logger";

/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Validates that required environment variables are set and logs
 * warnings for missing or insecure configuration.
 */
export function register() {
  const issues: string[] = [];

  if (!process.env.DATABASE_URL) {
    issues.push("DATABASE_URL is not set — database connections will fail");
  }

  if (!process.env.JWT_SECRET) {
    issues.push(
      "JWT_SECRET is not set — using insecure default (not safe for production)"
    );
  }

  if (!process.env.ASSEMBLYAI_API_KEY) {
    issues.push(
      "ASSEMBLYAI_API_KEY is not set — real-time transcription will be unavailable"
    );
  }

  if (issues.length === 0) {
    logger.info("startup.env_check", {
      data: { status: "ok", message: "All required environment variables set" },
    });
  } else {
    for (const issue of issues) {
      logger.warn("startup.env_check", {
        data: { status: "missing", message: issue },
      });
    }
  }
}
