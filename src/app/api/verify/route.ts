import { NextResponse } from "next/server";
import { getCertificateByCode } from "@/lib/certs";

function mapCourseName(typeOrCourse?: string | undefined) {
  const map: Record<string, string> = {
    "dli-basic": "DLI Basic",
    "dli-advanced": "DLI Advanced",
    "discipleship": "Dominion Leadership Institute",
  };
  if (!typeOrCourse) return null;
  // if it's already a friendly course name, return it
  if (["DLI Basic", "DLI Advanced", "Dominion Leadership Institute"].includes(typeOrCourse)) {
    return typeOrCourse;
  }
  return (map[typeOrCourse] as string) || null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = (body?.id || "").toString().trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const record = await getCertificateByCode(id);
  if (!record) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const date = record.issuedAt ? new Date(record.issuedAt).toLocaleDateString("en-GB") : null;

  // prefer explicit courseName saved on record, otherwise try type or uploaded data
  let courseName = record.courseName || mapCourseName(record.type);
  if (!courseName && record.data) {
    const candidates = ["Course Name", "Course", "course_name", "course", "courseName"];
    const data = record.data as Record<string, string>;
    for (const key of candidates) {
      const v = data[key];
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
