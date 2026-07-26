import { describe, it, expect, beforeAll, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { Database } from "bun:sqlite";

import { createTestDb, seedUser } from "../helpers";

let testDb: Database;

function buildTestApp(db: Database) {
  const JWT_SECRET = "test-secret-key";

  const app = new Elysia()
    .use(
      jwt({
        name: "jwt",
        secret: JWT_SECRET,
        cookie: "pirmako_auth",
      })
    )

    .post("/api/auth/register", async ({ body, jwt }: any) => {
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

      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return { error: "An account with this email already exists" };
      }

      const hashedPassword = await Bun.password.hash(password);
      const stmt = db.prepare(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)"
      );
      const result = stmt.run(email, hashedPassword, role);

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

    .post("/api/auth/login", async ({ body, jwt }: any) => {
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

    .get("/api/auth/me", async ({ jwt, request }: any) => {
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
    })

    .get("/api/auth/logout", () => {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "pirmako_auth=; Path=/; Max-Age=0; SameSite=Lax",
        },
      });
    });

  return app;
}

let app: ReturnType<typeof buildTestApp>;

beforeAll(() => {
  testDb = createTestDb();
  app = buildTestApp(testDb);
});

beforeEach(() => {

  testDb.exec("DELETE FROM users");
  testDb.exec("DELETE FROM pdfs");
});

describe("POST /api/auth/register", () => {
  it("registers a new user successfully", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "new@test.com",
          password: "password123",
          role: "requester",
        }),
      })
    );
    const data = await res.json();

    expect(data.token).toBeString();
    expect(data.user.email).toBe("new@test.com");
    expect(data.user.role).toBe("requester");
    expect(data.user.id).toBeNumber();
  });

  it("returns error for missing fields", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Email, password, and role are required");
  });

  it("returns error for invalid role", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@test.com",
          password: "password123",
          role: "admin",
        }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Role must be 'requester' or 'signer'");
  });

  it("returns error for invalid email", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "bad",
          password: "password123",
          role: "requester",
        }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Invalid email address");
  });

  it("returns error for short password", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@test.com",
          password: "123",
          role: "requester",
        }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Password must be at least 6 characters");
  });

  it("returns error for duplicate email", async () => {
    await seedUser(testDb, "existing@test.com", "password123", "requester");

    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "existing@test.com",
          password: "password123",
          role: "signer",
        }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("An account with this email already exists");
  });

  it("registers a signer role successfully", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "signer@test.com",
          password: "password123",
          role: "signer",
        }),
      })
    );
    const data = await res.json();

    expect(data.user.role).toBe("signer");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials", async () => {
    await seedUser(testDb, "user@test.com", "password123", "requester");

    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@test.com",
          password: "password123",
        }),
      })
    );
    const data = await res.json();

    expect(data.token).toBeString();
    expect(data.user.email).toBe("user@test.com");
    expect(data.user.role).toBe("requester");
  });

  it("returns error for missing fields", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Email and password are required");
  });

  it("returns error for non-existent email", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nobody@test.com",
          password: "password123",
        }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Invalid email or password");
  });

  it("returns error for wrong password", async () => {
    await seedUser(testDb, "user@test.com", "password123", "requester");

    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@test.com",
          password: "wrongpassword",
        }),
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Invalid email or password");
  });
});

describe("GET /api/auth/me", () => {
  it("returns user with valid token", async () => {
    await seedUser(testDb, "user@test.com", "password123", "signer");

    const loginRes = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@test.com",
          password: "password123",
        }),
      })
    );
    const { token } = await loginRes.json();

    const res = await app.handle(
      new Request("http://localhost/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const data = await res.json();

    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("user@test.com");
    expect(data.user.role).toBe("signer");
  });

  it("returns error without Authorization header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/me")
    );
    const data = await res.json();

    expect(data.error).toBe("Not authenticated");
  });

  it("returns error with invalid token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/me", {
        headers: { Authorization: "Bearer invalid-token-here" },
      })
    );
    const data = await res.json();

    expect(data.error).toBeDefined();
    expect(data.user).toBeUndefined();
  });

  it("returns error with malformed Authorization header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/me", {
        headers: { Authorization: "Basic somevalue" },
      })
    );
    const data = await res.json();

    expect(data.error).toBe("Not authenticated");
  });
});

describe("GET /api/auth/logout", () => {
  it("returns success and clears cookie", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/logout")
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(res.headers.get("Set-Cookie")).toContain("pirmako_auth=;");
  });
});
