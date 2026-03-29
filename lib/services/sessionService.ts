import { Session, SessionSummary } from "@/lib/domain/types";
import { AuthResult } from "@/lib/auth";
import { getPolicy } from "@/lib/repositories/policyRepo";
import {
  getSession,
  listSessions,
  saveSession,
} from "@/lib/repositories/sessionRepo";

type CreateSessionResult =
  | { success: true; session: Session }
  | { success: false; error: "not_found" };

export async function createSession(
  policyId: string,
  ownerId: string
): Promise<CreateSessionResult> {
  const policy = await getPolicy(policyId);
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

  await saveSession(session);
  return { success: true, session };
}

export async function listSessionsForUser(
  auth: AuthResult,
  statusFilter?: string
): Promise<SessionSummary[]> {
  const filters: { ownerId?: string; status?: string } = {};
  if (auth.role !== "supervisor") {
    filters.ownerId = auth.userId;
  }
  if (statusFilter) {
    filters.status = statusFilter;
  }
  return listSessions(filters);
}

type EndSessionResult =
  | { success: true; session: Session; alreadyEnded: boolean }
  | { success: false; error: "not_found" };

export async function endSession(sessionId: string): Promise<EndSessionResult> {
  const session = await getSession(sessionId);
  if (!session) {
    return { success: false, error: "not_found" };
  }

  if (session.status === "ended") {
    return { success: true, session, alreadyEnded: true };
  }

  session.status = "ended";
  session.endedAt = new Date().toISOString();
  await saveSession(session);
  return { success: true, session, alreadyEnded: false };
}
