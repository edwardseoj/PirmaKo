/**
 * database.ts — SQLite setup using Bun's built-in sqlite module.
 *
 * Creates a "pdfs" table to store uploaded PDF metadata.
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

// Create the "pdfs" table if it doesn't exist yet.
// - id:        unique row identifier (auto-increment)
// - title:     user-visible name of the PDF (filename without extension)
// - filename:  actual file saved on disk inside /uploads
// - status:    "Pending" | "Signed" | "Failed"
// - uploaded_at: ISO-8601 timestamp of when the file was uploaded
db.exec(`
  CREATE TABLE IF NOT EXISTS pdfs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    filename   TEXT    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'Pending',
    uploaded_at TEXT   NOT NULL
  );
`);

export default db;
