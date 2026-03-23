import { Policy, PolicySummary } from "@/lib/domain/types";
import {
  savePolicy,
  getPolicy,
  listPolicies as repoListPolicies,
} from "@/lib/repositories/policyRepo";

export async function createPolicyFromText(
  name: string,
  text: string
): Promise<Policy> {
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
  await savePolicy(policy);
  return policy;
}

export async function fetchPolicy(id: string): Promise<Policy | undefined> {
  return await getPolicy(id);
}

export async function listPolicies(): Promise<PolicySummary[]> {
  return await repoListPolicies();
}
