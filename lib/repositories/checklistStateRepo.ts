import { prisma } from "@/lib/db";

export async function markChecked(
  sessionId: string,
  itemId: string
): Promise<void> {
  await prisma.checklistState.upsert({
    where: { sessionId_itemId: { sessionId, itemId } },
    update: { checked: true },
    create: { sessionId, itemId, checked: true },
  });
}

export async function getCheckedIds(sessionId: string): Promise<string[]> {
  const rows = await prisma.checklistState.findMany({
    where: { sessionId, checked: true },
    select: { itemId: true },
  });
  return rows.map((r) => r.itemId);
}
