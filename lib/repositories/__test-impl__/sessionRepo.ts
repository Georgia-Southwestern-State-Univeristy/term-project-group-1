import { Session, SessionSummary } from "@/lib/domain/types";
import { getPolicy } from "@/lib/repositories/policyRepo";

const g = globalThis as unknown as { _sessions?: Map<string, Session> };
const sessions = (g._sessions ??= new Map<string, Session>());

export async function saveSession(session: Session): Promise<void> {
  sessions.set(session.id, { ...session });
}

export async function listSessions(filters?: {
  ownerId?: string;
  status?: string;
}): Promise<SessionSummary[]> {
  let entries = Array.from(sessions.values());
  if (filters?.ownerId) {
    entries = entries.filter((s) => s.ownerId === filters.ownerId);
  }
  if (filters?.status) {
    entries = entries.filter((s) => s.status === filters.status);
  }
  entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const results: SessionSummary[] = [];
  for (const s of entries) {
    const policy = await getPolicy(s.policyId);
    results.push({
      id: s.id,
      policyId: s.policyId,
      policyName: policy?.name ?? "Unknown",
      ownerId: s.ownerId,
      status: s.status,
      createdAt: s.createdAt,
      endedAt: s.endedAt,
    });
  }
  return results;
}

export async function getSession(id: string): Promise<Session | undefined> {
  const s = sessions.get(id);
  return s ? { ...s } : undefined;
}
