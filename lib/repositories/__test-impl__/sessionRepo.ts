import { Session } from "@/lib/domain/types";

const g = globalThis as unknown as { _sessions?: Map<string, Session> };
const sessions = (g._sessions ??= new Map<string, Session>());

export async function saveSession(session: Session): Promise<void> {
  sessions.set(session.id, { ...session });
}

export async function getSession(id: string): Promise<Session | undefined> {
  const s = sessions.get(id);
  return s ? { ...s } : undefined;
}
