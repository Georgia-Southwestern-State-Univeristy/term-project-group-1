import { NextResponse } from "next/server";
import { getSession } from "@/lib/repositories/sessionRepo";
import { appendSnapshot, getSnapshots } from "@/lib/repositories/frequencyRepo";
import { FrequencyEvent } from "@/lib/domain/types";

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

  const event = body as FrequencyEvent;

  if (
    typeof event.dominantFrequencyHz !== "number" ||
    !Array.isArray(event.frequencyBins)
  ) {
    return NextResponse.json(
      { error: "dominantFrequencyHz and frequencyBins are required" },
      { status: 400 }
    );
  }

  const snapshot = {
    id: crypto.randomUUID(),
    sessionId,
    occurredAt: new Date().toISOString(),
    dominantFrequencyHz: event.dominantFrequencyHz,
    frequencyBins: event.frequencyBins,
    sampleRateHz: event.sampleRateHz,
    fftSize: event.fftSize,
    binResolutionHz: event.binResolutionHz,
  };

  appendSnapshot(sessionId, snapshot);

  return NextResponse.json({ ok: true, snapshotId: snapshot.id });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const snapshots = getSnapshots(sessionId);

  return NextResponse.json({ sessionId, snapshots });
}
