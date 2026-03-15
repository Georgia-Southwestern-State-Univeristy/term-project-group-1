import { TranscriptEntry, TranscriptEvent } from "@/lib/domain/types";
import {
  appendEntries as repoAppendEntries,
  getEntries,
  pruneEntries,
} from "@/lib/repositories/transcriptRepo";
import { TRANSCRIPT_WINDOW_CHAR_LIMIT } from "@/lib/config/transcription";

export function appendTranscriptEvents(
  sessionId: string,
  events: TranscriptEvent[]
): { entryCountDelta: number; latestText: string } {
  const entries: TranscriptEntry[] = events.map((e) => ({
    id: crypto.randomUUID(),
    sessionId,
    text: e.text,
    isFinal: e.isFinal,
    occurredAt: e.occurredAt,
    confidence: e.confidence,
    startMs: e.startMs,
    endMs: e.endMs,
  }));

  repoAppendEntries(sessionId, entries);
  pruneIfNeeded(sessionId);

  return {
    entryCountDelta: entries.length,
    latestText: entries[entries.length - 1].text,
  };
}

export function pruneIfNeeded(
  sessionId: string,
  charLimit: number = TRANSCRIPT_WINDOW_CHAR_LIMIT
): void {
  const entries = getEntries(sessionId);
  const totalChars = entries
    .filter((e) => e.isFinal)
    .reduce((sum, e) => sum + e.text.length, 0);

  if (totalChars <= charLimit) return;

  let charBudget = charLimit;
  let keepFrom = entries.length;

  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].isFinal) {
      if (charBudget - entries[i].text.length < 0) break;
      charBudget -= entries[i].text.length;
    }
    keepFrom = i;
  }

  pruneEntries(sessionId, entries.length - keepFrom);
}

export function getTranscript(sessionId: string): {
  entries: TranscriptEntry[];
  fullText: string | null;
} {
  const entries = getEntries(sessionId);
  const finals = entries.filter((e) => e.isFinal);
  const fullText =
    finals.length > 0 ? finals.map((e) => e.text).join(" ") : null;

  return { entries, fullText };
}
