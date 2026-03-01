import { NextResponse } from "next/server";
import { endSession } from "@/lib/services/sessionService";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const result = endSession(sessionId);

  if (!result.success) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(result.session);
}
