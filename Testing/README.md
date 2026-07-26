# PirmaKo Unit Tests

Unit tests for the PirmaKo e-signature application, covering both frontend (React) and backend (ElysiaJS).

## Tech Stack

| Layer    | Framework       | Runner         |
|----------|-----------------|----------------|
| Frontend | React 19        | Vitest + jsdom |
| Backend  | ElysiaJS/Bun    | bun test       |

## Quick Start

```bash
# Navigate to the Testing directory
cd Testing

# Install dependencies
bun install

# Run all tests (frontend + backend)
bun test
```

## Running Tests Individually

### Frontend Tests (Vitest)

```bash
# Run all frontend tests once
bun run test:frontend

# Run frontend tests in watch mode (re-runs on file changes)
bun run test:frontend:watch

# Run a specific test file
bunx vitest run frontend/lib/utils.test.ts
```

### Backend Tests (bun test)

```bash
# Run all backend tests
bun run test:backend

# Run a specific backend test file
bun test backend/routes/auth.routes.test.ts
```

## Running Tests in GitHub Actions

Tests run automatically on every **push** and **pull request** to `main` or `master` branches via the workflow at `.github/workflows/test.yml`.

### What the workflow does:
1. Checks out the repository
2. Installs Bun runtime
3. Installs dependencies from `Testing/`
4. Runs frontend unit tests (Vitest)
5. Runs backend unit tests (bun test)

### Viewing test results:
1. Go to the repository on GitHub
2. Click the **Actions** tab
3. Select the **Unit Tests** workflow run
4. Expand the `test` job to see results for both frontend and backend

### Triggering tests manually:
Tests run automatically on push/PR. To trigger manually:
- Go to **Actions** > **Unit Tests** > **Run workflow**

## Test Structure

```
PirmaKo/
├── .github/workflows/test.yml    # GitHub Actions CI config
└── Testing/
    ├── package.json               # Test dependencies
    ├── vitest.config.ts           # Vitest configuration
    ├── tsconfig.json              # TypeScript config for tests
    ├── frontend/
    │   ├── setup.ts               # Test environment setup (jsdom, mocks)
    │   ├── lib/                   # Utility function tests
    │   │   ├── utils.test.ts      # cn() utility tests
    │   │   └── api.test.ts        # apiFetch() tests
    │   ├── contexts/
    │   │   └── AuthContext.test.tsx  # Auth state management tests
    │   ├── hooks/
    │   │   ├── usePdfFiles.test.ts   # PDF CRUD hook tests
    │   │   ├── useSignerPdfs.test.ts # Signer PDF hook tests
    │   │   └── useSignatureDrag.test.ts  # Drag-and-drop hook tests
    │   └── components/
    │       ├── Navbar.test.tsx        # Navigation bar tests
    │       ├── AlertDialog.test.tsx   # Alert dialog tests
    │       ├── ConfirmDialog.test.tsx # Confirmation dialog tests
    │       ├── PopupOverlay.test.tsx  # Modal overlay tests
    │       ├── ActionButtons.test.tsx # Action button tests
    │       ├── SortDropdown.test.tsx  # Sort dropdown tests
    │       ├── Login.test.tsx         # Login form tests
    │       ├── Signup.test.tsx        # Signup form tests
    │       └── Startup.test.tsx       # Startup screen tests
    └── backend/
        ├── helpers.ts              # Test database & seed utilities
        └── routes/
            ├── auth.routes.test.ts # Auth API endpoint tests
            └── pdf.routes.test.ts  # PDF CRUD operation tests
```

## Test Coverage Summary

### Frontend (126 tests)
- **Utilities**: cn() class merging, apiFetch() with auth headers
- **Auth**: Login/signup flows, token verification, logout, role-based routing
- **Hooks**: PDF fetching, upload, delete, status updates, sorting, signature drag-and-drop
- **Components**: Navbar, AlertDialog, ConfirmDialog, SortDropdown, ActionButtons, PopupOverlay, Startup, UserTypeCard

### Backend (34 tests)
- **Auth Routes**: Register (validation, duplicates, success), Login (credentials, validation), Me (token verification), Logout
- **PDF Operations**: CRUD operations, sorting, filtering, status updates, filename generation, title extraction

## Notes

- Tests use **in-memory SQLite** for backend isolation (no production DB needed)
- Frontend tests mock `fetch` and `localStorage` for deterministic results
- No existing source files were modified — all tests live in the `Testing/` directory
