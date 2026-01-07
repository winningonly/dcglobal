#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error('Missing dependency better-sqlite3. Run `npm install` and try again.');
  process.exit(1);
}
const crypto = require('crypto');

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

const DB_PATH = path.join(process.cwd(), 'db', 'dc.sqlite');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(DB_PATH);

// ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    salt TEXT,
    hash TEXT
  );
`);

const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
if (existing && !force) {
  console.error(`User with email ${email} already exists. Use --force to overwrite.`);
  process.exit(1);
}

function hashPassword(password, salt) {
  const derived = crypto.scryptSync(password, salt, 64);
  return derived.toString('hex');
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = hashPassword(password, salt);

if (existing && force) {
  const info = db.prepare('UPDATE users SET name = ?, salt = ?, hash = ? WHERE email = ?').run(name, salt, hash, email);
  console.log('Updated user:', email);
} else {
  const info = db.prepare('INSERT INTO users (email, name, salt, hash) VALUES (?, ?, ?, ?)').run(email, name, salt, hash);
  console.log('Created user:', email);
}

process.exit(0);
