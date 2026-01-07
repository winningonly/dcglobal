#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error('Please install better-sqlite3 first: npm install better-sqlite3');
  process.exit(1);
}

const DB_PATH = path.join(process.cwd(), 'db', 'dc.sqlite');
const CERTS_FILE = path.join(process.cwd(), 'db', 'certificates.json');
const USERS_FILE = path.join(process.cwd(), 'db', 'users.json');

function ensureDb() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
}

ensureDb();
const db = new Database(DB_PATH);

// Create tables if missing
db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY,
    code TEXT UNIQUE,
    uploadId TEXT,
    name TEXT,
    email TEXT,
    filename TEXT,
    issuedAt TEXT,
    method TEXT,
    type TEXT,
    courseName TEXT,
    data TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    salt TEXT,
    hash TEXT
  );
`);

function migrateCerts() {
  if (!fs.existsSync(CERTS_FILE)) {
    console.log('No certificates.json found, skipping certificates migration');
    return;
  }
  const txt = fs.readFileSync(CERTS_FILE, 'utf8');
  let items = [];
  try { items = JSON.parse(txt || '[]'); } catch (e) { console.error('Failed to parse certificates.json', e); return; }

  const stmt = db.prepare(`INSERT OR REPLACE INTO certificates
    (code, uploadId, name, email, filename, issuedAt, method, type, courseName, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  let count = 0;
  const insert = db.transaction((rows) => {
    for (const r of rows) {
      stmt.run(r.code, r.uploadId || null, r.name || null, r.email || null, r.filename || null, r.issuedAt || null, r.method || null, r.type || null, r.courseName || null, r.data ? JSON.stringify(r.data) : null);
      count++;
    }
  });

  insert(items);
  console.log(`Inserted/updated ${count} certificates`);
}

function migrateUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    console.log('No users.json found, skipping users migration');
    return;
  }
  const txt = fs.readFileSync(USERS_FILE, 'utf8');
  let users = [];
  try { users = JSON.parse(txt || '[]'); } catch (e) { console.error('Failed to parse users.json', e); return; }

  const stmt = db.prepare(`INSERT OR IGNORE INTO users (email, name, salt, hash) VALUES (?, ?, ?, ?)`);
  let count = 0;
  const insert = db.transaction((rows) => {
    for (const u of rows) {
      stmt.run((u.email || '').toLowerCase(), u.name || '', u.salt || '', u.hash || '');
      count++;
    }
  });
  insert(users);
  console.log(`Inserted ${count} users`);
}

migrateCerts();
migrateUsers();

console.log('Migration complete.');
