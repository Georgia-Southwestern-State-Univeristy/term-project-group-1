import { User } from "@/lib/domain/types";

const g = globalThis as unknown as { _users?: Map<string, User> };
const users = (g._users ??= new Map<string, User>());

export async function saveUser(user: User): Promise<void> {
  users.set(user.id, user);
}

export async function getUserById(id: string): Promise<User | undefined> {
  return users.get(id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}
