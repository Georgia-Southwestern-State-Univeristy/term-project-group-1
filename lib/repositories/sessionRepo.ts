import { prisma } from "@/lib/db";
import { Session } from "@/lib/domain/types";

export async function saveSession(session: Session): Promise<void> {
  await prisma.session.upsert({
    where: { id: session.id },
    update: {
      status: session.status,
      endedAt: session.endedAt ? new Date(session.endedAt) : null,
    },
    create: {
      id: session.id,
      policyId: session.policyId,
      ownerId: session.ownerId,
      status: session.status,
      createdAt: new Date(session.createdAt),
      endedAt: session.endedAt ? new Date(session.endedAt) : null,
    },
  });
}

export async function getSession(id: string): Promise<Session | undefined> {
  const row = await prisma.session.findUnique({ where: { id } });
  if (!row) return undefined;
  return {
    id: row.id,
    policyId: row.policyId,
    ownerId: row.ownerId,
    status: row.status as "active" | "ended",
    createdAt: row.createdAt.toISOString(),
    endedAt: row.endedAt?.toISOString(),
  };
}
