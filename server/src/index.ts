/**
 * index.ts — PirmaKo Backend Entry Point
 *
 * Sets up the Elysia HTTP server with CORS, authentication, and all API routes.
 * Server runs on port 3000 by default.
 */

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { pdfRoutes } from "./routes/pdf.routes";

const app = new Elysia()
  // Enable Cross-Origin Resource Sharing so the Vite dev server (port 5173)
  // can talk to this API server (port 3000) without being blocked.
  // credentials: true allows cookies to be sent cross-origin.
  .use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }))

  // Mount authentication routes (register, login, me)
  .use(authRoutes)

  // Mount all PDF-related routes under /api/pdfs
  .use(pdfRoutes)

  // Health check endpoint — useful for monitoring if the server is alive.
  .get("/api/health", () => ({ status: "ok" }))

  // Start listening on port 3000.
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
