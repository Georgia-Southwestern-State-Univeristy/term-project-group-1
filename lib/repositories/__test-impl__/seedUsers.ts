import { User } from "@/lib/domain/types";
import { hashPassword } from "@/lib/auth";
import { getUserById, saveUser } from "./userRepo";

const SEED_AGENT_ID = "seed-agent-001";
const SEED_SUPERVISOR_ID = "seed-supervisor-001";

const seedData: Omit<User, "passwordHash">[] = [
  {
    id: SEED_AGENT_ID,
    email: "agent@sentinel.local",
    role: "agent",
    name: "Demo Agent",
  },
  {
    id: SEED_SUPERVISOR_ID,
    email: "supervisor@sentinel.local",
    role: "supervisor",
    name: "Demo Supervisor",
  },
];

const seedPasswords: Record<string, string> = {
  [SEED_AGENT_ID]: "agent123",
  [SEED_SUPERVISOR_ID]: "supervisor123",
};

export async function ensureSeedUsers(): Promise<void> {
  for (const data of seedData) {
    if (!(await getUserById(data.id))) {
      await saveUser({
        ...data,
        passwordHash: hashPassword(seedPasswords[data.id]),
      });
    }
  }
}
