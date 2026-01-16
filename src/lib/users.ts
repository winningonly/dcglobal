import { supabase } from "./supabase";

export type UserRecord = {
  id?: number;
  email: string;
  name: string;
  salt: string;
  hash: string;
};

type SupabaseError = {
  message: string;
  // other common fields like code, details, hint if needed
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function createUser(u: UserRecord) {
  const payload = {
    email: u.email.toLowerCase(),
    name: u.name,
    salt: u.salt,
    hash: u.hash,
  };

  const { data, error } = await supabase
    .from("users")
    .insert([payload])
    .select()
    .maybeSingle();

  if (error) {
    // duplicate / unique violation -> emulate INSERT OR IGNORE by returning null
    const msg = String((error as SupabaseError).message || "");
    if (msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
      return null;
    }
    throw error;
  }

  return data;
}

/*
-- Users
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  salt text NOT NULL,
  hash text NOT NULL
);

-- Trainees (example)
CREATE TABLE IF NOT EXISTS trainees (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id),
  -- add fields you need for trainee data
  created_at timestamptz DEFAULT now()
);
*/