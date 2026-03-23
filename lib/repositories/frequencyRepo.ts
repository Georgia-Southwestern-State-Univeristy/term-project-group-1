import { prisma } from "@/lib/db";
import { FrequencySnapshot } from "@/lib/domain/types";

export async function appendSnapshot(
  sessionId: string,
  snapshot: FrequencySnapshot
): Promise<void> {
  await prisma.frequencySnapshot.create({
    data: {
      id: snapshot.id,
      sessionId,
      occurredAt: new Date(snapshot.occurredAt),
      dominantFrequencyHz: snapshot.dominantFrequencyHz,
      frequencyBins: snapshot.frequencyBins,
      sampleRateHz: snapshot.sampleRateHz,
      fftSize: snapshot.fftSize,
      binResolutionHz: snapshot.binResolutionHz,
    },
  });
}

export async function getSnapshots(
  sessionId: string
): Promise<FrequencySnapshot[]> {
  const rows = await prisma.frequencySnapshot.findMany({
    where: { sessionId },
    orderBy: { occurredAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    occurredAt: r.occurredAt.toISOString(),
    dominantFrequencyHz: r.dominantFrequencyHz,
    frequencyBins: r.frequencyBins as number[],
    sampleRateHz: r.sampleRateHz,
    fftSize: r.fftSize,
    binResolutionHz: r.binResolutionHz,
  }));
}
