import { NextResponse } from "next/server";
import { getSession } from "@/lib/repositories/sessionRepo";
import { fetchPolicy } from "@/lib/services/policyService";
import {
  appendTranscriptEvents,
  getTranscript,
} from "@/lib/services/transcriptService";
import { autoCheckChecklist } from "@/lib/services/checklistService";
import { getCheckedIds } from "@/lib/repositories/checklistStateRepo";
import { logger } from "@/lib/logger";

function validateEvents(
  events: unknown[]
): { valid: true } | { valid: false; message: string } {
  for (let i = 0; i < events.length; i++) {
    const e = events[i] as Record<string, unknown>;
    if (typeof e.text !== "string" || e.text.trim().length === 0) {
      return {
        valid: false,
        message: `events[${i}] is invalid: 'text' must be a non-empty string`,
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
  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    logger.error("api.error", {
      sessionId,
      data: { route: "POST /api/sessions/[id]/transcript-events", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

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
    return NextResponse.json(
      { error: validation.message },
      { status: 400 }
    );
  }

  const { latestText } = appendTranscriptEvents(sessionId, events);

  const { fullText } = getTranscript(sessionId);

  const policy = fetchPolicy(session.policyId);
  let checkedItemIds: string[] = [];
  if (policy && fullText) {
    autoCheckChecklist(sessionId, policy.checklist, fullText);
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
