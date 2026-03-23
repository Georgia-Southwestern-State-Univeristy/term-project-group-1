import { NextResponse } from "next/server";
import { getSession } from "@/lib/repositories/sessionRepo";
import { appendSnapshot, getSnapshots } from "@/lib/repositories/frequencyRepo";
import { logger } from "@/lib/logger";
import {
  authenticateRequest,
  authErrorResponse,
  assertOwnership,
} from "@/lib/auth";

const MAX_FREQUENCY_BINS = 4096;

function isFinitePositive(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function validateFrequencyEvent(
  body: Record<string, unknown>
): { valid: true } | { valid: false; message: string } {
  if (
    typeof body.dominantFrequencyHz !== "number" ||
    !Number.isFinite(body.dominantFrequencyHz) ||
    body.dominantFrequencyHz < 0
  ) {
    return {
      valid: false,
      message: "'dominantFrequencyHz' must be a finite non-negative number",
    };
  }

  if (!Array.isArray(body.frequencyBins)) {
    return { valid: false, message: "'frequencyBins' must be an array" };
  }

  if (body.frequencyBins.length > MAX_FREQUENCY_BINS) {
    return {
      valid: false,
      message: `'frequencyBins' exceeds maximum length of ${MAX_FREQUENCY_BINS}`,
    };
  }

  for (let i = 0; i < body.frequencyBins.length; i++) {
    if (
      typeof body.frequencyBins[i] !== "number" ||
      !Number.isFinite(body.frequencyBins[i])
    ) {
      return {
        valid: false,
        message: `'frequencyBins[${i}]' must be a finite number`,
      };
    }
  }

  if (!isFinitePositive(body.sampleRateHz)) {
    return {
      valid: false,
      message: "'sampleRateHz' must be a positive finite number",
    };
  }

  if (
    typeof body.fftSize !== "number" ||
    !Number.isInteger(body.fftSize) ||
    body.fftSize <= 0
  ) {
    return {
      valid: false,
      message: "'fftSize' must be a positive integer",
    };
  }

  if (!isFinitePositive(body.binResolutionHz)) {
    return {
      valid: false,
      message: "'binResolutionHz' must be a positive finite number",
    };
  }

  return { valid: true };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);
  const { auth } = authResult;

  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    logger.error("api.error", {
      sessionId,
      data: { route: "POST /api/sessions/[id]/frequency", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const forbidden = assertOwnership(session, auth);
  if (forbidden) return forbidden;

  if (session.status !== "active") {
    logger.error("api.error", {
      sessionId,
      data: {
        route: "POST /api/sessions/[id]/frequency",
        status: 409,
        currentStatus: session.status,
      },
    });
    return NextResponse.json(
      { error: "Session is not active" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.error("api.error", {
      sessionId,
      data: {
        route: "POST /api/sessions/[id]/frequency",
        status: 400,
        reason: "Invalid JSON body",
      },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event = body as Record<string, unknown>;

  const validation = validateFrequencyEvent(event);
  if (!validation.valid) {
    logger.error("api.error", {
      sessionId,
      data: {
        route: "POST /api/sessions/[id]/frequency",
        status: 400,
        reason: validation.message,
      },
    });
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const snapshot = {
    id: crypto.randomUUID(),
    sessionId,
    occurredAt: new Date().toISOString(),
    dominantFrequencyHz: event.dominantFrequencyHz as number,
    frequencyBins: event.frequencyBins as number[],
    sampleRateHz: event.sampleRateHz as number,
    fftSize: event.fftSize as number,
    binResolutionHz: event.binResolutionHz as number,
  };

  appendSnapshot(sessionId, snapshot);

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

  const session = getSession(sessionId);
  if (!session) {
    logger.error("api.error", {
      sessionId,
      data: { route: "GET /api/sessions/[id]/frequency", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const forbidden = assertOwnership(session, auth);
  if (forbidden) return forbidden;

  const snapshots = getSnapshots(sessionId);

  return NextResponse.json({ sessionId, snapshots });
}
