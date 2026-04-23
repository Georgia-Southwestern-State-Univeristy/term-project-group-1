const g = globalThis as unknown as { _revokedJtis?: Set<string> };
const revoked = (g._revokedJtis ??= new Set<string>());

export async function revokeToken(
  jti: string,
  userId: string,
  expiresAt: Date
): Promise<void> {
  void userId;
  void expiresAt;
  revoked.add(jti);
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  return revoked.has(jti);
}
