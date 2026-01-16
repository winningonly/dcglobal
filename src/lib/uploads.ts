import fs from "fs/promises";
import path from "path";
import os from "os"; // ← added proper import

export type Row = Record<string, string>;

export async function readUploadRecord(
  id: string
): Promise<{ data: Row[]; type?: string } | null> {
  if (!id) return null;

  const root = process.cwd();
  const tmpDir = process.env.TMPDIR || os.tmpdir(); // ← fixed here

  const candidates = [
    // project local db uploads (where API POST writes in dev)
    path.join(root, "db", "uploads", `${id}.json`),
    // previous locations / fallbacks
    path.join(root, "data", "uploads", `${id}.json`),
    path.join(root, "uploads", `${id}.json`),
    path.join(root, "data", `${id}.json`),
    // CSV fallbacks
    path.join(root, "data", "uploads", `${id}.csv`),
    path.join(root, "uploads", `${id}.csv`),
    // temp uploads dir (used when filesystem is read-only)
    path.join(tmpDir, "dcglobal", "uploads", `${id}.json`),
  ];

  for (const filePath of candidates) {
    try {
      const contents = await fs.readFile(filePath, "utf-8");

      if (filePath.endsWith(".json")) {
        const parsed = JSON.parse(contents);

        // Check if it's our expected wrapper format
        if (parsed && Array.isArray(parsed.data)) {
          return parsed as { data: Row[]; type?: string };
        }

        // Check if it's just an array (legacy/simple format)
        if (Array.isArray(parsed)) {
          return { data: parsed as Row[] };
        }
      } else if (filePath.endsWith(".csv")) {
        const lines = contents.split(/\r?\n/).filter(Boolean);
        if (!lines.length) continue;

        const headers = lines[0].split(",").map((h) => h.trim());
        const data: Row[] = lines.slice(1).map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          const obj: Row = {};

          headers.forEach((h, i) => {
            obj[h] = cols[i] ?? "";
          });

          return obj;
        });

        return { data };
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}