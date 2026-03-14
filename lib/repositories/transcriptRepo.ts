import { TranscriptEntry } from "@/lib/domain/types";

const g = globalThis as unknown as {
  _transcripts?: Map<string, TranscriptEntry[]>;
};
const transcripts = (g._transcripts ??= new Map<string, TranscriptEntry[]>());

export function appendEntries(
  sessionId: string,
  entries: TranscriptEntry[]
): void {
  const existing = transcripts.get(sessionId) ?? [];
  existing.push(...entries);
  transcripts.set(sessionId, existing);
}

export function getEntries(sessionId: string): TranscriptEntry[] {
  return transcripts.get(sessionId) ?? [];
}

export function pruneEntries(
  sessionId: string,
  keepCount: number
): void {
  const existing = transcripts.get(sessionId);
  if (!existing || existing.length <= keepCount) return;
  transcripts.set(sessionId, existing.slice(existing.length - keepCount));
}
