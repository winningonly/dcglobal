import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const PROJECT_DB_DIR = path.join(process.cwd(), "db");
const PROJECT_UPLOADS_DIR = path.join(PROJECT_DB_DIR, "uploads");
const TMP_UPLOADS_DIR = path.join(process.env.TMPDIR || os.tmpdir(), "dcglobal", "uploads");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeRecord(dir: string, id: string, record: unknown) {
  const filePath = path.join(dir, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type, name, data } = body as {
    type?: string;
    name?: string;
    data?: unknown[];
  };

  if (!data || !Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const record = { id, type, name, data, createdAt: new Date().toISOString() };

  // Try writing to project DB uploads dir (local dev). If the environment
  // filesystem is read-only (e.g. Netlify functions), fall back to a temp dir.
  try {
    await ensureDir(PROJECT_UPLOADS_DIR);
    await writeRecord(PROJECT_UPLOADS_DIR, id, record);
  } catch (err: unknown) {
    console.warn(
      "Could not write to project uploads dir, falling back to tmp:",
      (err as { code?: string })?.code || err
    );

    try {
      await ensureDir(TMP_UPLOADS_DIR);
      await writeRecord(TMP_UPLOADS_DIR, id, record);
    } catch (err2: unknown) {
      console.error("Failed to write upload record to tmp dir:", err2);
      return NextResponse.json({ error: "Could not save upload" }, { status: 500 });
    }
  }

  return NextResponse.json({ id });
}