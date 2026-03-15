import { NextResponse } from "next/server";
import { endSession } from "@/lib/services/sessionService";
import { logger } from "@/lib/logger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const result = endSession(sessionId);

  if (!result.success) {
    logger.error("api.error", {
      sessionId,
      data: { route: "POST /api/sessions/[id]/end", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  logger.info("session.end", { sessionId });

  return NextResponse.json(result.session);
}
