import { prisma } from "@/lib/db";
import { Session, SessionSummary } from "@/lib/domain/types";

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

export async function listSessions(filters?: {
  ownerId?: string;
  status?: string;
}): Promise<SessionSummary[]> {
  const where: Record<string, unknown> = {};
  if (filters?.ownerId) where.ownerId = filters.ownerId;
  if (filters?.status) where.status = filters.status;

  const rows = await prisma.session.findMany({
    where,
    include: { policy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    policyId: row.policyId,
    policyName: row.policy.name,
    ownerId: row.ownerId,
    status: row.status as "active" | "ended",
    createdAt: row.createdAt.toISOString(),
    endedAt: row.endedAt?.toISOString(),
  }));
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
