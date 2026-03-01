import { Policy, PolicySummary } from "@/lib/domain/types";

const g = globalThis as unknown as { _policies?: Map<string, Policy> };
const policies = (g._policies ??= new Map<string, Policy>());

export function savePolicy(policy: Policy): void {
  policies.set(policy.id, policy);
}

export function getPolicy(id: string): Policy | undefined {
  return policies.get(id);
}

export function listPolicies(): PolicySummary[] {
  return Array.from(policies.values()).map(({ id, name, createdAt }) => ({
    id,
    name,
    createdAt,
  }));
}
