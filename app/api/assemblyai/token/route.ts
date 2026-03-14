import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    logger.error("api.error", {
      data: {
        route: "POST /api/assemblyai/token",
        status: 500,
        reason: "ASSEMBLYAI_API_KEY not configured",
      },
    });
    return NextResponse.json(
      { error: "ASSEMBLYAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(
    "https://streaming.assemblyai.com/v3/token?expires_in_seconds=60",
    { headers: { Authorization: apiKey } }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    logger.error("api.error", {
      data: {
        route: "POST /api/assemblyai/token",
        status: 502,
        upstreamStatus: res.status,
        upstreamResponse: text,
      },
    });
    return NextResponse.json(
      { error: `AssemblyAI token request failed: ${text}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({ token: data.token, expiresInSeconds: 60 });
}
