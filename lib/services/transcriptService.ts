import { TranscriptEntry, TranscriptEvent } from "@/lib/domain/types";
import {
  appendEntries as repoAppendEntries,
  getEntries,
} from "@/lib/repositories/transcriptRepo";

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

  return {
    entryCountDelta: entries.length,
    latestText: entries[entries.length - 1].text,
  };
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
