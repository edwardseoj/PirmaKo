# E-Signature Application — Instructions

## Prerequisites

- [Bun](https://bun.sh) (v1.0+) installed on your machine

## Project Structure

```
E-Signature application/
├── client/          # Vite + React + TypeScript + ESLint (frontend)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── server/          # ElysiaJS (backend)
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── ...
├── package.json     # Root workspace with shared scripts
└── Instructions.md  # This file
```

## How to Run

### 1. Install Dependencies

From the project root:

```bash
bun install
cd client && bun install && cd ..
cd server && bun install && cd ..
```

Or if you installed from the root, both `client/` and `server/` dependencies will be handled. If not:

```bash
cd client && bun install
cd ../server && bun install
cd ..
```

### 2. Start Both Frontend and Backend

From the project root:

```bash
bun run dev
```

This uses [concurrently](https://github.com/open-cli-tools/concurrently) to start both:

- **Frontend (Vite):** http://localhost:5173
- **Backend (ElysiaJS):** http://localhost:3000

### 3. Start Individually (optional)

**Backend only:**
```bash
cd server && bun run dev
```

**Frontend only:**
```bash
cd client && bun run dev
```

## How to Verify It's Working

1. Start the project with `bun run dev` from the root.
2. Open your browser and navigate to **http://localhost:5173** — you should see the Vite + React welcome page.
3. In your browser, navigate to **http://localhost:3000/api** — you should see `"Hello from E-Signature API"`.
4. Navigate to **http://localhost:3000/api/health** — you should see `{"status":"ok"}`.
5. The frontend is configured to proxy `/api/*` requests to the backend (see `client/vite.config.ts`), so from the React app you can fetch `/api` or `/api/health` and it will reach the ElysiaJS server automatically.

## Running Lint

```bash
cd client && bun run lint
```

## Tech Stack

| Layer     | Technology              |
|-----------|------------------------|
| Frontend  | Vite, React 19, TypeScript, ESLint |
| Backend   | ElysiaJS, Bun          |
| Dev Tools | concurrently            |
