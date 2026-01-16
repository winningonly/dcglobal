#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dataPath = path.join(__dirname, "../data.json"); // adjust if needed
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));

async function run() {
  for (const cert of payload.certificates || []) {
    cert.code = cert.code.toUpperCase();
    const { error } = await supabase.from("certificates").upsert([cert], { onConflict: "code" });
    if (error) console.error("certificate upsert error", cert.code, error);
  }

  for (const user of payload.users || []) {
    const u = { email: user.email.toLowerCase(), name: user.name, salt: user.salt, hash: user.hash };
    const { error } = await supabase.from("users").upsert([u], { onConflict: "email" });
    if (error) console.error("user upsert error", u.email, error);
  }

  console.log("migration complete");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
