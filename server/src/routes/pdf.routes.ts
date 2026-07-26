import { Elysia } from "elysia";
import { PDFDocument } from "pdf-lib";
import db from "../db/database";

function generateFilename(original: string): string {
  const timestamp = Date.now();

  const ext = original.split(".").pop() || "pdf";
  return `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function extractTitle(filename: string): string {
  return filename.replace(/\.pdf$/i, "").trim() || "Untitled";
}

export const pdfRoutes = new Elysia({ prefix: "/api/pdfs" })

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

    let stmt;
    if (requesterEmail && !showAll) {
      stmt = db.prepare(`SELECT * FROM pdfs WHERE requester_email = ? ORDER BY ${orderBy}`);
      const pdfs = stmt.all(requesterEmail);
      return { pdfs };
    }

    stmt = db.prepare(`SELECT * FROM pdfs ORDER BY ${orderBy}`);
    const pdfs = stmt.all();
    return { pdfs };
  })

  .post("/", async ({ body }) => {

    const formData = body as Record<string, any>;
    const file = formData.file as File | undefined;

    const requesterEmail = formData.requester_email as string | undefined;

    if (!file) {
      return { error: "No file provided" };
    }

    const uniqueName = generateFilename(file.name);
    const filePath = `./uploads/${uniqueName}`;

    await Bun.write(filePath, file);

    const title = extractTitle(file.name);
    const uploadedAt = new Date().toISOString();
    const status = "Pending";

    const stmt = db.prepare(
      `INSERT INTO pdfs (title, filename, status, uploaded_at, requester_email) VALUES (?, ?, ?, ?, ?)`
    );
    const result = stmt.run(title, uniqueName, status, uploadedAt, requesterEmail || null);

    return {
      id: result.lastInsertRowid,
      title,
      filename: uniqueName,
      status,
      uploaded_at: uploadedAt,
      requester_email: requesterEmail || null,
    };
  })

  .delete("/:id", async ({ params }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);

    const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
    const pdf = findStmt.get(pdfId) as any;

    if (!pdf) {
      return { error: "PDF not found" };
    }

    const delStmt = db.prepare("DELETE FROM pdfs WHERE id = ?");
    delStmt.run(pdfId);

    try {
      const file = Bun.file(`./uploads/${pdf.filename}`);
      await file.unlink();
    } catch {

    }

    return { success: true };
  })

  .get("/:id/download", ({ params }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);

    const findStmt = db.prepare("SELECT * FROM pdfs WHERE id = ?");
    const pdf = findStmt.get(pdfId) as any;

    if (!pdf) {
      return new Response("Not found", { status: 404 });
    }

    const file = Bun.file(`./uploads/${pdf.filename}`);
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdf.title}.pdf"`,
      },
    });
  })

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
        width,

        height,

        pages: pages.length,
      };
    } catch (err) {
      console.error("Failed to read PDF info:", err);
      return { error: "Failed to read PDF" };
    }
  })

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

      const pdfPath = `./uploads/${pdf.filename}`;
      const pdfBytes = await Bun.file(pdfPath).arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const sigBytes = await signatureFile.arrayBuffer();
      let sigImage;
      const mimeType = signatureFile.type || "";
      if (mimeType.includes("png")) {
        sigImage = await pdfDoc.embedPng(sigBytes);
      } else {
        sigImage = await pdfDoc.embedJpg(sigBytes);
      }

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      const maxWidth = 150;
      const ratio = maxWidth / sigImage.width;
      const sigWidth = sigImage.width * ratio;
      const sigHeight = sigImage.height * ratio;

      const x = Math.max(0, Math.min(posX, pageWidth - sigWidth));
      const y = Math.max(0, Math.min(pageHeight - posY - sigHeight, pageHeight - sigHeight));

      firstPage.drawImage(sigImage, {
        x,
        y,
        width: sigWidth,
        height: sigHeight,
        opacity: 0.9,
      });

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

  .post("/:id/sign", async ({ params, body }) => {
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

      const pdfPath = `./uploads/${pdf.filename}`;
      const pdfBytes = await Bun.file(pdfPath).arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const sigBytes = await signatureFile.arrayBuffer();
      let sigImage;

      const mimeType = signatureFile.type || "";
      if (mimeType.includes("png")) {
        sigImage = await pdfDoc.embedPng(sigBytes);
      } else {

        sigImage = await pdfDoc.embedJpg(sigBytes);
      }

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      const maxWidth = 150;
      const ratio = maxWidth / sigImage.width;
      const sigWidth = sigImage.width * ratio;
      const sigHeight = sigImage.height * ratio;

      const x = Math.max(0, Math.min(posX, pageWidth - sigWidth));
      const y = Math.max(0, Math.min(pageHeight - posY - sigHeight, pageHeight - sigHeight));

      firstPage.drawImage(sigImage, {
        x,
        y,
        width: sigWidth,
        height: sigHeight,
        opacity: 0.9,
      });

      const signedPdfBytes = await pdfDoc.save();
      await Bun.write(pdfPath, signedPdfBytes);

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

  .patch("/:id/status", ({ params, body }) => {
    const { id } = params as { id: string };
    const pdfId = Number(id);
    const { status } = body as { status: string };

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
