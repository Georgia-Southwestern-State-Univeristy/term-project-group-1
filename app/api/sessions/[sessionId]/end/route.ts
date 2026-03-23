import { NextResponse } from "next/server";
import { getSession } from "@/lib/repositories/sessionRepo";
import { endSession } from "@/lib/services/sessionService";
import {
  authenticateRequest,
  authErrorResponse,
  assertOwnership,
} from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);
  const { auth } = authResult;

  const { sessionId } = await params;

  const session = await getSession(sessionId);
  if (!session) {
    logger.error("api.error", {
      sessionId,
      data: { route: "POST /api/sessions/[id]/end", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const forbidden = assertOwnership(session, auth);
  if (forbidden) return forbidden;

  const result = await endSession(sessionId);

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
