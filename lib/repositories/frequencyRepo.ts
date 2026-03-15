import { FrequencySnapshot } from "@/lib/domain/types";

const g = globalThis as unknown as {
  _frequencySnapshots?: Map<string, FrequencySnapshot[]>;
};
const snapshots = (g._frequencySnapshots ??= new Map<
  string,
  FrequencySnapshot[]
>());

export function appendSnapshot(
  sessionId: string,
  snapshot: FrequencySnapshot
): void {
  const existing = snapshots.get(sessionId) ?? [];
  existing.push(snapshot);
  snapshots.set(sessionId, existing);
}

export function getSnapshots(sessionId: string): FrequencySnapshot[] {
  return snapshots.get(sessionId) ?? [];
}
