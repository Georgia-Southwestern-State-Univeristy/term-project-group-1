import { NextResponse } from "next/server";
import {
  createSession,
  listSessionsForUser,
} from "@/lib/services/sessionService";
import { authenticateRequest, authErrorResponse } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createSessionBodySchema } from "@/lib/validation/schemas";
import { parseRequestBody } from "@/lib/validation/parseRequestBody";

const POST_ROUTE = "POST /api/sessions";

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);
  const { auth } = authResult;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;

  try {
    const sessions = await listSessionsForUser(auth, status);

    logger.info("sessions.list", {
      data: { count: sessions.length, status: status ?? "all" },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    logger.error("db.error", {
      data: {
        route: "GET /api/sessions",
        message: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);
  const { auth } = authResult;

  const parsed = await parseRequestBody(
    request,
    createSessionBodySchema,
    POST_ROUTE
  );
  if (!parsed.success) return parsed.response;

  try {
    const result = await createSession(parsed.data.policyId, auth.userId);

    if (!result.success) {
      logger.error("api.error", {
        data: {
          route: "POST /api/sessions",
          status: 404,
          policyId: parsed.data.policyId,
        },
      });
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    logger.info("session.start", {
      sessionId: result.session.id,
      data: { policyId: result.session.policyId },
    });

    return NextResponse.json(result.session, { status: 201 });
  } catch (err) {
    logger.error("db.error", {
      data: {
        route: "POST /api/sessions",
        message: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
