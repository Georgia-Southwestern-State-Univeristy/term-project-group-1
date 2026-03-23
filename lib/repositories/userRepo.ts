import { prisma } from "@/lib/db";
import { User } from "@/lib/domain/types";

export async function saveUser(user: User): Promise<void> {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      name: user.name,
    },
    create: {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      name: user.name,
    },
  });
}

export async function getUserById(id: string): Promise<User | undefined> {
  const row = await prisma.user.findUnique({ where: { id } });
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as "agent" | "supervisor",
    name: row.name,
  };
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const row = await prisma.user.findUnique({ where: { email } });
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as "agent" | "supervisor",
    name: row.name,
  };
}
