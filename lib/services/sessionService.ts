import { Session } from "@/lib/domain/types";
import { getPolicy } from "@/lib/repositories/policyRepo";
import { getSession, saveSession } from "@/lib/repositories/sessionRepo";

type CreateSessionResult =
  | { success: true; session: Session }
  | { success: false; error: "not_found" };

export function createSession(
  policyId: string,
  ownerId: string
): CreateSessionResult {
  const policy = getPolicy(policyId);
  if (!policy) {
    return { success: false, error: "not_found" };
  }

  const session: Session = {
    id: crypto.randomUUID(),
    policyId,
    ownerId,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  saveSession(session);
  return { success: true, session };
}

type EndSessionResult =
  | { success: true; session: Session; alreadyEnded: boolean }
  | { success: false; error: "not_found" };

export function endSession(sessionId: string): EndSessionResult {
  const session = getSession(sessionId);
  if (!session) {
    return { success: false, error: "not_found" };
  }

  if (session.status === "ended") {
    return { success: true, session, alreadyEnded: true };
  }

  session.status = "ended";
  session.endedAt = new Date().toISOString();
  saveSession(session);
  return { success: true, session, alreadyEnded: false };
}
