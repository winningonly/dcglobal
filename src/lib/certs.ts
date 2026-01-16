import { supabase } from "./supabase";
import { promises as fs } from "fs";
import path from "path";

export type CertificateRecord = {
  name: string;
  type: string;
  data: boolean;
  courseName: string | null;
  issuedAt: string;
  id?: number;
  code: string;
  // add other certificate fields here (issuer, name, etc.)
  created_at?: string;
};

export async function upsertCertificate(c: CertificateRecord) {
  const payload = { ...c, code: c.code.toUpperCase() };
  try {
    const { data, error } = await supabase
      .from("certificates")
      .upsert([payload], { onConflict: "code" })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err: unknown) {
    // If Supabase complains about missing columns (schema mismatch), try snake_case keys
    try {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj.code ?? "";
      const msg = String(errorObj.message || "");

      if (code === "PGRST204" || /Could not find the '.*' column/.test(msg)) {
        const snakePayload: Record<string, unknown> = {};
        for (const k of Object.keys(payload)) {
          const snake = k.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
          snakePayload[snake] = payload[k as keyof typeof payload];
        }

        try {
          const { data: data2, error: error2 } = await supabase
            .from("certificates")
            .upsert([snakePayload], { onConflict: "code" })
            .select()
            .maybeSingle();

          if (!error2) return data2 as CertificateRecord;
        } catch {
          // fall through to local fallback
        }
      }
    } catch {
      // ignore probing errors and continue to local fallback
    }

    // fallback to local file storage in db/certificates.json
    try {
      const file = path.join(process.cwd(), "db", "certificates.json");
      await fs.mkdir(path.dirname(file), { recursive: true }).catch(() => {});
      const contents = await fs.readFile(file, "utf-8").catch(() => "[]");
      const arr: CertificateRecord[] = JSON.parse(contents || "[]");
      const idx = arr.findIndex((x) => x.code && x.code.toUpperCase() === payload.code);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...payload };
      } else {
        arr.push(payload as CertificateRecord);
      }
      await fs.writeFile(file, JSON.stringify(arr, null, 2), "utf-8");
      return payload as CertificateRecord;
    } catch (e: unknown) {
      // if local fallback fails for any reason, log both errors and return payload
      try {
        console.error("upsertCertificate: supabase error", err);
        console.error("upsertCertificate: local fallback error", e);
      } catch {
        // ignore logging errors
      }
      return payload as CertificateRecord;
    }
  }
}

export async function findCertificateByCode(code: string) {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error) throw error;
    if (data) return data as CertificateRecord;
  } catch {
    console.log("Supabase lookup failed, falling back to local storage");
  }

  // local fallback
  try {
    const file = path.join(process.cwd(), "db", "certificates.json");
    const contents = await fs.readFile(file, "utf-8").catch(() => "[]");
    const arr: CertificateRecord[] = JSON.parse(contents || "[]");
    const found = arr.find((x) => x.code && x.code.toUpperCase() === code.toUpperCase());
    return found ?? null;
  } catch {
    return null;
  }
}

export async function certificateExists(code: string) {
  const { error, count } = await supabase
    .from("certificates")
    .select("id", { head: true, count: "exact" })
    .eq("code", code.toUpperCase());

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function generateUniqueCode(): Promise<string> {
  // loop until unique (should be fast since space is large)
  while (true) {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const code = `DC${randomDigits}`;
    const exists = await certificateExists(code);
    if (!exists) return code;
  }
}