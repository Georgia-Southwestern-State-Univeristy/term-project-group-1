import { NextResponse } from "next/server";
import { getSession } from "@/lib/repositories/sessionRepo";
import { fetchPolicy } from "@/lib/services/policyService";
import {
  appendTranscriptEvents,
  getTranscript,
} from "@/lib/services/transcriptService";
import { TranscriptEvent } from "@/lib/domain/types";
import { autoCheckChecklist } from "@/lib/services/checklistService";
import { getCheckedIds } from "@/lib/repositories/checklistStateRepo";
import {
  authenticateRequest,
  authErrorResponse,
  assertOwnership,
} from "@/lib/auth";
import { logger } from "@/lib/logger";

const MAX_EVENTS_PER_REQUEST = 50;
const MAX_EVENT_TEXT_LENGTH = 10_000;

function validateEvents(
  events: unknown[]
): { valid: true } | { valid: false; message: string } {
  if (events.length > MAX_EVENTS_PER_REQUEST) {
    return {
      valid: false,
      message: `Too many events: received ${events.length}, maximum is ${MAX_EVENTS_PER_REQUEST}`,
    };
  }

  for (let i = 0; i < events.length; i++) {
    const e = events[i] as Record<string, unknown>;
    if (typeof e.text !== "string" || e.text.trim().length === 0) {
      return {
        valid: false,
        message: `events[${i}] is invalid: 'text' must be a non-empty string`,
      };
    }
    if (e.text.length > MAX_EVENT_TEXT_LENGTH) {
      return {
        valid: false,
        message: `events[${i}] is invalid: 'text' exceeds ${MAX_EVENT_TEXT_LENGTH} character limit`,
      };
    }
    if (typeof e.isFinal !== "boolean") {
      return {
        valid: false,
        message: `events[${i}] is invalid: 'isFinal' must be a boolean`,
      };
    }
    if (typeof e.occurredAt !== "string" || e.occurredAt.trim().length === 0) {
      return {
        valid: false,
        message: `events[${i}] is invalid: 'occurredAt' must be a non-empty string`,
      };
    }
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
      data: { route: "POST /api/sessions/[id]/transcript-events", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const forbidden = assertOwnership(session, auth);
  if (forbidden) return forbidden;

  if (session.status !== "active") {
    logger.error("api.error", {
      sessionId,
      data: {
        route: "POST /api/sessions/[id]/transcript-events",
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
        route: "POST /api/sessions/[id]/transcript-events",
        status: 400,
        reason: "Invalid JSON body",
      },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { events } = body as Record<string, unknown>;

  if (!Array.isArray(events) || events.length === 0) {
    logger.error("api.error", {
      sessionId,
      data: {
        route: "POST /api/sessions/[id]/transcript-events",
        status: 400,
        reason: "events must be a non-empty array",
      },
    });
    return NextResponse.json(
      { error: "events must be a non-empty array" },
      { status: 400 }
    );
  }

  const validation = validateEvents(events);
  if (!validation.valid) {
    logger.error("api.error", {
      sessionId,
      data: {
        route: "POST /api/sessions/[id]/transcript-events",
        status: 400,
        reason: validation.message,
      },
    });
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const typedEvents = events as TranscriptEvent[];
  const { latestText } = appendTranscriptEvents(sessionId, typedEvents);

  const newText = typedEvents.map((e) => e.text).join(" ");

  const policy = fetchPolicy(session.policyId);
  let checkedItemIds: string[] = [];
  if (policy && newText) {
    autoCheckChecklist(sessionId, policy.checklist, newText);
  }
  checkedItemIds = getCheckedIds(sessionId);

  const { entries } = getTranscript(sessionId);

  logger.info("transcript.ingest", {
    sessionId,
    data: {
      eventCount: events.length,
      totalEntries: entries.length,
      latestText,
    },
  });

  return NextResponse.json({
    sessionId,
    transcriptEntryCount: entries.length,
    checkedItemIds,
    latestText,
  });
}
