import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const SEED_AGENT_ID = "seed-agent-001";
const SEED_SUPERVISOR_ID = "seed-supervisor-001";

const seedData = [
  {
    id: SEED_AGENT_ID,
    email: "agent@sentinel.local",
    role: "agent" as const,
    name: "Demo Agent",
    password: "agent123",
  },
  {
    id: SEED_SUPERVISOR_ID,
    email: "supervisor@sentinel.local",
    role: "supervisor" as const,
    name: "Demo Supervisor",
    password: "supervisor123",
  },
];

export async function ensureSeedUsers(): Promise<void> {
  for (const { password, ...data } of seedData) {
    await prisma.user.upsert({
      where: { id: data.id },
      update: {},
      create: { ...data, passwordHash: hashPassword(password) },
    });
  }
}
