#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");
const crypto = require('crypto');
require('dotenv').config();

function usage() {
  console.log('Usage: node scripts/create-user.js --email user@example.com --password s3cr3t [--name "Full Name"] [--force]');
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

const args = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const v = argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true;
    args[k] = v;
  }
}

const email = (args.email || '').toString().toLowerCase();
const password = args.password ? args.password.toString() : '';
const name = args.name || email.split('@')[0];
const force = !!args.force;

if (!email || !password) usage();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashPassword(password, salt) {
  const derived = crypto.scryptSync(password, salt, 64);
  return derived.toString('hex');
}

async function main() {
  try {
    // Check if user exists
    const { data: existing, error: selErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (selErr) throw selErr;

    if (existing && !force) {
      console.error(`User with email ${email} already exists. Use --force to overwrite.`);
      process.exit(1);
    }

    // Generate salt and hash
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);

    if (existing && force) {
      // Update existing user
      const { error: updateErr } = await supabase
        .from("users")
        .update({ name, salt, hash })
        .eq("email", email);

      if (updateErr) throw updateErr;
      console.log('Updated user:', email);
    } else {
      // Create new user
      const { data, error: insertErr } = await supabase
        .from("users")
        .insert([{ email, name, salt, hash }])
        .select()
        .maybeSingle();

      if (insertErr) throw insertErr;
      console.log('Created user:', email);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
