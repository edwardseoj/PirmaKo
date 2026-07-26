/**
 * pdf.routes.ts — REST API routes for PDF management.
 *
 * Endpoints:
 *   GET    /api/pdfs              — List all PDFs (sorted by query param)
 *   POST   /api/pdfs              — Upload a new PDF
 *   DELETE /api/pdfs/:id          — Delete a PDF by ID
 *   GET    /api/pdfs/:id/download — Download the actual PDF file
 *   PATCH  /api/pdfs/:id/status   — Update a PDF's status
 *   POST   /api/pdfs/:id/sign     — Sign a PDF with an e-signature image
 *
 * All responses are JSON. File uploads use multipart/form-data.
 */

import { Elysia } from "elysia";
import { PDFDocument } from "pdf-lib";
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
  //   requester_email = filter PDFs by uploader's email (used by requesters to see only their own)
  //   all = "true" to return all PDFs (used by signers who see everyone's uploads)
  .get("/", ({ query }) => {
    const sort = (query as Record<string, string>).sort || "newest";
    const requesterEmail = (query as Record<string, string>).requester_email;
    const showAll = (query as Record<string, string>).all === "true";

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

    // If requester_email is provided and not showing all, filter by uploader.
    // This ensures each requester only sees their own uploaded PDFs.
    let stmt;
    if (requesterEmail && !showAll) {
      stmt = db.prepare(`SELECT * FROM pdfs WHERE requester_email = ? ORDER BY ${orderBy}`);
      const pdfs = stmt.all(requesterEmail);
      return { pdfs };
    }

    // Fetch all rows from the pdfs table, ordered by the chosen sort.
    stmt = db.prepare(`SELECT * FROM pdfs ORDER BY ${orderBy}`);
    const pdfs = stmt.all();
    return { pdfs };
  })

  // ── UPLOAD a new PDF ──────────────────────────────────────────
  // Expects multipart/form-data with a "file" field and optional "requester_email".
  .post("/", async ({ body }) => {
    // Cast body to access the file field.
    const formData = body as Record<string, any>;
    const file = formData.file as File | undefined;
    // Requester email is sent from the frontend to link the PDF to the uploader
    const requesterEmail = formData.requester_email as string | undefined;

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
      `INSERT INTO pdfs (title, filename, status, uploaded_at, requester_email) VALUES (?, ?, ?, ?, ?)`
    );
    const result = stmt.run(title, uniqueName, status, uploadedAt, requesterEmail || null);

    // Return the newly created PDF record.
    return {
      id: result.lastInsertRowid,
      title,
      filename: uniqueName,
      status,
      uploaded_at: uploadedAt,
      requester_email: requesterEmail || null,
    };
  })

  // ── DELETE a PDF ──────────────────────────────────────────────
  .delete("/:id", async ({ params }) => {
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
    // Using Bun.file().unlink() instead of Node's fs.unlinkSync for consistency.
    try {
      const file = Bun.file(`./uploads/${pdf.filename}`);
      await file.unlink();
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
    // "inline" tells the browser to display the PDF (e.g. in an iframe)
    // instead of triggering a download dialog.
    const file = Bun.file(`./uploads/${pdf.filename}`);
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdf.title}.pdf"`,
      },
    });
  })

  // ── GET PDF info (page dimensions) ──────────────────────────
  // Returns the first page's width and height in PDF points.
  // The frontend uses these to calculate correct signature positions
  // because the iframe's display dimensions don't match the actual
  // PDF page dimensions (aspect ratio mismatch causes offset/scale).
  .get("/:id/info", async ({ params }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);

    const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
    const pdf = findStmt.get(pdfId) as any;

    if (!pdf) {
      return { error: "PDF not found" };
    }

    try {
      const pdfPath = `./uploads/${pdf.filename}`;
      const pdfBytes = await Bun.file(pdfPath).arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      return {
        id: pdfId,
        title: pdf.title,
        width,   // PDF page width in points (e.g., 612 for US Letter)
        height,  // PDF page height in points (e.g., 792 for US Letter)
        pages: pages.length,
      };
    } catch (err) {
      console.error("Failed to read PDF info:", err);
      return { error: "Failed to read PDF" };
    }
  })

  // ── PREVIEW a signed PDF (without saving) ─────────────────────
  // Same as /sign but returns the combined PDF as a binary response
  // instead of saving to disk. Used for debugging signature placement.
  // Does NOT update the database or overwrite the original file.
  .post("/:id/preview", async ({ params, body }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);

    const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
    const pdf = findStmt.get(pdfId) as any;

    if (!pdf) {
      return { error: "PDF not found" };
    }

    const formData = body as Record<string, any>;
    const signatureFile = formData.signature as File | undefined;
    const posX = Number(formData.posX) || 0;
    const posY = Number(formData.posY) || 0;

    if (!signatureFile) {
      return { error: "No signature image provided" };
    }

    try {
      // Load the original PDF (read-only, does not touch the file on disk)
      const pdfPath = `./uploads/${pdf.filename}`;
      const pdfBytes = await Bun.file(pdfPath).arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Embed the signature image into the PDF document
      const sigBytes = await signatureFile.arrayBuffer();
      let sigImage;
      const mimeType = signatureFile.type || "";
      if (mimeType.includes("png")) {
        sigImage = await pdfDoc.embedPng(sigBytes);
      } else {
        sigImage = await pdfDoc.embedJpg(sigBytes);
      }

      // Place the signature on the first page at the given coordinates
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      // Scale the signature to max 150px wide, proportional height
      const maxWidth = 150;
      const ratio = maxWidth / sigImage.width;
      const sigWidth = sigImage.width * ratio;
      const sigHeight = sigImage.height * ratio;

      // Convert top-down Y to PDF bottom-up Y and clamp within page
      const x = Math.max(0, Math.min(posX, pageWidth - sigWidth));
      const y = Math.max(0, Math.min(pageHeight - posY - sigHeight, pageHeight - sigHeight));

      firstPage.drawImage(sigImage, {
        x,
        y,
        width: sigWidth,
        height: sigHeight,
        opacity: 0.9,
      });

      // Return the combined PDF as a binary response (do NOT save to disk)
      const previewBytes = await pdfDoc.save();
      return new Response(previewBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="preview-${pdf.title}.pdf"`,
        },
      });
    } catch (err) {
      console.error("PDF preview failed:", err);
      return { error: "Failed to generate preview" };
    }
  })

  // ── SIGN a PDF with an e-signature image ─────────────────────
  // Accepts multipart form data:
  //   - signature: the signature image file (PNG/JPEG)
  //   - posX: horizontal position in PDF points from left edge
  //   - posY: vertical position in PDF points from top edge
  // Combines the PDF with the signature image, saves the signed PDF,
  // and updates the status to "Signed" in SQLite.
  .post("/:id/sign", async ({ params, body }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);

    // Find the PDF in the database
    const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
    const pdf = findStmt.get(pdfId) as any;

    if (!pdf) {
      return { error: "PDF not found" };
    }

    // Cast body to access form fields
    const formData = body as Record<string, any>;
    const signatureFile = formData.signature as File | undefined;
    // posX/posY are now in PDF points (not percentages)
    // The frontend calculates these using actual PDF page dimensions
    const posX = Number(formData.posX) || 0;
    const posY = Number(formData.posY) || 0;

    if (!signatureFile) {
      return { error: "No signature image provided" };
    }

    try {
      // Read the existing PDF from disk
      const pdfPath = `./uploads/${pdf.filename}`;
      const pdfBytes = await Bun.file(pdfPath).arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Read the signature image and embed it into the PDF
      const sigBytes = await signatureFile.arrayBuffer();
      let sigImage;

      // Detect image type from the file's MIME type or extension
      const mimeType = signatureFile.type || "";
      if (mimeType.includes("png")) {
        sigImage = await pdfDoc.embedPng(sigBytes);
      } else {
        // Default to JPEG for everything else
        sigImage = await pdfDoc.embedJpg(sigBytes);
      }

      // Get the first page to place the signature on
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      // Scale the signature to a reasonable size (max 150px wide, proportional height)
      const maxWidth = 150;
      const ratio = maxWidth / sigImage.width;
      const sigWidth = sigImage.width * ratio;
      const sigHeight = sigImage.height * ratio;

      // posX and posY are in PDF points (0,0 = top-left of page)
      // PDF coordinates start from bottom-left, so we invert Y:
      // frontend's posY (from top) → backend's y (from bottom)
      // Clamp to keep signature within page bounds
      const x = Math.max(0, Math.min(posX, pageWidth - sigWidth));
      const y = Math.max(0, Math.min(pageHeight - posY - sigHeight, pageHeight - sigHeight));

      // Draw the signature image onto the page
      firstPage.drawImage(sigImage, {
        x,
        y,
        width: sigWidth,
        height: sigHeight,
        opacity: 0.9,
      });

      // Save the modified PDF (overwrite the original file)
      const signedPdfBytes = await pdfDoc.save();
      await Bun.write(pdfPath, signedPdfBytes);

      // Update status to "Signed" in SQLite
      const updateStmt = db.prepare(
        "UPDATE pdfs SET status = 'Signed' WHERE id = ?"
      );
      updateStmt.run(pdfId);

      return { success: true, status: "Signed" };
    } catch (err) {
      console.error("PDF signing failed:", err);
      return { error: "Failed to sign PDF" };
    }
  })

  // ── UPDATE PDF status ─────────────────────────────────────────
  // Simple status update — used by the requester to mark PDFs.
  // Does NOT delete the PDF when status is "Signed"; the sign
  // endpoint handles the actual signing workflow.
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

    return { success: true, status };
  });
