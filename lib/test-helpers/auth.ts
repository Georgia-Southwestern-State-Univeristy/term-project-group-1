import { signToken } from "@/lib/auth";
import { ensureSeedUsers } from "@/lib/repositories/seedUsers";
import { getUserByEmail } from "@/lib/repositories/userRepo";
import { User } from "@/lib/domain/types";

export const AGENT_USER_ID = "seed-agent-001";
export const SUPERVISOR_USER_ID = "seed-supervisor-001";

function getSeededUser(email: string): User {
  ensureSeedUsers();
  const user = getUserByEmail(email);
  if (!user) throw new Error(`Seed user ${email} not found`);
  return user;
}

export async function agentAuthHeaders(): Promise<Record<string, string>> {
  const user = getSeededUser("agent@sentinel.local");
  const token = await signToken(user);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function supervisorAuthHeaders(): Promise<Record<string, string>> {
  const user = getSeededUser("supervisor@sentinel.local");
  const token = await signToken(user);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
