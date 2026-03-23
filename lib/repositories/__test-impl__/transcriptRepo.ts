import { TranscriptEntry } from "@/lib/domain/types";

const g = globalThis as unknown as {
  _transcripts?: Map<string, TranscriptEntry[]>;
};
const transcripts = (g._transcripts ??= new Map<string, TranscriptEntry[]>());

export async function appendEntries(
  sessionId: string,
  entries: TranscriptEntry[]
): Promise<void> {
  const existing = transcripts.get(sessionId) ?? [];
  existing.push(...entries);
  transcripts.set(sessionId, existing);
}

export async function getEntries(
  sessionId: string
): Promise<TranscriptEntry[]> {
  return transcripts.get(sessionId) ?? [];
}

export async function pruneEntries(
  sessionId: string,
  keepCount: number
): Promise<void> {
  const existing = transcripts.get(sessionId);
  if (!existing || existing.length <= keepCount) return;
  transcripts.set(sessionId, existing.slice(existing.length - keepCount));
}
