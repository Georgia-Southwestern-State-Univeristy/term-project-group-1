import { NextResponse } from "next/server";
import { createSession } from "@/lib/services/sessionService";
import { authenticateRequest, authErrorResponse } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);
  const { auth } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.error("api.error", {
      data: {
        route: "POST /api/sessions",
        status: 400,
        reason: "Invalid JSON body",
      },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { policyId } = body as Record<string, unknown>;

  if (typeof policyId !== "string" || policyId.trim().length === 0) {
    logger.error("api.error", {
      data: { route: "POST /api/sessions", status: 400, field: "policyId" },
    });
    return NextResponse.json(
      { error: "Missing or invalid 'policyId' field" },
      { status: 400 }
    );
  }

  const result = await createSession(policyId.trim(), auth.userId);

  if (!result.success) {
    logger.error("api.error", {
      data: { route: "POST /api/sessions", status: 404, policyId },
    });
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  logger.info("session.start", {
    sessionId: result.session.id,
    data: { policyId: result.session.policyId },
  });

  return NextResponse.json(result.session, { status: 201 });
}
