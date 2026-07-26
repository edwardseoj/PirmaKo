/**
 * Backend test helpers — shared utilities for server-side tests.
 *
 * Provides:
 *   - A fresh in-memory SQLite database for each test suite
 *   - Helper functions for seeding test data
 *   - Elysia test client utilities
 */

import { Database } from "bun:sqlite";

/**
 * Create a fresh in-memory SQLite database with the same schema as production.
 * Each test suite should call this in beforeAll/beforeEach for isolation.
 */
export function createTestDb(): Database {
  const db = new Database(":memory:");

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

  return db;
}

/**
 * Seed a test user into the database.
 * Returns the inserted user's ID.
 */
export async function seedUser(
  db: Database,
  email: string,
  password: string,
  role: "requester" | "signer" = "requester"
): Promise<number> {
  const hashedPassword = await Bun.password.hash(password);
  const result = db
    .prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)")
    .run(email, hashedPassword, role);
  return Number(result.lastInsertRowid);
}

/**
 * Seed a test PDF into the database.
 * Returns the inserted PDF's ID.
 */
export function seedPdf(
  db: Database,
  title: string,
  filename: string,
  options: {
    status?: string;
    userId?: number;
    requesterEmail?: string;
  } = {}
): number {
  const { status = "Pending", userId, requesterEmail } = options;
  const uploadedAt = new Date().toISOString();
  const result = db
    .prepare(
      "INSERT INTO pdfs (title, filename, status, uploaded_at, user_id, requester_email) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(title, filename, status, uploadedAt, userId || null, requesterEmail || null);
  return Number(result.lastInsertRowid);
}
