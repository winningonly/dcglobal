import { NextResponse } from "next/server";
import { findCertificateByCode } from "@/lib/certs";
import { findTraineeByDcId } from "@/lib/trainees";
import { promises as fs } from "fs";
import path from "node:path";

function mapCourseName(typeOrCourse?: unknown): string | null {
  const map: Record<string, string> = {
    "dli-basic": "DLI Basic",
    "dli-advanced": "DLI Advanced",
    "discipleship": "Dominion Leadership Institute",
  };
  if (!typeOrCourse) return null;
  const value = typeof typeOrCourse === "string" ? typeOrCourse : undefined;
  if (!value) return null;
  // if it's already a friendly course name, return it
  if (["DLI Basic", "DLI Advanced", "Dominion Leadership Institute"].includes(value)) {
    return value;
  }
  return (map[value] as string) || null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = (body?.id || "").toString().trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const record = await findCertificateByCode(id);
  if (!record) {
    return NextResponse.json({ found: false }, { status: 200 });
  }
  // first try trainee table (dc_id lookup)
  try {
    const trainee = await findTraineeByDcId(id);
    if (trainee) {
      return NextResponse.json({
        found: true,
        name: trainee.name,
        email: trainee.email || null,
        courseName: trainee.courseName || null,
        location: trainee.location || null,
        phone: trainee.phone || null,
        date: trainee.date ? new Date(trainee.date).toLocaleDateString("en-GB") : null,
        dc_id: trainee.dc_id,
      });
    }
  } catch (e) {
    // ignore trainee lookup errors and fall back to certificate lookup
  }

  const date = record.issuedAt ? new Date(record.issuedAt).toLocaleDateString("en-GB") : null;

  // prefer explicit courseName saved on record, otherwise try type or uploaded data
  let courseName = record.courseName || mapCourseName(record.type);
  if (!courseName && record.data) {
    const candidates = ["Course Name", "Course", "course_name", "course", "courseName"];
    const data = record.data as unknown as Record<string, string> | undefined;
    for (const key of candidates) {
      const v = data?.[key];
      if (v && typeof v === "string" && v.trim()) {
        courseName = v;
        break;
      }
    }
  }

  return NextResponse.json({
    found: true,
    name: record.name,
    courseName: courseName || null,
    date,
  });
}