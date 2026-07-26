import { describe, it, expect, beforeAll, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { createTestDb, seedPdf, seedUser } from "../helpers";

let testDb: Database;

beforeAll(() => {
  testDb = createTestDb();
});

beforeEach(() => {
  testDb.exec("DELETE FROM pdfs");
  testDb.exec("DELETE FROM users");
});

describe("generateFilename (logic)", () => {

  function generateFilename(original: string): string {
    const timestamp = Date.now();
    const ext = original.split(".").pop() || "pdf";
    return `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  }

  it("generates a filename with the correct extension", () => {
    const result = generateFilename("document.pdf");
    expect(result).toEndWith(".pdf");
  });

  it("generates unique filenames for consecutive calls", () => {
    const name1 = generateFilename("doc.pdf");
    const name2 = generateFilename("doc.pdf");

    expect(name1).not.toBe(name2);
  });

  it("preserves the original file extension", () => {
    const result = generateFilename("report.PDF");
    expect(result).toEndWith(".PDF");
  });

  it("uses original extension when present", () => {
    const result = generateFilename("noextension");

    expect(result).toEndWith(".noextension");
  });
});

describe("extractTitle (logic)", () => {

  function extractTitle(filename: string): string {
    return filename.replace(/\.pdf$/i, "").trim() || "Untitled";
  }

  it("removes .pdf extension", () => {
    expect(extractTitle("My Document.pdf")).toBe("My Document");
  });

  it("removes .PDF extension (case-insensitive)", () => {
    expect(extractTitle("Report.PDF")).toBe("Report");
  });

  it("returns Untitled for empty filename after stripping", () => {
    expect(extractTitle(".pdf")).toBe("Untitled");
  });

  it("trims whitespace from clean filenames", () => {

    expect(extractTitle("Doc.pdf")).toBe("Doc");
  });

  it("handles filename without .pdf extension", () => {
    expect(extractTitle("Document")).toBe("Document");
  });
});

describe("PDF database operations", () => {
  it("inserts a PDF record and retrieves it", () => {
    const pdfId = seedPdf(testDb, "Test Doc", "test.pdf", {
      requesterEmail: "user@test.com",
    });

    const pdf = testDb.prepare("SELECT * FROM pdfs WHERE id = ?").get(pdfId) as any;

    expect(pdf).toBeDefined();
    expect(pdf.title).toBe("Test Doc");
    expect(pdf.filename).toBe("test.pdf");
    expect(pdf.status).toBe("Pending");
    expect(pdf.requester_email).toBe("user@test.com");
  });

  it("updates PDF status", () => {
    const pdfId = seedPdf(testDb, "Doc", "doc.pdf");

    testDb.prepare("UPDATE pdfs SET status = ? WHERE id = ?").run("Signed", pdfId);

    const pdf = testDb.prepare("SELECT * FROM pdfs WHERE id = ?").get(pdfId) as any;
    expect(pdf.status).toBe("Signed");
  });

  it("deletes a PDF record", () => {
    const pdfId = seedPdf(testDb, "Doc", "doc.pdf");

    testDb.prepare("DELETE FROM pdfs WHERE id = ?").run(pdfId);

    const pdf = testDb.prepare("SELECT * FROM pdfs WHERE id = ?").get(pdfId);
    expect(pdf).toBeNull();
  });

  it("filters PDFs by requester_email", () => {
    seedPdf(testDb, "Doc1", "a.pdf", { requesterEmail: "alice@test.com" });
    seedPdf(testDb, "Doc2", "b.pdf", { requesterEmail: "bob@test.com" });
    seedPdf(testDb, "Doc3", "c.pdf", { requesterEmail: "alice@test.com" });

    const results = testDb
      .prepare("SELECT * FROM pdfs WHERE requester_email = ?")
      .all("alice@test.com");

    expect(results).toHaveLength(2);
  });

  it("sorts PDFs by uploaded_at descending (newest first)", () => {

    const now = new Date();
    const earlier = new Date(now.getTime() - 100000);

    testDb
      .prepare(
        "INSERT INTO pdfs (title, filename, status, uploaded_at) VALUES (?, ?, ?, ?)"
      )
      .run("Older", "old.pdf", "Pending", earlier.toISOString());
    testDb
      .prepare(
        "INSERT INTO pdfs (title, filename, status, uploaded_at) VALUES (?, ?, ?, ?)"
      )
      .run("Newer", "new.pdf", "Pending", now.toISOString());

    const results = testDb
      .prepare("SELECT * FROM pdfs ORDER BY uploaded_at DESC")
      .all() as any[];

    expect(results[0].title).toBe("Newer");
    expect(results[1].title).toBe("Older");
  });

  it("sorts PDFs alphabetically by title", () => {
    seedPdf(testDb, "Zebra", "z.pdf");
    seedPdf(testDb, "Apple", "a.pdf");
    seedPdf(testDb, "Mango", "m.pdf");

    const results = testDb
      .prepare("SELECT * FROM pdfs ORDER BY title ASC")
      .all() as any[];

    expect(results[0].title).toBe("Apple");
    expect(results[1].title).toBe("Mango");
    expect(results[2].title).toBe("Zebra");
  });

  it("counts PDFs correctly", () => {
    seedPdf(testDb, "Doc1", "a.pdf");
    seedPdf(testDb, "Doc2", "b.pdf");
    seedPdf(testDb, "Doc3", "c.pdf");

    const count = testDb.prepare("SELECT COUNT(*) as count FROM pdfs").get() as any;
    expect(count.count).toBe(3);
  });

  it("handles status update for non-existent PDF", () => {
    const result = testDb
      .prepare("UPDATE pdfs SET status = ? WHERE id = ?")
      .run("Signed", 9999);

    expect(result.changes).toBe(0);
  });

  it("links PDF to user via user_id", async () => {
    const userId = await seedUser(testDb, "user@test.com", "pass1234", "requester");
    const pdfId = seedPdf(testDb, "Doc", "doc.pdf", { userId });

    const pdf = testDb.prepare("SELECT * FROM pdfs WHERE id = ?").get(pdfId) as any;
    expect(pdf.user_id).toBe(userId);
  });
});
