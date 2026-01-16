const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// allow override via DOTENV_PATH, otherwise load project root .env
const dotenvPath = process.env.DOTENV_PATH || path.join(__dirname, "..", ".env");
require("dotenv").config({ path: dotenvPath });
console.log("Loaded .env from:", dotenvPath);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
  const { data, error } = await supabase.from("users").select("*").limit(1);
  if (error) throw error;
  console.log("users sample:", data);
}
main().catch(e => { console.error(e); process.exit(1); });