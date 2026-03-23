import { NextResponse } from "next/server";
import { ChecklistStateRow } from "@/lib/domain/types";
import { getSession } from "@/lib/repositories/sessionRepo";
import { fetchPolicy } from "@/lib/services/policyService";
import { getTranscript } from "@/lib/services/transcriptService";
import { getCheckedIds } from "@/lib/repositories/checklistStateRepo";
import {
  authenticateRequest,
  authErrorResponse,
  assertOwnership,
} from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getSnapshots } from "@/lib/repositories/frequencyRepo";

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
      data: { route: "GET /api/sessions/[id]/state", status: 404 },
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const forbidden = assertOwnership(session, auth);
  if (forbidden) return forbidden;

  const policy = fetchPolicy(session.policyId);
  const transcript = getTranscript(sessionId);
  const checkedIds = new Set(getCheckedIds(sessionId));

  const checklistState: ChecklistStateRow[] = (policy?.checklist ?? []).map(
    (item) => ({
      itemId: item.id,
      text: item.text,
      checked: checkedIds.has(item.id),
    })
  );

  const frequencySnapshots = getSnapshots(sessionId);

  return NextResponse.json({
    session,
    transcript: {
      entries: transcript.entries,
      fullText: transcript.fullText,
    },
    checklistState,
    frequencySnapshots,
  });
}
