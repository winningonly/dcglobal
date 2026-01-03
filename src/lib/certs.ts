import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

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

const DB_FILE = path.join(process.cwd(), "db", "certificates.json");

async function loadAll(): Promise<CertificateRecord[]> {
  try {
    const txt = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(txt) as CertificateRecord[];
  } catch (e) {
    return [];
  }
}

async function saveAll(items: CertificateRecord[]) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(items, null, 2), "utf8");
}

function mapCourseName(type?: string) {
  const map: Record<string, string> = {
    "dli-basic": "DLI Basic",
    "dli-advanced": "DLI Advanced",
    "discipleship": "Dominion Leadership Institute",
  };
  return (type && map[type]) || null;
}

function courseFromData(data?: Record<string, string>) {
  if (!data) return null;
  const candidates = ["Course Name", "Course", "course_name", "course", "courseName"];
  for (const key of candidates) {
    const v = (data as any)[key];
    if (v && typeof v === "string" && v.trim()) {
      // Normalize common values
      const lower = v.toLowerCase();
      if (lower.includes("advanced") && lower.includes("dli")) return "DLI Advanced";
      if (lower.includes("basic") && lower.includes("dli")) return "DLI Basic";
      if (lower.includes("domin") || lower.includes("discipleship") || lower.includes("dli")) {
        // If it already contains DLI but not explicit basic/advanced, prefer the generic name
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

  const items = await loadAll();
  items.push(cert);
  await saveAll(items);
  return cert;
}

export async function getCertificateByCode(code: string) {
  const find = (await loadAll()).find((c) => c.code?.toUpperCase() === code.toString().trim().toUpperCase());
  return find || null;
}

export async function generateUniqueCode(): Promise<string> {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `DC${randomDigits}`;
}
