import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const filePath = path.join(process.cwd(), "db", "uploads", `${id}.json`);
  try {
    const txt = await fs.readFile(filePath, "utf8");
    const record = JSON.parse(txt);
    const count = (record.data || []).length;
    return NextResponse.json({ found: true, count, type: record.type || null });
  } catch (err) {
    return NextResponse.json({ found: false }, { status: 200 });
  }
}
