/**
 * @jest-environment node
 */
import {
  appendEntries,
  getEntries,
  pruneEntries,
} from "@/lib/repositories/transcriptRepo";
import {
  appendTranscriptEvents,
  getTranscript,
  pruneIfNeeded,
} from "@/lib/services/transcriptService";
import { TranscriptEntry } from "@/lib/domain/types";

/* ── helpers ─────────────────────────────────── */

function makeEntry(
  sessionId: string,
  text: string,
  isFinal = true
): TranscriptEntry {
  return {
    id: crypto.randomUUID(),
    sessionId,
    text,
    isFinal,
    occurredAt: new Date().toISOString(),
  };
}

/* ── repo: pruneEntries ──────────────────────── */

describe("transcriptRepo.pruneEntries", () => {
  const sid = "prune-repo-test";

  beforeEach(async () => {
    // clear any leftover entries
    await pruneEntries(sid, 0);
  });

  it("keeps only the last N entries", async () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(sid, `entry-${i}`)
    );
    await appendEntries(sid, entries);

    await pruneEntries(sid, 3);

    const remaining = await getEntries(sid);
    expect(remaining).toHaveLength(3);
    expect(remaining[0].text).toBe("entry-7");
    expect(remaining[2].text).toBe("entry-9");
  });

  it("is a no-op when keepCount >= entries length", async () => {
    const entries = [makeEntry(sid, "a"), makeEntry(sid, "b")];
    await appendEntries(sid, entries);

    await pruneEntries(sid, 5);

    expect(await getEntries(sid)).toHaveLength(2);
  });

  it("is a no-op for unknown session", async () => {
    await pruneEntries("nonexistent", 1);
    expect(await getEntries("nonexistent")).toHaveLength(0);
  });
});

/* ── service: pruneIfNeeded ──────────────────── */

describe("transcriptService.pruneIfNeeded", () => {
  const sid = "prune-service-test";

  beforeEach(async () => {
    await pruneEntries(sid, 0);
  });

  it("prunes entries when final text exceeds char limit", async () => {
    // Each entry has 20 chars → 5 entries = 100 chars
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry(sid, "a".repeat(20) + String(i).padStart(0))
    );
    await appendEntries(sid, entries);

    // Limit to 50 chars → should keep ~2-3 entries
    await pruneIfNeeded(sid, 50);

    const remaining = await getEntries(sid);
    const totalChars = remaining
      .filter((e) => e.isFinal)
      .reduce((sum, e) => sum + e.text.length, 0);
    expect(totalChars).toBeLessThanOrEqual(50);
    expect(remaining.length).toBeLessThan(5);
  });

  it("does not prune when under the limit", async () => {
    const entries = [makeEntry(sid, "short")];
    await appendEntries(sid, entries);

    await pruneIfNeeded(sid, 1000);

    expect(await getEntries(sid)).toHaveLength(1);
  });

  it("preserves non-final entries within the kept range", async () => {
    // Mix: final(20), non-final(5), final(20), non-final(5), final(20)
    const entries = [
      makeEntry(sid, "a".repeat(20), true),
      makeEntry(sid, "b".repeat(5), false),
      makeEntry(sid, "c".repeat(20), true),
      makeEntry(sid, "d".repeat(5), false),
      makeEntry(sid, "e".repeat(20), true),
    ];
    await appendEntries(sid, entries);

    // Limit to 45 chars of final text → keeps last 2 finals (40 chars) + interleaved non-finals
    await pruneIfNeeded(sid, 45);

    const remaining = await getEntries(sid);
    const finalChars = remaining
      .filter((e) => e.isFinal)
      .reduce((sum, e) => sum + e.text.length, 0);
    expect(finalChars).toBeLessThanOrEqual(45);
    // Non-final entries in the kept range should be preserved
    const hasNonFinal = remaining.some((e) => !e.isFinal);
    expect(hasNonFinal).toBe(true);
  });
});

/* ── service: appendTranscriptEvents triggers pruning ── */

describe("appendTranscriptEvents with windowing", () => {
  const sid = "append-prune-test";

  beforeEach(async () => {
    await pruneEntries(sid, 0);
  });

  it("appends events and returns correct delta", async () => {
    const result = await appendTranscriptEvents(sid, [
      { text: "hello", isFinal: true, occurredAt: new Date().toISOString() },
      { text: "world", isFinal: true, occurredAt: new Date().toISOString() },
    ]);

    expect(result.entryCountDelta).toBe(2);
    expect(result.latestText).toBe("world");
  });
});

/* ── getTranscript returns windowed fullText ─── */

describe("getTranscript after pruning", () => {
  const sid = "get-transcript-pruned";

  beforeEach(async () => {
    await pruneEntries(sid, 0);
  });

  it("returns only windowed entries and fullText", async () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry(sid, `word${i}`)
    );
    await appendEntries(sid, entries);

    // Prune to keep only last 2
    await pruneEntries(sid, 2);

    const { entries: result, fullText } = await getTranscript(sid);
    expect(result).toHaveLength(2);
    expect(fullText).toBe("word3 word4");
  });
});

/* ── end-to-end: checklist stays checked after prune ── */

describe("checklist idempotency after pruning", () => {
  it("checked items remain checked after transcript is pruned", async () => {
    // This test verifies the key invariant: pruning old transcript text
    // does not un-check checklist items, because checked state is stored
    // independently in checklistStateRepo.
    const { markChecked, getCheckedIds } =
      await import("@/lib/repositories/checklistStateRepo");

    const sid = "checklist-prune-test";

    // Simulate: item was checked when matching text existed
    await markChecked(sid, "item-1");
    expect(await getCheckedIds(sid)).toContain("item-1");

    // Prune all transcript entries
    await pruneEntries(sid, 0);
    expect(await getEntries(sid)).toHaveLength(0);

    // Checked state is preserved (independent store)
    expect(await getCheckedIds(sid)).toContain("item-1");
  });
});
