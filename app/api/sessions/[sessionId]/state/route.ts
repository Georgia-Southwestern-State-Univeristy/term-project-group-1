import { NextResponse } from "next/server";
import { ChecklistStateRow } from "@/lib/domain/types";
import { getSession } from "@/lib/repositories/sessionRepo";
import { fetchPolicy } from "@/lib/services/policyService";
import { getTranscript } from "@/lib/services/transcriptService";
import { getCheckedIds } from "@/lib/repositories/checklistStateRepo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

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

  return NextResponse.json({
    session,
    transcript: {
      entries: transcript.entries,
      fullText: transcript.fullText,
    },
    checklistState,
  });
}
