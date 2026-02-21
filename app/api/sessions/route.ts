import { NextResponse } from "next/server";
import { createSession } from "@/lib/services/sessionService";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { policyId } = body as Record<string, unknown>;

  if (typeof policyId !== "string" || policyId.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'policyId' field" },
      { status: 400 }
    );
  }

  const result = createSession(policyId.trim());

  if (!result.success) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json(result.session, { status: 201 });
}
