# PirmaKo

E-Signing Application for Blocklabs' technical interview for Software Developer Intern Application

## Installation

1. Install bun (if not installed):
   <br>

   `curl -fsSL https://bun.sh/install | bash`

<br>

2. Install all dependencies:
   <br>
   `cd client && bun install`
   <br>
   `cd server && bun install`

## How to Run

`bun run dev`
<br>

**Live URL:** https://pirmako.up.railway.app

## Deploy to Railway

The project includes a multi-stage Dockerfile for full-stack deployment:

1. Install the Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link/create a project: `railway init`
4. Deploy: `railway up`

Or connect the GitHub repo to Railway for automatic deploys. No environment variables are required — `JWT_SECRET` and `PORT` are handled automatically.

---

# Default accounts

> Multiple requester accounts can be created   
> Only 1 signer account is recommended

- **Requester**
  - Email: requester@gmail.com
  - Password: iamrequester
- **Signer**
  - Email: signer@gmail.com
  - Password: iamsigner

---

# Features

- Authentication
- PDF requester side:
  - Upload
  - Download
  - Delete
  - Status
- PDF singer side:
  - Sign
  - Status
- Sort PDF by filter
- Upload e-signature
- Drag and drop signature
- Preview PDF before applying changes

---

# Unit testing

> Compatible with Github Actions

## CLI

### Quick Start

```bash
# Navigate to the Testing directory
cd Testing

# Install dependencies
bun install

# Run all tests (frontend + backend)
bun run test
```

---

### Running Tests Individually

#### Frontend Tests (Vitest)

```bash
# Run all frontend tests once
bun run test:frontend

# Run frontend tests in watch mode (re-runs on file changes)
bun run test:frontend:watch

# Run a specific test file
bunx vitest run frontend/lib/utils.test.ts
```

#### Backend Tests (bun test)

```bash
# Run all backend tests
bun run test:backend

# Run a specific backend test file
bun test backend/routes/auth.routes.test.ts
```
