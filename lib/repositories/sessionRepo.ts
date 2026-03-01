import { Session } from "@/lib/domain/types";

const g = globalThis as unknown as { _sessions?: Map<string, Session> };
const sessions = (g._sessions ??= new Map<string, Session>());

export function saveSession(session: Session): void {
  sessions.set(session.id, session);
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}
