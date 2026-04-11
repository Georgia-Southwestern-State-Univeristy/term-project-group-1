import { NextResponse } from "next/server";
import type { z } from "zod/v4";
import { formatZodError } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

/**
 * Parse the JSON body of a request and validate it against a Zod schema.
 *
 * Returns `{ success: true, data }` when valid, or
 * `{ success: false, response }` with a pre-built 400 NextResponse when not.
 *
 * Handles both malformed JSON and schema validation failures, logging each
 * with the route name for traceability.
 */
export async function parseRequestBody<T extends z.ZodType>(
  request: Request,
  schema: T,
  route: string,
  sessionId?: string
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.error("api.error", {
      ...(sessionId && { sessionId }),
      data: { route, status: 400, reason: "Invalid JSON body" },
    });
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = formatZodError(parsed.error.issues);
    const field = String(parsed.error.issues[0]?.path?.[0] ?? "");
    logger.error("api.error", {
      ...(sessionId && { sessionId }),
      data: { route, status: 400, ...(field && { field }), reason: message },
    });
    return {
      success: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }

  return { success: true, data: parsed.data };
}
