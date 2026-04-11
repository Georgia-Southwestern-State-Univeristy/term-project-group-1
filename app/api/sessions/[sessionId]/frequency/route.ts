import { NextResponse } from "next/server";
import { getSession } from "@/lib/repositories/sessionRepo";
import { appendSnapshot, getSnapshots } from "@/lib/repositories/frequencyRepo";
import { logger } from "@/lib/logger";
import {
  authenticateRequest,
  authErrorResponse,
  assertOwnership,
} from "@/lib/auth";
import { frequencyEventSchema } from "@/lib/validation/schemas";
import { parseRequestBody } from "@/lib/validation/parseRequestBody";

const ROUTE = "POST /api/sessions/[id]/frequency";

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
      data: { route: ROUTE, status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const forbidden = assertOwnership(session, auth);
  if (forbidden) return forbidden;

  if (session.status !== "active") {
    logger.error("api.error", {
      sessionId,
      data: { route: ROUTE, status: 409, currentStatus: session.status },
    });
    return NextResponse.json(
      { error: "Session is not active" },
      { status: 409 }
    );
  }

  const parsed = await parseRequestBody(
    request,
    frequencyEventSchema,
    ROUTE,
    sessionId
  );
  if (!parsed.success) return parsed.response;

  const snapshot = {
    id: crypto.randomUUID(),
    sessionId,
    occurredAt: new Date().toISOString(),
    ...parsed.data,
  };

  await appendSnapshot(sessionId, snapshot);

  logger.info("frequency.ingest", {
    sessionId,
    data: {
      snapshotId: snapshot.id,
      binCount: snapshot.frequencyBins.length,
      dominantHz: snapshot.dominantFrequencyHz,
    },
  });

  return NextResponse.json({ ok: true, snapshotId: snapshot.id });
}

export async function GET(
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
      data: { route: "GET /api/sessions/[id]/frequency", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const forbidden = assertOwnership(session, auth);
  if (forbidden) return forbidden;

  const snapshots = await getSnapshots(sessionId);

  return NextResponse.json({ sessionId, snapshots });
}
