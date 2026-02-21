import { Session } from "@/lib/domain/types";

const sessions = new Map<string, Session>();

export function saveSession(session: Session): void {
  sessions.set(session.id, session);
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}
