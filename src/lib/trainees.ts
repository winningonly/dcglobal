import { supabase } from "./supabase";
import { promises as fs } from "fs";
import path from "path";

export type TraineeRecord = {
  name: string;
  email?: string | null;
  courseName?: string | null;
  location?: string | null;
  phone?: string | null;
  date?: string | null; // ISO string
  dc_id: string;
  created_at?: string;
};

export async function upsertTrainee(t: TraineeRecord) {
  const payload = { ...t, dc_id: String(t.dc_id).toUpperCase() };
  try {
    const { data, error } = await supabase
      .from("trainees")
      .upsert([payload], { onConflict: "dc_id" })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err: unknown) {
    // If Supabase complains about missing columns, try snake_case keys, otherwise fallback to local file
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
            .from("trainees")
            .upsert([snakePayload], { onConflict: "dc_id" })
            .select()
            .maybeSingle();

          if (!error2) return data2 as TraineeRecord;
        } catch {
          // fall through to local fallback
        }
      }
    } catch {
      // ignore probing errors and continue to local fallback
    }

    // fallback to local file storage db/trainees.json
    try {
      const file = path.join(process.cwd(), "db", "trainees.json");
      await fs.mkdir(path.dirname(file), { recursive: true }).catch(() => {});
      const contents = await fs.readFile(file, "utf-8").catch(() => "[]");
      const arr: TraineeRecord[] = JSON.parse(contents || "[]");
      const idx = arr.findIndex((x) => x.dc_id && x.dc_id.toUpperCase() === payload.dc_id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...payload };
      } else {
        arr.push(payload as TraineeRecord);
      }
      await fs.writeFile(file, JSON.stringify(arr, null, 2), "utf-8");
      return payload as TraineeRecord;
    } catch (e: unknown) {
      try {
        console.error("upsertTrainee: supabase error", err);
        console.error("upsertTrainee: local fallback error", e);
      } catch {
        // ignore logging errors
      }
      return payload as TraineeRecord;
    }
  }
}

export async function findTraineeByDcId(dc_id: string) {
  if (!dc_id) return null;
  const key = String(dc_id).toUpperCase();
  try {
    const { data, error } = await supabase
      .from("trainees")
      .select("*")
      .eq("dc_id", key)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as TraineeRecord;
  } catch {
    // ignore supabase errors and fall through to local lookup
  }

  try {
    const file = path.join(process.cwd(), "db", "trainees.json");
    const contents = await fs.readFile(file, "utf-8").catch(() => "[]");
    const arr: TraineeRecord[] = JSON.parse(contents || "[]");
    const found = arr.find((x) => x.dc_id && x.dc_id.toUpperCase() === key);
    return found ?? null;
  } catch {
    return null;
  }
}