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
