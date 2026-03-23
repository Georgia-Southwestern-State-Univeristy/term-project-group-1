import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

const seedUsers = [
  {
    id: "seed-agent-001",
    email: "agent@sentinel.local",
    password: "agent123",
    role: "agent",
    name: "Demo Agent",
  },
  {
    id: "seed-supervisor-001",
    email: "supervisor@sentinel.local",
    password: "supervisor123",
    role: "supervisor",
    name: "Demo Supervisor",
  },
];

async function main() {
  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        passwordHash: hashPassword(u.password),
        role: u.role,
        name: u.name,
      },
    });
    console.log(`Seeded user: ${u.email} (${u.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
