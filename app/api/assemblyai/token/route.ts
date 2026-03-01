import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
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
    return NextResponse.json(
      { error: `AssemblyAI token request failed: ${text}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({ token: data.token, expiresInSeconds: 60 });
}
