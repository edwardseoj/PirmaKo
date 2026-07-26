import { Database } from "bun:sqlite";

const DB_PATH = "./pirmako.sqlite";

const db = new Database(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL CHECK (role IN ('requester', 'signer')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pdfs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    filename        TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'Pending',
    uploaded_at     TEXT    NOT NULL,
    user_id         INTEGER REFERENCES users(id),
    requester_email TEXT
  );
`);

try {
  db.exec(`ALTER TABLE pdfs ADD COLUMN user_id INTEGER REFERENCES users(id)`);
} catch {

}

try {
  db.exec(`ALTER TABLE pdfs ADD COLUMN requester_email TEXT`);
} catch {

}

export default db;
