import crypto from "crypto";
import { db } from "./db";

export interface CertificateRecord {
  code: string;
  uploadId: string;
  name: string;
  email: string;
  filename: string;
  issuedAt: string; // ISO string
  method?: string;
  type?: string;
  courseName?: string;
  data?: Record<string, string>; // full trainee row
}

// Define the raw row type as returned by better-sqlite3
interface DbCertificateRow {
  id: number;
  code: string;
  uploadId: string;
  name: string;
  email: string;
  filename: string;
  issuedAt: string;
  method: string | null;
  type: string | null;
  courseName: string | null;
  data: string | null;
}

function mapCourseName(type?: string) {
  const map: Record<string, string> = {
    "dli-basic": "DLI Basic",
    "dli-advanced": "DLI Advanced",
    "discipleship": "Dominion Leadership Institute",
  };
  return (type && map[type]) || null;
}

function courseFromData(data?: Record<string, string> | null) {
  if (!data) return null;
  const candidates = ["Course Name", "Course", "course_name", "course", "courseName"];
  for (const key of candidates) {
    const v = data[key as keyof Record<string, string>] as string | undefined;
    if (v && typeof v === "string" && v.trim()) {
      const lower = v.toLowerCase();
      if (lower.includes("advanced") && lower.includes("dli")) return "DLI Advanced";
      if (lower.includes("basic") && lower.includes("dli")) return "DLI Basic";
      if (lower.includes("domin") || lower.includes("discipleship") || lower.includes("dli")) {
        if (lower.includes("basic")) return "DLI Basic";
        if (lower.includes("advanced")) return "DLI Advanced";
        return "Dominion Leadership Institute";
      }
      return v;
    }
  }
  return null;
}

export async function saveCertificate(cert: CertificateRecord) {
  // derive courseName if not set
  if (!cert.courseName) {
    cert.courseName = mapCourseName(cert.type) || courseFromData(cert.data) || undefined;
  }

  // insert into sqlite
  const stmt = db.prepare(`INSERT OR REPLACE INTO certificates
    (code, uploadId, name, email, filename, issuedAt, method, type, courseName, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  stmt.run(
    cert.code,
    cert.uploadId,
    cert.name,
    cert.email,
    cert.filename,
    cert.issuedAt,
    cert.method || null,
    cert.type || null,
    cert.courseName || null,
    cert.data ? JSON.stringify(cert.data) : null
  );

  return cert;
}

export async function getCertificateByCode(code: string) {
  const row = db.prepare(`SELECT * FROM certificates WHERE UPPER(code)=?`)
    .get(code.toString().trim().toUpperCase()) as DbCertificateRow | undefined;

  if (!row) return null;

  return {
    code: row.code,
    uploadId: row.uploadId,
    name: row.name,
    email: row.email,
    filename: row.filename,
    issuedAt: row.issuedAt,
    method: row.method ?? undefined,
    type: row.type ?? undefined,
    courseName: row.courseName ?? undefined,
    data: row.data ? JSON.parse(row.data) : undefined,
  } as CertificateRecord;
}

export async function generateUniqueCode(): Promise<string> {
  // loop until unique (should be fast since space is large)
  while (true) {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const code = `DC${randomDigits}`;
    const exists = db.prepare(`SELECT 1 FROM certificates WHERE code = ?`).get(code);
    if (!exists) return code;
  }
}