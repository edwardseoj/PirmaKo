import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { pdfRoutes } from "./routes/pdf.routes";
import { mkdirSync } from "fs";
import { join } from "path";

const isProduction = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;

mkdirSync("./uploads", { recursive: true });

const distPath = isProduction
  ? join(import.meta.dir, "../../client/dist")
  : null;

const app = new Elysia()

  .use(cors({
    origin: isProduction
      ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`]
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }))

  .use(authRoutes)

  .use(pdfRoutes)

  .get("/api/health", () => ({ status: "ok" }));

if (isProduction && distPath) {
  app.get("/*", async ({ request }) => {
    try {
      const urlPath = new URL(request.url).pathname;

      const filePath = join(distPath, urlPath);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return file;
      }

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
