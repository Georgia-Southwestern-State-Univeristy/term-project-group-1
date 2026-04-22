import { prisma } from "@/lib/db";

export async function revokeToken(
  jti: string,
  userId: string,
  expiresAt: Date
): Promise<void> {
  await prisma.revokedToken.upsert({
    where: { jti },
    update: {},
    create: { jti, userId, expiresAt },
  });
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  const row = await prisma.revokedToken.findUnique({ where: { jti } });
  return row !== null;
}
