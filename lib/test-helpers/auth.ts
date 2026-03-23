import { signToken } from "@/lib/auth";
import { ensureSeedUsers } from "@/lib/repositories/seedUsers";
import { getUserByEmail } from "@/lib/repositories/userRepo";
import { User } from "@/lib/domain/types";

export const AGENT_USER_ID = "seed-agent-001";
export const SUPERVISOR_USER_ID = "seed-supervisor-001";

async function getSeededUser(email: string): Promise<User> {
  await ensureSeedUsers();
  const user = await getUserByEmail(email);
  if (!user) throw new Error(`Seed user ${email} not found`);
  return user;
}

export async function agentAuthHeaders(): Promise<Record<string, string>> {
  const user = await getSeededUser("agent@sentinel.local");
  const token = await signToken(user);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function supervisorAuthHeaders(): Promise<Record<string, string>> {
  const user = await getSeededUser("supervisor@sentinel.local");
  const token = await signToken(user);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
