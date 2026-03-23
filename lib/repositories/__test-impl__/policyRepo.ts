import { Policy, PolicySummary } from "@/lib/domain/types";

const g = globalThis as unknown as { _policies?: Map<string, Policy> };
const policies = (g._policies ??= new Map<string, Policy>());

export async function savePolicy(policy: Policy): Promise<void> {
  policies.set(policy.id, policy);
}

export async function getPolicy(id: string): Promise<Policy | undefined> {
  return policies.get(id);
}

export async function listPolicies(): Promise<PolicySummary[]> {
  return Array.from(policies.values()).map(({ id, name, createdAt }) => ({
    id,
    name,
    createdAt,
  }));
}
