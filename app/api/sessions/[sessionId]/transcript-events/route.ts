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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Session is not active" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { events } = body as Record<string, unknown>;

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: "events must be a non-empty array" },
      { status: 400 }
    );
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

  return NextResponse.json({
    sessionId,
    transcriptEntryCount: entries.length,
    checkedItemIds,
    latestText,
  });
}
