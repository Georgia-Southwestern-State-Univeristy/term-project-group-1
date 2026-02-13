import { NextResponse } from "next/server";

export async function POST() {
  const session = {
    sessionId: crypto.randomUUID(),
    status: "created",
  };

  return NextResponse.json(session);
}
