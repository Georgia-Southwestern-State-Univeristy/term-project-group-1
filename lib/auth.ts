import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { Session, User, UserRole } from "@/lib/domain/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me-in-production"
);

const TOKEN_EXPIRY = "8h";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function signToken(user: User): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<{ sub: string; email: string; role: UserRole } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export interface AuthResult {
  userId: string;
  email: string;
  role: UserRole;
}

export type AuthError = "missing_token" | "invalid_token";

export async function authenticateRequest(
  request: Request
): Promise<
  { success: true; auth: AuthResult } | { success: false; error: AuthError }
> {
  const authHeader = request.headers.get("Authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) token = match[1];
    }
  }

  if (!token) {
    return { success: false, error: "missing_token" };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { success: false, error: "invalid_token" };
  }

  return {
    success: true,
    auth: { userId: payload.sub, email: payload.email, role: payload.role },
  };
}

export function authErrorResponse(error: AuthError): NextResponse {
  if (error === "missing_token") {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  return NextResponse.json(
    { error: "Invalid or expired token" },
    { status: 401 }
  );
}

// Returns a 403 response if the agent doesn't own the session.
// Supervisors bypass ownership checks.
export function assertOwnership(
  session: Session,
  auth: AuthResult
): NextResponse | null {
  if (auth.role === "supervisor") return null;
  if (session.ownerId === auth.userId) return null;
  return NextResponse.json(
    { error: "Forbidden: you do not own this session" },
    { status: 403 }
  );
}
