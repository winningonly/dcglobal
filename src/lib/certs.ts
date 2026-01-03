import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const CERT_DIR = path.join(process.cwd(), "db");
const CERT_FILE = path.join(CERT_DIR, "certificates.json");

export type CertificateRecord = {
  code: string;
  uploadId: string;
  name: string;
  email: string;
  filename: string;
  issuedAt: string;
  method: "email" | "download";
};

async function ensureCertDb() {
  try {
    await fs.mkdir(CERT_DIR, { recursive: true });
    try {
      await fs.access(CERT_FILE);
    } catch {
      await fs.writeFile(CERT_FILE, JSON.stringify([]));
    }
  } catch (err) {
    // ignore
  }
}

export async function readCertificates(): Promise<CertificateRecord[]> {
  await ensureCertDb();
  const txt = await fs.readFile(CERT_FILE, "utf8");
  try {
    return JSON.parse(txt || "[]");
  } catch {
    return [];
  }
}

export async function writeCertificates(records: CertificateRecord[]) {
  await ensureCertDb();
  await fs.writeFile(CERT_FILE, JSON.stringify(records, null, 2));
}

export async function saveCertificate(record: CertificateRecord) {
  const arr = await readCertificates();
  arr.push(record);
  await writeCertificates(arr);
}

export function generateCode(): string {
  const num = crypto.randomInt(0, 100_000_000);
  return `DC${String(num).padStart(8, "0")}`;
}

export async function generateUniqueCode(): Promise<string> {
  const existing = await readCertificates();
  const existingSet = new Set(existing.map((r) => r.code));
  for (let i = 0; i < 10000; i++) {
    const c = generateCode();
    if (!existingSet.has(c)) return c;
  }
  // fallback: append timestamp
  return `DC${Date.now()}`;
}
