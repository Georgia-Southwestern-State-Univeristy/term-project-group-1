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
import { transcriptEventsBodySchema } from "@/lib/validation/schemas";
import { parseRequestBody } from "@/lib/validation/parseRequestBody";

const ROUTE = "POST /api/sessions/[id]/transcript-events";

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
    transcriptEventsBodySchema,
    ROUTE,
    sessionId
  );
  if (!parsed.success) return parsed.response;

  try {
    const typedEvents = parsed.data.events as TranscriptEvent[];
    const { latestText } = await appendTranscriptEvents(sessionId, typedEvents);

    const newText = typedEvents.map((e) => e.text).join(" ");

    const policy = await fetchPolicy(session.policyId);
    let checkedItemIds: string[] = [];
    if (policy && newText) {
      await autoCheckChecklist(sessionId, policy.checklist, newText);
    }
    checkedItemIds = await getCheckedIds(sessionId);

    const { entries } = await getTranscript(sessionId);

    logger.info("transcript.ingest", {
      sessionId,
      data: {
        eventCount: typedEvents.length,
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
  } catch (err) {
    logger.error("db.error", {
      sessionId,
      data: {
        route: "POST /api/sessions/[id]/transcript-events",
        message: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
