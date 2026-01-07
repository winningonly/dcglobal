import { NextResponse } from "next/server";
import crypto from "crypto";
import { findUserByEmail, createUser } from "@/lib/users";

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

  const existing = findUserByEmail(email);

  if (!existing) {
    // Do not auto-register here; only allow existing users to log in
    return NextResponse.json({ error: "username or password is incorrect" }, { status: 401 });
  }

  // verify
  const attempt = hashPassword(password, existing.salt);
  try {
    if (crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(existing.hash, "hex"))) {
      return NextResponse.json({ message: "Logged in", name: existing.name });
    }
  } catch (e) {
    // timingSafeEqual throws for unequal lengths; fall through
  }

  return NextResponse.json({ error: "username or password is incorrect" }, { status: 401 });
}
