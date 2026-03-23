import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/repositories/userRepo";
import { signToken, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'email' field" },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'password' field" },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(email.trim());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    logger.warn("auth.login_failed", { data: { email: email.trim() } });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken(user);

  logger.info("auth.login", {
    data: { userId: user.id, email: user.email },
  });

  const response = NextResponse.json(
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    },
    { status: 200 }
  );

  response.headers.set(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; SameSite=Strict`
  );

  return response;
}
