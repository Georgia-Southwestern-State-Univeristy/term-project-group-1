import { prisma } from "@/lib/db";
import { TranscriptEntry } from "@/lib/domain/types";

export async function appendEntries(
  sessionId: string,
  entries: TranscriptEntry[]
): Promise<void> {
  await prisma.transcriptEntry.createMany({
    data: entries.map((e) => ({
      id: e.id,
      sessionId,
      text: e.text,
      isFinal: e.isFinal,
      occurredAt: new Date(e.occurredAt),
      confidence: e.confidence ?? null,
      startMs: e.startMs ?? null,
      endMs: e.endMs ?? null,
    })),
  });
}

export async function getEntries(
  sessionId: string
): Promise<TranscriptEntry[]> {
  const rows = await prisma.transcriptEntry.findMany({
    where: { sessionId },
    orderBy: { occurredAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    text: r.text,
    isFinal: r.isFinal,
    occurredAt: r.occurredAt.toISOString(),
    confidence: r.confidence ?? undefined,
    startMs: r.startMs ?? undefined,
    endMs: r.endMs ?? undefined,
  }));
}

export async function pruneEntries(
  sessionId: string,
  keepCount: number
): Promise<void> {
  const toKeep = await prisma.transcriptEntry.findMany({
    where: { sessionId },
    orderBy: { occurredAt: "desc" },
    take: keepCount,
    select: { id: true },
  });
  const keepIds = toKeep.map((r) => r.id);

  await prisma.transcriptEntry.deleteMany({
    where: {
      sessionId,
      id: { notIn: keepIds },
    },
  });
}
