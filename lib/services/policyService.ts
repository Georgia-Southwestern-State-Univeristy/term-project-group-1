import { Policy, PolicySummary } from "@/lib/domain/types";
import {
  savePolicy,
  getPolicy,
  listPolicies as repoListPolicies,
} from "@/lib/repositories/policyRepo";

export function createPolicyFromText(name: string, text: string): Policy {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const checklist = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      id: crypto.randomUUID(),
      policyId: id,
      text: line,
      order: index + 1,
    }));

  const policy: Policy = { id, name, text, createdAt, checklist };
  savePolicy(policy);
  return policy;
}

export function fetchPolicy(id: string): Policy | undefined {
  return getPolicy(id);
}

export function listPolicies(): PolicySummary[] {
  return repoListPolicies();
}
