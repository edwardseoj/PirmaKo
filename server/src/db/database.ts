/**
 * database.ts — SQLite setup using Bun's built-in sqlite module.
 *
 * Creates tables for:
 *   - users:  authentication (email, hashed password, role)
 *   - pdfs:   uploaded PDF metadata (linked to a user via user_id)
 *
 * The actual PDF binary is saved to disk (./uploads/), and the
 * database only keeps a reference to the file path.
 */

import { Database } from "bun:sqlite";

// Where to store the database file on disk.
// Using a path relative to the server root so it persists between restarts.
const DB_PATH = "./pirmako.sqlite";

// Create (or open) the SQLite database.
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance.
db.exec("PRAGMA journal_mode = WAL;");

// ── Users table ────────────────────────────────────────────────
// Stores authentication credentials and role information.
// - id:         unique row identifier (auto-increment)
// - email:      unique email address (used as login identifier)
// - password:   bcrypt hash via Bun.password
// - role:       "requester" | "signer" — determines which UI and permissions
// - created_at: ISO-8601 timestamp
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL CHECK (role IN ('requester', 'signer')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── PDFs table ─────────────────────────────────────────────────
// Stores uploaded PDF metadata, linked to the user who uploaded it.
// - id:              unique row identifier (auto-increment)
// - title:           user-visible name of the PDF (filename without extension)
// - filename:        actual file saved on disk inside /uploads
// - status:          "Pending" | "Signed" | "Failed"
// - uploaded_at:     ISO-8601 timestamp of when the file was uploaded
// - user_id:         foreign key → users.id (who uploaded this PDF)
// - requester_email: email of the requester who uploaded the PDF (for signer visibility)
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

// ── Migration: add user_id to existing pdfs ────────────────────
// If the pdfs table already exists without user_id, add it.
// SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we catch the error.
try {
  db.exec(`ALTER TABLE pdfs ADD COLUMN user_id INTEGER REFERENCES users(id)`);
} catch {
  // Column already exists — safe to ignore.
}

// ── Migration: add requester_email to existing pdfs ────────────
// Links each PDF to the requester's email so signers can see who uploaded it.
try {
  db.exec(`ALTER TABLE pdfs ADD COLUMN requester_email TEXT`);
} catch {
  // Column already exists — safe to ignore.
}

export default db;
