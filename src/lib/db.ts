import path from "path";
import fs from "fs";
import type { Database as BetterSqlite3Database, Options } from "better-sqlite3";

// Lazy-load better-sqlite3 to avoid module resolution issues in environments that don't have it installed
// We use dynamic import() instead of require() to satisfy @typescript-eslint/no-require-imports
let Database: new (filename: string, options?: Options) => BetterSqlite3Database;
try {
  const betterSqlite3 = await import("better-sqlite3");
  Database = betterSqlite3.default;
} catch (e) {
  throw new Error(
    "Missing dependency: better-sqlite3. Run `npm install better-sqlite3` (or yarn/pnpm/bun) and try again."
  );
}

const DB_PATH = path.join(process.cwd(), "db", "dc.sqlite");

function ensureDbDir() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Use a global to avoid creating multiple DB connections in a hot-reload/dev server
// Extend global with a typed property to avoid any
declare global {
  var __dc_db: BetterSqlite3Database | undefined;
}

if (!global.__dc_db) {
  ensureDbDir();
  global.__dc_db = new Database(DB_PATH);
  const db = global.__dc_db;

  // create tables
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
}

export const db = global.__dc_db as BetterSqlite3Database;

export function closeDb() {
  try {
    db.close();
  } catch (e) {
    // ignore
  }
}