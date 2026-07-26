/**
 * auth.routes.ts — Authentication API routes.
 *
 * Endpoints:
 *   POST /api/auth/register — Create a new user account
 *   POST /api/auth/login    — Authenticate and return a JWT
 *   GET  /api/auth/me       — Get the current authenticated user (requires Bearer token)
 *
 * Uses Bun.password for bcrypt hashing (zero extra deps).
 * Uses @elysiajs/jwt for token generation and verification.
 */

import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import db from "../db/database";

// JWT secret — in production, use an env variable.
const JWT_SECRET = process.env.JWT_SECRET || "pirmako-dev-secret-change-in-prod";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    })
  )

  // ── REGISTER ───────────────────────────────────────────────────
  .post("/register", async ({ body, jwt }) => {
    const { email, password, role } = body as {
      email: string;
      password: string;
      role: string;
    };

    if (!email || !password || !role) {
      return { error: "Email, password, and role are required" };
    }

    if (role !== "requester" && role !== "signer") {
      return { error: "Role must be 'requester' or 'signer'" };
    }

    if (!email.includes("@") || email.length < 3) {
      return { error: "Invalid email address" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    // Check if email is already taken
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return { error: "An account with this email already exists" };
    }

    // Hash password with Bun's built-in bcrypt
    const hashedPassword = await Bun.password.hash(password);

    const stmt = db.prepare(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)"
    );
    const result = stmt.run(email, hashedPassword, role);

    // Generate JWT — includes id, email, role
    const token = await jwt.sign({
      id: result.lastInsertRowid,
      email,
      role,
    });

    return {
      token,
      user: { id: result.lastInsertRowid, email, role },
    };
  })

  // ── LOGIN ──────────────────────────────────────────────────────
  .post("/login", async ({ body, jwt }) => {
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return { error: "Invalid email or password" };
    }

    const valid = await Bun.password.verify(password, user.password);
    if (!valid) {
      return { error: "Invalid email or password" };
    }

    const token = await jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  })

  // ── GET CURRENT USER ───────────────────────────────────────────
  // Requires: Authorization: Bearer <token>
  .get("/me", async ({ jwt, request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: "Not authenticated" };
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = await jwt.verify(token);
    } catch {
      return { error: "Invalid or expired token" };
    }

    const user = db.prepare(
      "SELECT id, email, role, created_at FROM users WHERE id = ?"
    ).get((payload as any).id) as any;

    if (!user) {
      return { error: "User not found" };
    }

    return { user };
  });
