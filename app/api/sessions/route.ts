import { NextResponse } from "next/server";
import {
  createSession,
  listSessionsForUser,
} from "@/lib/services/sessionService";
import { authenticateRequest, authErrorResponse } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  createSessionBodySchema,
  formatZodError,
} from "@/lib/validation/schemas";

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

  const parsed = createSessionBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = formatZodError(parsed.error.issues);
    logger.error("api.error", {
      data: { route: "POST /api/sessions", status: 400, field: "policyId" },
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

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
