import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const DB_DIR = path.join(process.cwd(), "db");
const DB_FILE = path.join(DB_DIR, "users.json");

type UserRecord = {
  email: string;
  name: string;
  salt: string;
  hash: string;
};

async function ensureDb() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify([]));
    }
  } catch (err) {
    // ignore
  }
}

async function readUsers(): Promise<UserRecord[]> {
  await ensureDb();
  const txt = await fs.readFile(DB_FILE, "utf8");
  try {
    return JSON.parse(txt || "[]");
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]) {
  await ensureDb();
  await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password: string, salt: string) {
  const derived = crypto.scryptSync(password, salt, 64);
  return derived.toString("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email || "").toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const users = await readUsers();
  const existing = users.find((u) => u.email === email);

  if (existing) {
    // verify
    const attempt = hashPassword(password, existing.salt);
    if (crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(existing.hash, "hex"))) {
      return NextResponse.json({ message: "Logged in", name: existing.name });
    } else {
      return NextResponse.json({ error: "username or password is incorrect" }, { status: 401 });
    }
  }

  // register new user (store credentials) — in real app you'd require verification
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  const name = String(body.name || email.split("@")[0]);
  users.push({ email, name, salt, hash });
  await writeUsers(users);

  return NextResponse.json({ message: "Account created and logged in", name });
}
