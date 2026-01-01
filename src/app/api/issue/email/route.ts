import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // This is a stub — in a real app you'd queue emails or call an email service
  return NextResponse.json({ message: "Emails queued (stub)" });
}
