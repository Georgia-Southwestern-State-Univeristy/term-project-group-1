import { Session } from "@/lib/domain/types";
import { getPolicy } from "@/lib/repositories/policyRepo";
import { saveSession } from "@/lib/repositories/sessionRepo";

type CreateSessionResult =
  | { success: true; session: Session }
  | { success: false; error: "not_found" };

export function createSession(policyId: string): CreateSessionResult {
  const policy = getPolicy(policyId);
  if (!policy) {
    return { success: false, error: "not_found" };
  }

  const session: Session = {
    id: crypto.randomUUID(),
    policyId,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  saveSession(session);
  return { success: true, session };
}
