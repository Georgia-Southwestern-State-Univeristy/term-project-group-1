import { prisma } from "@/lib/db";
import { Policy, PolicySummary } from "@/lib/domain/types";

export async function savePolicy(policy: Policy): Promise<void> {
  await prisma.policy.create({
    data: {
      id: policy.id,
      name: policy.name,
      text: policy.text,
      createdAt: new Date(policy.createdAt),
      checklist: {
        create: policy.checklist.map((item) => ({
          id: item.id,
          text: item.text,
          order: item.order,
        })),
      },
    },
  });
}

export async function getPolicy(id: string): Promise<Policy | undefined> {
  const row = await prisma.policy.findUnique({
    where: { id },
    include: { checklist: { orderBy: { order: "asc" } } },
  });
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    checklist: row.checklist.map((c) => ({
      id: c.id,
      policyId: c.policyId,
      text: c.text,
      order: c.order,
    })),
  };
}

export async function listPolicies(): Promise<PolicySummary[]> {
  const rows = await prisma.policy.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
  }));
}
