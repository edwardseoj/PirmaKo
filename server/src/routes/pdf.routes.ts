/**
 * pdf.routes.ts — REST API routes for PDF management.
 *
 * Endpoints:
 *   GET    /api/pdfs              — List all PDFs (sorted by query param)
 *   POST   /api/pdfs              — Upload a new PDF
 *   DELETE /api/pdfs/:id          — Delete a PDF by ID
 *   GET    /api/pdfs/:id/download — Download the actual PDF file
 *   PATCH  /api/pdfs/:id/status   — Update a PDF's status
 *
 * All responses are JSON. File uploads use multipart/form-data.
 */

import { Elysia } from "elysia";
import db from "../db/database";

// Helper: generate a unique filename to avoid collisions on disk.
function generateFilename(original: string): string {
  const timestamp = Date.now();
  // Keep the original extension but add a timestamp prefix.
  const ext = original.split(".").pop() || "pdf";
  return `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

// Helper: extract a human-readable title from a filename.
// "My Document.pdf" → "My Document"
function extractTitle(filename: string): string {
  return filename.replace(/\.pdf$/i, "").trim() || "Untitled";
}

export const pdfRoutes = new Elysia({ prefix: "/api/pdfs" })

  // ── LIST all PDFs ─────────────────────────────────────────────
  // Query params:
  //   sort = "newest" (default) | "oldest" | "alpha"
  .get("/", ({ query }) => {
    const sort = (query as Record<string, string>).sort || "newest";

    let orderBy: string;
    switch (sort) {
      case "oldest":
        orderBy = "uploaded_at ASC";
        break;
      case "alpha":
        orderBy = "title ASC";
        break;
      default:
        orderBy = "uploaded_at DESC";
    }

    // Fetch all rows from the pdfs table, ordered by the chosen sort.
    const stmt = db.prepare(`SELECT * FROM pdfs ORDER BY ${orderBy}`);
    const pdfs = stmt.all();
    return { pdfs };
  })

  // ── UPLOAD a new PDF ──────────────────────────────────────────
  // Expects multipart/form-data with a "file" field.
  .post("/", async ({ body }) => {
    // Cast body to access the file field.
    const formData = body as Record<string, any>;
    const file = formData.file as File | undefined;

    if (!file) {
      return { error: "No file provided" };
    }

    // Save the file to disk.
    const uniqueName = generateFilename(file.name);
    const filePath = `./uploads/${uniqueName}`;

    // Write the file bytes to disk using Bun's file API.
    await Bun.write(filePath, file);

    // Insert metadata into SQLite.
    const title = extractTitle(file.name);
    const uploadedAt = new Date().toISOString();
    const status = "Pending"; // All new uploads start as Pending

    const stmt = db.prepare(
      `INSERT INTO pdfs (title, filename, status, uploaded_at) VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(title, uniqueName, status, uploadedAt);

    // Return the newly created PDF record.
    return {
      id: result.lastInsertRowid,
      title,
      filename: uniqueName,
      status,
      uploaded_at: uploadedAt,
    };
  })

  // ── DELETE a PDF ──────────────────────────────────────────────
  .delete("/:id", ({ params }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);

    // Look up the PDF first so we can delete the file from disk too.
    const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
    const pdf = findStmt.get(pdfId) as any;

    if (!pdf) {
      return { error: "PDF not found" };
    }

    // Delete from database.
    const delStmt = db.prepare("DELETE FROM pdfs WHERE id = ?");
    delStmt.run(pdfId);

    // Also try to delete the file from disk (ignore errors if missing).
    const fs = require("fs");
    try {
      fs.unlinkSync(`./uploads/${pdf.filename}`);
    } catch {
      // File might already be gone — that's fine.
    }

    return { success: true };
  })

  // ── DOWNLOAD a PDF file ───────────────────────────────────────
  .get("/:id/download", ({ params }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);

    const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
    const pdf = findStmt.get(pdfId) as any;

    if (!pdf) {
      return new Response("Not found", { status: 404 });
    }

    // Read the file from disk and return it as a binary response.
    const file = Bun.file(`./uploads/${pdf.filename}`);
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.title}.pdf"`,
      },
    });
  })

  // ── UPDATE PDF status ─────────────────────────────────────────
  .patch("/:id/status", ({ params, body }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);
    const { status } = body as { status: string };

    // Validate the status value.
    const allowed = ["Pending", "Signed", "Failed"];
    if (!allowed.includes(status)) {
      return { error: `Invalid status. Must be one of: ${allowed.join(", ")}` };
    }

    const updateStmt = db.prepare("UPDATE pdfs SET status = ? WHERE id = ?");
    const result = updateStmt.run(status, pdfId);

    if (result.changes === 0) {
      return { error: "PDF not found" };
    }

    // If status is "Signed", delete the file — per requirements.
    // "Signed PDF status removes PDF from display" + "deletes PDF from SQLite"
    if (status === "Signed") {
      const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
      const pdf = findStmt.get(pdfId) as any;
      if (pdf) {
        const fs = require("fs");
        try {
          fs.unlinkSync(`./uploads/${pdf.filename}`);
        } catch {
          // Ignore
        }
      }
      const delStmt = db.prepare("DELETE FROM pdfs WHERE id = ?");
      delStmt.run(pdfId);
    }

    return { success: true, status };
  });
