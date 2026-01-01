import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // This is a stub — in a real app you'd generate a zip and return a download URL
  return NextResponse.json({ message: "ZIP generated (stub)", url: "/download/not-implemented.zip" });
}
