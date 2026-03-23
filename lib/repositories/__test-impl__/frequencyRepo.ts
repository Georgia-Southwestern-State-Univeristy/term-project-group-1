import { FrequencySnapshot } from "@/lib/domain/types";

const g = globalThis as unknown as {
  _frequencySnapshots?: Map<string, FrequencySnapshot[]>;
};
const snapshots = (g._frequencySnapshots ??= new Map<
  string,
  FrequencySnapshot[]
>());

export async function appendSnapshot(
  sessionId: string,
  snapshot: FrequencySnapshot
): Promise<void> {
  const existing = snapshots.get(sessionId) ?? [];
  existing.push(snapshot);
  snapshots.set(sessionId, existing);
}

export async function getSnapshots(
  sessionId: string
): Promise<FrequencySnapshot[]> {
  return snapshots.get(sessionId) ?? [];
}
