/**
 * @jest-environment node
 */
import { computeThreatScore } from "@/lib/services/threatScoreService";
import { FrequencySnapshot } from "@/lib/domain/types";

function makeSnapshot(
  dominantFrequencyHz: number,
  overrides?: Partial<FrequencySnapshot>
): FrequencySnapshot {
  return {
    id: crypto.randomUUID(),
    sessionId: "test",
    occurredAt: new Date().toISOString(),
    dominantFrequencyHz,
    frequencyBins: [],
    sampleRateHz: 16000,
    fftSize: 2048,
    binResolutionHz: 7.8125,
    ...overrides,
  };
}

describe("computeThreatScore", () => {
  it("returns 0 overall with no data", () => {
    const result = computeThreatScore([], 0, 0, "");
    expect(result.overall).toBe(0);
    expect(result.frequencyScore).toBe(0);
    expect(result.complianceScore).toBe(0);
    expect(result.keywordScore).toBe(0);
    expect(result.level).toBe("low");
  });

  it("returns complianceScore 0 when all items checked", () => {
    const result = computeThreatScore([], 5, 5, "");
    expect(result.complianceScore).toBe(0);
  });

  it("returns complianceScore 100 when no items checked", () => {
    const result = computeThreatScore([], 5, 0, "");
    expect(result.complianceScore).toBe(100);
  });

  it("scores keywords in transcript", () => {
    const result = computeThreatScore(
      [],
      0,
      0,
      "there was a threat and an attack reported"
    );
    expect(result.keywordScore).toBeGreaterThan(0);
  });

  it("returns frequencyScore 100 when all snapshots in stress range", () => {
    const snapshots = Array.from({ length: 10 }, () => makeSnapshot(300));
    const result = computeThreatScore(snapshots, 0, 0, "");
    expect(result.frequencyScore).toBe(100);
  });

  it("returns frequencyScore 0 when no snapshots in stress range", () => {
    const snapshots = Array.from({ length: 10 }, () => makeSnapshot(100));
    const result = computeThreatScore(snapshots, 0, 0, "");
    expect(result.frequencyScore).toBe(0);
  });

  it("returns frequencyScore 0 when no snapshots at all", () => {
    const result = computeThreatScore([], 0, 0, "");
    expect(result.frequencyScore).toBe(0);
  });

  it("returns critical level with combined high scores", () => {
    const snapshots = Array.from({ length: 20 }, () => makeSnapshot(350));
    const result = computeThreatScore(
      snapshots,
      10,
      0,
      "threat kill bomb attack weapon hurt destroy explode gun knife"
    );
    expect(result.level).toBe("critical");
    expect(result.overall).toBeGreaterThanOrEqual(75);
  });

  it("uses only last 20 snapshots for frequency scoring", () => {
    // 30 snapshots: first 10 in stress range, last 20 out of range
    const stressSnapshots = Array.from({ length: 10 }, () => makeSnapshot(300));
    const calmSnapshots = Array.from({ length: 20 }, () => makeSnapshot(100));
    const result = computeThreatScore(
      [...stressSnapshots, ...calmSnapshots],
      0,
      0,
      ""
    );
    expect(result.frequencyScore).toBe(0);
  });

  it("classifies threat levels correctly", () => {
    // Low: 0-24
    const low = computeThreatScore([], 0, 0, "");
    expect(low.level).toBe("low");

    // Medium: compliance alone at ~35 (5 items, 0 checked → 100 * 0.35 = 35)
    const medium = computeThreatScore([], 5, 0, "");
    expect(medium.level).toBe("medium");

    // High: compliance + some keywords
    const high = computeThreatScore(
      [],
      10,
      0,
      "threat attack bomb kill weapon"
    );
    expect(high.level).toBe("high");
  });
});
