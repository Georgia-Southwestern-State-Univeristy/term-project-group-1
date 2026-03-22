import { User } from "@/lib/domain/types";

const g = globalThis as unknown as { _users?: Map<string, User> };
const users = (g._users ??= new Map<string, User>());

export function saveUser(user: User): void {
  users.set(user.id, user);
}

export function getUserById(id: string): User | undefined {
  return users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}
