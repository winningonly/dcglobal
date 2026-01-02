import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const UPLOADS_DIR = path.join(process.cwd(), "db", "uploads");
  const filePath = path.join(UPLOADS_DIR, `${id}.json`);
  try {
    const txt = await fs.readFile(filePath, "utf8");
    const record = JSON.parse(txt);
    // in real app you would queue emails using record.data
    return NextResponse.json({ message: `Emails queued for ${record.data.length} trainees (stub)` });
  } catch (err) {
    return NextResponse.json({ error: "upload not found" }, { status: 404 });
  }
}
