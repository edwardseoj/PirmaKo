# PirmaKo

E-Signing Application for Blocklabs' technical interview for Software Developer Intern Application

## Installation

1. Install bun (if not installed):

   **Unix (macOS/Linux):**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

   **Windows (PowerShell):**
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

2. Install all dependencies:
    **Unix (macOS/Linux):**
     ```bash
     bun install
     cd client && bun install
     cd server && bun install
     ```
  
    **Windows (PowerShell):**
    ```bash
     bun install
     cd client; bun install
  
  
     cd server; bun install
     ```

    > restart terminal after ```bun install```

## How to Run

**Locally**

```bash
bun run dev
```

> Client runs on `http://localhost:5173` (Vite) and server on `http://localhost:3000` (Elysia).

**Live URL:** https://pirmako-production.up.railway.app/

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
- PDF signer side:
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
