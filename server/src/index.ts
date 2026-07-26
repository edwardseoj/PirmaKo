/**
 * index.ts — PirmaKo Backend Entry Point
 *
 * Sets up the Elysia HTTP server with CORS, authentication, and all API routes.
 * In production, also serves the built client (client/dist) as static files.
 * Server runs on PORT env var or 3000 by default.
 */

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { pdfRoutes } from "./routes/pdf.routes";
import { mkdirSync } from "fs";
import { join } from "path";

const isProduction = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;

// Ensure the uploads directory exists (for PDF storage)
mkdirSync("./uploads", { recursive: true });

// In production the client is pre-built at client/dist relative to the project root.
// import.meta.dir is server/src/, so ../../client/dist resolves to the correct path.
const distPath = isProduction
  ? join(import.meta.dir, "../../client/dist")
  : null;

const app = new Elysia()
  // CORS: in production the client is served from the same origin, so the browser
  // won't send cross-origin requests. We still allow the Railway domain just in case.
  .use(cors({
    origin: isProduction
      ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`]
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }))

  // Mount authentication routes (register, login, me)
  .use(authRoutes)

  // Mount all PDF-related routes under /api/pdfs
  .use(pdfRoutes)

  // Health check endpoint — useful for monitoring if the server is alive.
  .get("/api/health", () => ({ status: "ok" }));

// In production, serve the built client as static files with SPA fallback.
// This catch-all is registered after all /api routes so API paths match first.
if (isProduction && distPath) {
  app.get("/*", async ({ request }) => {
    try {
      const urlPath = new URL(request.url).pathname;

      // Try to serve the exact file from the dist directory
      const filePath = join(distPath, urlPath);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return file;
      }

      // SPA fallback — serve index.html for any unmatched route
      return Bun.file(join(distPath, "index.html"));
    } catch {
      return Bun.file(join(distPath, "index.html"));
    }
  });
}

app.listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
