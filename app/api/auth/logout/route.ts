import { NextResponse } from "next/server";
import { authenticateRequest, authErrorResponse } from "@/lib/auth";
import { revokeToken } from "@/lib/repositories/revokedTokenRepo";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const start = performance.now();
  const result = await authenticateRequest(request);

  if (!result.success) {
    return authErrorResponse(result.error);
  }

  const { auth } = result;
  await revokeToken(auth.jti, auth.userId, new Date(auth.exp * 1000));

  const durationMs = Math.round(performance.now() - start);
  logger.info("auth.logout", {
    data: { userId: auth.userId, jti: auth.jti, durationMs },
  });

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.headers.set(
    "Set-Cookie",
    "token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0"
  );
  return response;
}
