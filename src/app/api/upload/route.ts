import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const DB_DIR = path.join(process.cwd(), "db");
const UPLOADS_DIR = path.join(DB_DIR, "uploads");

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type, name, data } = body;

  if (!data || !Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await ensureUploadsDir();
  const id = crypto.randomUUID();
  const filePath = path.join(UPLOADS_DIR, `${id}.json`);
  const record = { id, type, name, data, createdAt: new Date().toISOString() };
  await fs.writeFile(filePath, JSON.stringify(record, null, 2));

  return NextResponse.json({ id });
}
