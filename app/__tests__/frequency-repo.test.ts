/**
 * @jest-environment node
 */
import { appendSnapshot, getSnapshots } from "@/lib/repositories/frequencyRepo";
import { FrequencySnapshot } from "@/lib/domain/types";

function makeSnapshot(
  sessionId: string,
  overrides?: Partial<FrequencySnapshot>
): FrequencySnapshot {
  return {
    id: crypto.randomUUID(),
    sessionId,
    occurredAt: new Date().toISOString(),
    dominantFrequencyHz: 440,
    frequencyBins: Array(32).fill(-50),
    sampleRateHz: 16000,
    fftSize: 2048,
    binResolutionHz: 7.8125,
    ...overrides,
  };
}

describe("frequencyRepo", () => {
  const sessionId = `test-freq-${Date.now()}`;

  it("returns empty array for unknown session", async () => {
    expect(await getSnapshots("nonexistent")).toEqual([]);
  });

  it("appends and retrieves snapshots", async () => {
    const snap = makeSnapshot(sessionId);
    await appendSnapshot(sessionId, snap);

    const result = await getSnapshots(sessionId);
    expect(result).toHaveLength(1);
    expect(result[0].dominantFrequencyHz).toBe(440);
  });

  it("appends multiple snapshots in order", async () => {
    const id = `test-freq-multi-${Date.now()}`;
    const snap1 = makeSnapshot(id, { dominantFrequencyHz: 200 });
    const snap2 = makeSnapshot(id, { dominantFrequencyHz: 800 });

    await appendSnapshot(id, snap1);
    await appendSnapshot(id, snap2);

    const result = await getSnapshots(id);
    expect(result).toHaveLength(2);
    expect(result[0].dominantFrequencyHz).toBe(200);
    expect(result[1].dominantFrequencyHz).toBe(800);
  });
});
