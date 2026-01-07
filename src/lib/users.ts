import { db } from "./db";

export type UserRecord = {
  id?: number;
  email: string;
  name: string;
  salt: string;
  hash: string;
};

export function findUserByEmail(email: string): UserRecord | null {
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase());
  if (!row) return null;
  return row as UserRecord;
}

export function createUser(u: UserRecord) {
  const stmt = db.prepare(`INSERT OR IGNORE INTO users (email, name, salt, hash) VALUES (?, ?, ?, ?)`);
  const info = stmt.run(u.email.toLowerCase(), u.name, u.salt, u.hash);
  return info;
}