# Homepage-Signer-Backend: File Changes

## Overview

Backend and database integration for the PirmaKo signer homepage screen.
Connects ElysiaJS and SQLite to the signer's PDF list, viewer, and e-sign editor.

## Bug Fix: PDF Signature Position Mismatch

**Problem:** Drag-and-dropped signatures appeared correct in the editor view but were
positioned incorrectly in the downloaded/signed PDF (signature was "way above" the
expected position).

**Root Cause (attempt 1):** The frontend calculated signature position as a percentage
of the container div's pixel dimensions, but the iframe's PDF content has different
internal dimensions (aspect ratio mismatch between the container and the actual PDF
page).

**Root Cause (the real issue):** The browser's built-in PDF viewer (used in iframes)
renders PDFs with unknown scaling, centering offsets, and optional toolbars. This makes
it impossible to accurately map pixel positions from the UI to PDF coordinates. The
container div dimensions don't match the actual PDF render area inside the iframe.

**Fix:** Replaced the iframe in the editor popup with a canvas-based PDF renderer
using pdf.js (`pdfjs-dist`). This gives us exact control over the rendering:
1. Added `pdfjs-dist` client dependency for canvas-based PDF rendering
2. Created `usePdfRenderer` hook that renders PDF pages to a canvas element
3. The hook reports exact render info (scale factor, X/Y offsets, PDF dimensions)
4. Coordinate mapping is now pixel-perfect: `pdfX = (pixelX - offsetX) / scale`
5. Backend receives direct PDF point coordinates

---

## Modified Files

### `server/src/routes/pdf.routes.ts`
**Location:** `server/src/routes/pdf.routes.ts`

**Changes:**
- Added `pdf-lib` import for PDF manipulation
- Added new `GET /api/pdfs/:id/info` endpoint:
  - Returns the first page's width, height (in PDF points), and page count
  - Used by the frontend to calculate correct signature positions
- Added new `POST /api/pdfs/:id/sign` endpoint:
  - Accepts multipart form data (signature image + posX/posY in PDF points)
  - Reads the PDF from disk using pdf-lib
  - Embeds the signature image at the specified position on the first page
  - Saves the signed PDF back to disk (same filename)
  - Updates status to "Signed" in SQLite
  - **Fixed**: posX/posY now use actual PDF point coordinates instead of container-relative percentages
- Modified `PATCH /api/pdfs/:id/status`:
  - Removed the logic that deletes PDFs when status is "Signed"
  - Now simply updates the status in the database
  - Signed PDFs are preserved for the requester to download later
- Fixed `GET /api/pdfs/:id/download`:
  - Changed `Content-Disposition` from `attachment` to `inline`
  - This allows the PDF to render inside an iframe (viewer/editor popups) instead of triggering a download dialog

### `server/package.json`
**Location:** `server/package.json`

**Changes:**
- Added `pdf-lib` dependency (v1.17.1) for PDF manipulation on the backend

### `client/src/hooks/useSignerPdfs.ts`
**Location:** `client/src/hooks/useSignerPdfs.ts`

**Changes:**
- Complete rewrite: replaced hardcoded sample data with real API calls
- Fetches PDFs from `GET /api/pdfs?sort=...` on mount and when sort changes
- Filters to only show PDFs with "Pending" status (signed PDFs hidden from signer)
- Added `getPdfInfo()` function that fetches PDF page dimensions from `GET /api/pdfs/:id/info`
- `signPdf()` function now sends signature image + PDF point coordinates to `POST /api/pdfs/:id/sign`
  - **Fixed**: posX/posY are now in PDF points (not percentages) for accurate positioning
- Added `loading` state for skeleton UI while data loads
- Added `refresh()` function for manual re-fetching
- Exported `filename` field in `SignerPdfRecord` interface

### `client/src/components/signer-homepage/SignerHomepage.tsx`
**Location:** `client/src/components/signer-homepage/SignerHomepage.tsx`

**Changes:**
- **PdfViewerPopup**: Replaced placeholder icon with real `<iframe>` rendering the actual PDF from the backend
- **PdfEditorPopup**: Replaced iframe with canvas-based PDF renderer (pdf.js)
  - Uses `usePdfRenderer` hook for exact pixel-to-PDF coordinate mapping
  - Added hidden file input for signature upload (accepts PNG/JPEG)
  - Upload button now opens native file picker
  - Signature preview shows uploaded image inside draggable element
  - **Fixed**: Uses canvas render info (scale + offsets) for accurate coordinate conversion
  - Check button sends signature + PDF point coordinates to backend
  - Button layout: [Upload] on left, [Check] [Cancel] on right (all icon-only)
- Added `LoadingSkeleton` component shown while PDFs load from API
- Updated `handleCheckClick` to accept signature file and PDF point coordinates

### `client/src/components/signer-homepage/SignerHomepage.css`
**Location:** `client/src/components/signer-homepage/SignerHomepage.css`

**Changes:**
- Added `.signer-viewer-popup__iframe` — fills the 70% PDF viewer area
- Added `.signer-editor-popup__canvas` — fills the editor page area (canvas-based PDF)
- Added `.signer-editor-popup__signature-img` — styles for uploaded signature image preview
- Added `.signer-editor-popup__file-input` — hidden file input (visually hidden, accessible)
- Added `.signer-skeleton-row*` and `.signer-skeleton-shimmer` — loading skeleton styles with shimmer animation
- Removed old simulated page line styles (`.signer-editor-popup__page-lines`, `.signer-editor-popup__line`)
- Removed `padding: 32px` from `.signer-editor-popup__page` (canvas fills the page)

### `client/index.html`
**Location:** `client/index.html`

**Changes:**
- Fixed page title from "client" to "PirmaKo"

---

## New Files

### `client/src/hooks/usePdfRenderer.ts`
**Location:** `client/src/hooks/usePdfRenderer.ts`

**Purpose:** Custom hook that renders a PDF page to a canvas element using pdf.js.
Provides exact pixel-to-PDF coordinate mapping by reporting the scale factor and
offsets used during rendering. This replaces the iframe approach which had
unpredictable browser-specific rendering behavior.

---

## Dependencies Added

| Package | Location | Version | Purpose |
|---------|----------|---------|---------|
| `pdf-lib` | server | 1.17.1 | PDF manipulation (embedding signature images) |
| `pdfjs-dist` | client | 6.1.200 | Canvas-based PDF rendering for accurate coordinate mapping |

---

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/pdfs` | List all PDFs (sorted) | Existing |
| POST | `/api/pdfs` | Upload new PDF | Existing |
| DELETE | `/api/pdfs/:id` | Delete a PDF | Existing |
| GET | `/api/pdfs/:id/download` | Download PDF file | Existing |
| GET | `/api/pdfs/:id/info` | Get PDF page dimensions (width, height, pages) | New |
| PATCH | `/api/pdfs/:id/status` | Update status (no longer deletes when Signed) | Modified |
| POST | `/api/pdfs/:id/sign` | Sign PDF with e-signature image | Modified |

---

## Database Changes

None — the existing `pdfs` table schema works as-is.

---

## Design Compliance

- Dark mode only (matches Startup.css variables)
- Indigo accent (#6366f1)
- Rounded cards, soft shadows, smooth transitions
- Glass/blur popup overlays
- Responsive breakpoints for tablet and mobile
- All buttons are icon-only (no text)

---

# Session 2: PDF Editor Fixes & UX Improvements

## Changes Made

### 1. Sorting Icon Fix
**File:** `client/src/components/signer-homepage/components/SortDropdown.tsx`

- Changed sort icon from `Filter` (funnel) to `ArrowUpDown` from Lucide Icons
- Updated CSS comment in `SignerHomepage.css` to match

### 2. PDF Preview Button (Debugging)
**File:** `client/src/components/signer-homepage/SignerHomepage.tsx`

- Added `EyeOff` icon import from Lucide Icons
- Added Preview button in `PdfEditorPopup` action bar:
  - Indigo color, positioned above the Check button
  - Calls `POST /api/pdfs/:id/preview` endpoint
  - Opens a full-screen overlay showing the combined PDF in an iframe
  - Does NOT update SQLite or overwrite the original file
  - Disabled when no signature is uploaded or while loading
- Added preview popup overlay with header, close button, and iframe

**File:** `server/src/routes/pdf.routes.ts`

- Added new `POST /api/pdfs/:id/preview` endpoint:
  - Accepts signature image + posX/posY coordinates
  - Loads the original PDF (read-only, does not touch disk)
  - Embeds the signature at the specified position
  - Returns the combined PDF as a binary response
  - Does NOT save to disk or update the database

### 3. Signature Offset Fix
**File:** `client/src/components/signer-homepage/hooks/useSignatureDrag.ts`

- Changed default position from `{ x: 50, y: 250 }` to `{ x: 0, y: 0 }` (will be centered on render)
- Added `centerPosition()` function that:
  - Reads the actual container dimensions
  - Centers the signature horizontally
  - Places it at vertical center
  - Called when a signature file is uploaded

**File:** `client/src/components/signer-homepage/SignerHomepage.tsx`

- Updated `handleFileChange` to call `centerPosition()` after setting the signature
- This ensures the signature starts centered on the PDF, reducing offset perception

### 4. PDF View Size Increase
**File:** `client/src/components/signer-homepage/SignerHomepage.css`

- Increased popup dimensions from `90vw/90vh` to `94vw/94vh`
- Increased viewer PDF area height on tablet from 55% to 60%
- Added responsive styles for preview popup (85vw/85vh desktop, 96vw/90vh tablet, 100vw/100vh mobile)

### 5. Disabled Button Support
**File:** `client/src/components/signer-homepage/components/ActionButtons.tsx`

- Added `disabled` prop to `ActionButtonProps` interface
- Added `signer-action-btn--disabled` CSS class (opacity 0.4, cursor not-allowed, pointer-events none)

**File:** `client/src/components/signer-homepage/SignerHomepage.css`

- Added `.signer-action-btn--disabled` styles

### 6. Editor Layout Improvement
**File:** `client/src/components/signer-homepage/SignerHomepage.css`

- Added `.signer-editor-popup__right-actions` flex column layout
- Stacks preview button above check/cancel row for better UX

---

## Modified Files (Session 2)

| File | Location | Changes |
|------|----------|---------|
| `SortDropdown.tsx` | `client/src/components/signer-homepage/components/` | Filter → ArrowUpDown icon |
| `SignerHomepage.tsx` | `client/src/components/signer-homepage/` | Added Preview button, EyeOff import, centerPosition, preview popup |
| `SignerHomepage.css` | `client/src/components/signer-homepage/` | Larger popup, disabled button, preview popup, editor layout |
| `ActionButtons.tsx` | `client/src/components/signer-homepage/components/` | Added disabled prop |
| `useSignatureDrag.ts` | `client/src/components/signer-homepage/hooks/` | Centered default position, added centerPosition() |
| `pdf.routes.ts` | `server/src/routes/` | Added POST /api/pdfs/:id/preview endpoint |

---

## API Endpoints (Updated)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/pdfs` | List all PDFs (sorted) | Existing |
| POST | `/api/pdfs` | Upload new PDF | Existing |
| DELETE | `/api/pdfs/:id` | Delete a PDF | Existing |
| GET | `/api/pdfs/:id/download` | Download PDF file | Existing |
| GET | `/api/pdfs/:id/info` | Get PDF page dimensions | Existing |
| POST | `/api/pdfs/:id/sign` | Sign PDF with e-signature image | Existing |
| POST | `/api/pdfs/:id/preview` | Preview signed PDF (read-only) | Existing |
| PATCH | `/api/pdfs/:id/status` | Update status | Existing |

---

# Session 3: PDF Editor Layout Fix & Backend Cleanup

## Changes Made

### 1. PDF Editor Layout Restructure (Side-by-Side)
**File:** `client/src/components/signer-homepage/SignerHomepage.tsx`

- Restructured `PdfEditorPopup` from vertical (column) layout to horizontal (row) layout
- **Left side (flex: 7):** PDF canvas — takes up most of the window for easy reading
- **Right side (flex: 3):** Sidebar with document title, hint text, and action buttons
- Buttons are now stacked vertically (column format) in the right sidebar
- Upload button is now full-width with "Upload Signature" text label
- Sign and Cancel buttons have text labels ("Sign" / "Cancel")
- Preview button remains above Sign/Cancel in the sidebar

**File:** `client/src/components/signer-homepage/SignerHomepage.css`

- Changed `.signer-editor-popup` from `flex-direction: column` to `flex-direction: row`
- Replaced `.signer-editor-popup__canvas-area` with `.signer-editor-popup__pdf-area` (flex: 7)
- Added `.signer-editor-popup__sidebar` (flex: 3) with column layout
- Added `.signer-editor-popup__sidebar-header`, `__sidebar-title`, `__sidebar-hint` styles
- Added `.signer-editor-popup__sidebar-actions` for column button layout
- Updated upload button to full-width with text label support
- Action buttons in sidebar are full-width and centered
- Confirmation dialog in sidebar is full-width
- Updated responsive breakpoints for tablet/mobile to stack editor layout vertically

### 2. Signature Offset Fix (Padding/Border Compensation)
**File:** `client/src/components/signer-homepage/SignerHomepage.tsx`

- Added `SIG_PADDING_X = 16` and `SIG_PADDING_Y = 10` constants
  - These account for the signature container's border (2px) + padding (14px horizontal, 8px vertical)
- Created `convertToPdfCoords()` helper function that:
  - Takes pixel coordinates from the drag hook
  - Adds padding/border offsets to match the actual image position
  - Converts to PDF point coordinates using canvas render info
- Updated `handlePreview` and `handleConfirmSign` to use `convertToPdfCoords()`
- This ensures the signed PDF signature matches the visual position in the editor

### 3. Backend Cleanup
**File:** `server/src/routes/pdf.routes.ts`

- Replaced `require("fs")` with `Bun.file().unlink()` for file deletion
  - More idiomatic for Bun runtime
  - Made the DELETE handler `async` to support the async `unlink()` call
- Removed Node.js `fs` dependency from the delete handler

**File:** `server/package.json`

- Removed vestigial `"module": "src/index.js"` field
  - This was incorrect — Bun runs `src/index.ts` directly
  - The field was leftover from an earlier configuration

### 4. Comments Update
**File:** `client/src/components/signer-homepage/SignerHomepage.tsx`

- Updated file header comment to reflect new editor layout
- Added detailed JSDoc comment for `convertToPdfCoords()` explaining the coordinate mapping
- Added comments explaining `SIG_PADDING_X` and `SIG_PADDING_Y` constants

**File:** `client/src/components/signer-homepage/SignerHomepage.css`

- Updated file header section list to reflect new editor layout
- Updated section 9 comment to describe the new side-by-side layout
- Added comments for sidebar-specific CSS rules

---

## Modified Files (Session 3)

| File | Location | Changes |
|------|----------|---------|
| `SignerHomepage.tsx` | `client/src/components/signer-homepage/` | Restructured PdfEditorPopup layout, added signature offset fix, updated comments |
| `SignerHomepage.css` | `client/src/components/signer-homepage/` | New editor sidebar styles, updated responsive breakpoints, updated comments |
| `pdf.routes.ts` | `server/src/routes/` | Replaced require("fs") with Bun.file().unlink(), made handler async |
| `server/package.json` | `server/` | Removed vestigial "module" field |

---

## Sorting Icon Verification

The sorting icon was already changed from `Filter` (funnel) to `ArrowUpDown` in Session 2.
Verified no `Filter` or `Funnel` icons exist in the codebase:
- `SortDropdown.tsx` uses `ArrowUpDown` from lucide-react ✓
- `Homepage.tsx` uses `ArrowUpDown` from lucide-react ✓

---

## Design Compliance

- Dark mode only (matches Startup.css variables) ✓
- Indigo accent (#6366f1) ✓
- Rounded cards, soft shadows, smooth transitions ✓
- Glass/blur popup overlays ✓
- Responsive breakpoints for tablet and mobile ✓
- PDF editor: left side takes most space, right sidebar with column buttons ✓
- Signature offset fixed to match visual position ✓
- Backend uses idiomatic Bun APIs ✓

---

# Session 4: Authentication System (Login & Signup)

## Overview

Full authentication flow for PirmaKo — login screen, signup popup, JWT token management, and role-based routing. Backend auth endpoints (register, login, me) already existed but were not connected to the frontend.

## Changes Made

### 1. Auth Context (State Management)
**File:** `client/src/contexts/AuthContext.tsx` (NEW)

- Created `AuthProvider` and `useAuth` hook for centralized auth state
- Stores user data (id, email, role) and JWT token (persisted in localStorage)
- `login()` — calls POST /api/auth/login, saves token and user
- `register()` — calls POST /api/auth/register, saves token and user
- `logout()` — clears token from localStorage and resets user state
- On mount, verifies saved token with GET /api/auth/me to restore session

### 2. API Helper
**File:** `client/src/lib/api.ts` (NEW)

- `apiFetch()` — wraps native fetch() to automatically include Authorization header
- Reads JWT token from localStorage and adds `Bearer <token>` to all requests
- Keeps token handling in one place (no duplication across hooks)

### 3. Login Screen
**File:** `client/src/components/auth/Login.tsx` (NEW)

- Full-page centered card layout (matches Startup screen design)
- Email and password fields with labels and placeholders
- Password field has eye/eye-off toggle (show/hide)
- Client-side validation: fields required, email must contain "@"
- Calls `useAuth().login()` on submit
- Shows AlertDialog on errors (wrong credentials, user not found)
- Clears fields on error per UX requirements
- "Sign up" link at bottom opens the Signup popup

### 4. Signup Popup
**File:** `client/src/components/auth/Signup.tsx` (NEW)

- Modal overlay on top of the login screen
- Email, password, and re-enter password fields
- Password fields have eye/eye-off toggles
- Role selection cards (Requester / Signer) — same card style as Startup
- Client-side validation: all fields required, email "@", passwords match, min 6 chars, role selected
- Calls `useAuth().register()` on submit
- Back button (top-left ArrowLeft icon) closes the popup
- Shows AlertDialog on errors (duplicate email, weak password, etc.)

### 5. AlertDialog Component
**File:** `client/src/components/ui/alert-dialog.tsx` (NEW)

- Reusable error/info popup dialog
- Dark card with warning icon, title, message, and OK button
- Semi-transparent backdrop with blur effect
- Click backdrop or OK to dismiss
- Styled to match Startup screen theme

**File:** `client/src/components/ui/alert-dialog.css` (NEW)

- Backdrop: semi-transparent black + blur
- Card: dark background, rounded corners, soft shadow
- Icon: amber/orange warning triangle
- Button: indigo accent, full-width, hover lift effect
- Animations: fadeIn for backdrop, slideUp for card

### 6. App.tsx Rewrite
**File:** `client/src/App.tsx` (MODIFIED)

- Wrapped entire app in `AuthProvider`
- Created `AppInner` component that uses `useAuth()` context
- Auth flow: loading → login/signup → startup → homepage/signer-homepage
- Added "loading" state while checking saved token
- Not authenticated → shows Login (or Signup popup)
- Authenticated → shows normal app screens (startup, homepage, signer-homepage)
- Signup popup state managed with `showSignup` boolean

### 7. Auth CSS
**File:** `client/src/components/auth/Auth.css` (NEW)

- Shared styles for Login and Signup components
- Full-page layout, centered card, form fields, inputs, buttons
- Password toggle button positioning
- Role selection cards (grid layout, selected state with indigo glow)
- Signup popup overlay (backdrop + centered card)
- Back button styling (top-left of popup)
- Animations: fadeIn, slideUp
- Responsive breakpoints for mobile

### 8. API Hooks Updated
**File:** `client/src/hooks/usePdfFiles.ts` (MODIFIED)

- Replaced all `fetch()` calls with `apiFetch()` for auth headers
- Affected methods: load, upload, remove, download, updateStatus

**File:** `client/src/hooks/useSignerPdfs.ts` (MODIFIED)

- Replaced all `fetch()` calls with `apiFetch()` for auth headers
- Affected methods: load, getPdfInfo, signPdf

**File:** `client/src/components/signer-homepage/SignerHomepage.tsx` (MODIFIED)

- Added `apiFetch` import from `../../lib/api`
- Replaced `fetch()` with `apiFetch()` in preview endpoint call

---

## Modified Files (Session 4)

| File | Location | Changes |
|------|----------|---------|
| `App.tsx` | `client/src/` | Wrapped in AuthProvider, added auth flow routing |
| `usePdfFiles.ts` | `client/src/hooks/` | All fetch() → apiFetch() for auth headers |
| `useSignerPdfs.ts` | `client/src/hooks/` | All fetch() → apiFetch() for auth headers |
| `SignerHomepage.tsx` | `client/src/components/signer-homepage/` | Added apiFetch import, preview call updated |
| `requirements.txt` | root | Added @elysiajs/jwt, pdf-lib |

---

## New Files (Session 4)

| File | Location | Purpose |
|------|----------|---------|
| `AuthContext.tsx` | `client/src/contexts/` | Auth state management (user, token, login, register, logout) |
| `api.ts` | `client/src/lib/` | Authenticated fetch wrapper (auto-includes Bearer token) |
| `Login.tsx` | `client/src/components/auth/` | Login screen (email, password, sign up link) |
| `Signup.tsx` | `client/src/components/auth/` | Signup popup (email, password, role selection) |
| `Auth.css` | `client/src/components/auth/` | Shared auth screen styles |
| `alert-dialog.tsx` | `client/src/components/ui/` | Reusable error dialog component |
| `alert-dialog.css` | `client/src/components/ui/` | Error dialog styles |

---

## Auth Flow

1. **App Start** → AuthProvider checks localStorage for saved token
2. **No Token** → Shows Login screen
3. **Login** → User enters email + password → POST /api/auth/login → token saved → user state set → routes to Startup
4. **Signup** → User fills form + picks role → POST /api/auth/register → token saved → user state set → routes to Startup
5. **Startup** → User picks Requester or Signer → routes to appropriate homepage
6. **Logout** → Clears token and user state → returns to Login screen

---

## Design Compliance

- Dark mode only (matches Startup.css variables) ✓
- Indigo accent (#6366f1) ✓
- Rounded cards, soft shadows, smooth transitions ✓
- Password show/hide toggles (eye/eye-off) ✓
- AlertDialog styled like Startup theme ✓
- Responsive design ✓
- Comments in all new files ✓

---

# Session 5: Authentication Fixes — HTTP Cookie, CORS, Logout

## Overview

Fixes to satisfy the authentication requirements:
- User data saved in JWT, HTTP cookie, and SQLite
- Login screen is the default screen on app restart
- Role-based routing after login/signup
- Back navigation from homepages to login

## Changes Made

### 1. HTTP Cookie for JWT Persistence
**File:** `server/src/routes/auth.routes.ts`

The JWT token is now stored in an HTTP cookie (`pirmako_auth`) in addition to being returned in the response body. This provides:
- Persistence across browser restarts (cookie survives localStorage clearing)
- HttpOnly flag prevents JavaScript access (XSS protection)
- SameSite=Lax for cross-port compatibility on localhost
- Max-Age of 7 days

Changes:
- Added `cookie: "pirmako_auth"` to the JWT plugin configuration
- `jwt.sign()` now automatically sets a `Set-Cookie` header with the token
- `jwt.verify()` now checks both the `Authorization: Bearer` header and the `pirmako_auth` cookie

### 2. Logout Endpoint
**File:** `server/src/routes/auth.routes.ts`

Added `GET /api/auth/logout` endpoint that clears the JWT cookie by setting it with `Max-Age=0`. This ensures the cookie is properly cleared when the user logs out.

### 3. CORS Configuration for Credentials
**File:** `server/src/index.ts`

Updated the CORS plugin to support cookie-based authentication:
- Added `credentials: true` to allow cookies to be sent cross-origin
- Added explicit `origin` list (`http://localhost:5173`, `http://127.0.0.1:5173`)
- Required for cross-origin cookie support between Vite (5173) and Elysia (3000)

### 4. Client Logout Integration
**File:** `client/src/contexts/AuthContext.tsx`

Updated the `logout()` function to:
- Call `GET /api/auth/logout` to clear the server-side HTTP cookie
- Clear `pirmako_token` and `pirmako_role` from localStorage
- Reset user state to null (returns to login screen)

---

## Modified Files (Session 5)

| File | Location | Changes |
|------|----------|---------|
| `auth.routes.ts` | `server/src/routes/` | Added `cookie: "pirmako_auth"` to JWT config, added GET /api/auth/logout endpoint |
| `index.ts` | `server/src/` | Updated CORS config with credentials and explicit origin |
| `AuthContext.tsx` | `client/src/contexts/` | logout() now calls server endpoint to clear HTTP cookie |

---

## Auth Flow (Updated)

1. **App Start** → AuthProvider checks localStorage for saved token, and the browser sends the `pirmako_auth` cookie automatically
2. **No Token + No Cookie** → Shows Login screen (default)
3. **Login** → POST /api/auth/login → server returns JWT + sets `pirmako_auth` cookie → token saved to localStorage → user state set → routes to role-based homepage
4. **Signup** → POST /api/auth/register → server returns JWT + sets `pirmako_auth` cookie with role → token saved to localStorage → user state set → routes to role-based homepage
5. **Authenticated** → Role determines homepage: requester → Homepage, signer → SignerHomepage
6. **Back Navigation** → Navbar back button calls logout() → clears cookie + localStorage → returns to Login screen

---

## How User Data Is Stored

| Storage | What's Stored | Purpose |
|---------|---------------|---------|
| **JWT (token)** | id, email, role (signed) | Stateless authentication — server verifies without DB lookup |
| **HTTP Cookie** (`pirmako_auth`) | JWT token value | Persistence across browser restarts, HttpOnly for XSS protection |
| **SQLite** (`users` table) | id, email, password hash, role, created_at | Persistent user records, role authority |
| **localStorage** (`pirmako_token`) | JWT token value | Client-side session restoration on page reload |
| **localStorage** (`pirmako_role`) | "requester" or "signer" | Fast role check for routing (avoids waiting for /me response) |

---

# Session 6: Authentication Fixes — Signup Flow & Requester Email

## Overview

Fixes to the authentication flow and PDF management:
- Fixed signup flow to return to login screen after logout
- Added requester email to PDF uploads for signer visibility
- Signers can now see who uploaded each PDF

## Changes Made

### 1. Signup Flow Fix
**File:** `client/src/App.tsx`

**Problem:** After signing up and logging out, the app showed the Signup popup instead of the Login screen because `showSignup` state remained `true`.

**Fix:** Added `useEffect` to reset `showSignup` to `false` whenever `user` becomes `null` (on logout or session expiry).

### 2. Requester Email in Database Schema
**File:** `server/src/db/database.ts`

- Added `requester_email TEXT` column to the `pdfs` table
- Added migration to add the column to existing databases
- The email links each PDF to the requester who uploaded it

### 3. PDF Upload with Requester Email
**File:** `server/src/routes/pdf.routes.ts`

- Updated `POST /api/pdfs` to accept `requester_email` in form data
- Stores the email in the database with the PDF record
- Returns `requester_email` in the response

### 4. Frontend Hooks Updated
**File:** `client/src/hooks/usePdfFiles.ts`

- Added `requester_email` to `PdfRecord` interface
- Updated `upload()` to accept optional `requesterEmail` parameter
- Sends the email in the form data when uploading

**File:** `client/src/hooks/useSignerPdfs.ts`

- Added `requester_email` to `SignerPdfRecord` interface

### 5. Homepage Requester Email
**File:** `client/src/components/homepage/Homepage.tsx`

- Added `useAuth` import to get the current user's email
- Passes `user?.email` when uploading PDFs to link them to the requester

### 6. Signer Homepage Display
**File:** `client/src/components/signer-homepage/SignerHomepage.tsx`

- Updated `SignerPdfRow` to display requester email below the date
- Updated `PdfViewerPopup` to show requester email in the details panel
- Added `signer-pdf-row__requester` CSS class for styling

**File:** `client/src/components/signer-homepage/SignerHomepage.css`

- Added `.signer-pdf-row__requester` styles (accent color, smaller font)
- Added `.signer-viewer-popup__requester` styles for viewer popup

---

## Modified Files (Session 6)

| File | Location | Changes |
|------|----------|---------|
| `App.tsx` | `client/src/` | Added useEffect to reset showSignup on logout |
| `database.ts` | `server/src/db/` | Added requester_email column to pdfs table |
| `pdf.routes.ts` | `server/src/routes/` | Updated POST /api/pdfs to accept and store requester_email |
| `usePdfFiles.ts` | `client/src/hooks/` | Added requester_email to interface, updated upload() |
| `useSignerPdfs.ts` | `client/src/hooks/` | Added requester_email to interface |
| `Homepage.tsx` | `client/src/components/homepage/` | Added useAuth, pass user.email when uploading |
| `SignerHomepage.tsx` | `client/src/components/signer-homepage/` | Display requester email in list and viewer |
| `SignerHomepage.css` | `client/src/components/signer-homepage/` | Added requester email styles |

---

## Database Changes

| Table | Column | Type | Description |
|-------|--------|------|-------------|
| pdfs | requester_email | TEXT | Email of the requester who uploaded the PDF |

---

## Auth Flow (Updated)

1. **App Start** → AuthProvider checks localStorage for saved token
2. **No Token** → Shows Login screen (default)
3. **Login** → POST /api/auth/login → token saved → routes to role-based homepage
4. **Signup** → POST /api/auth/register → token saved → routes to role-based homepage
5. **Logout** → Clears token + cookie → **returns to Login screen** (not Signup popup)
6. **Upload PDF** → Requester's email is saved with the PDF record
7. **Signer Views PDFs** → Sees all pending PDFs with requester email displayed

---

# Session 7: Authentication Fixes — PDF Isolation, Button Styling, Alert Dialogs

## Overview

Fixes to satisfy the Authentication.md requirements:
- PDF uploads isolated per requester (each requester only sees their own PDFs)
- PDF viewer sign/cancel buttons expanded to same width, column layout
- PDF editor alert dialogs inherit startup style
- PDF editor sign/cancel buttons same width, margin between preview and sign
- PDF list delete alert dialog after download, inherits startup style

## Changes Made

### 1. PDF Upload Isolation — Requesters Only See Their Own PDFs
**File:** `server/src/routes/pdf.routes.ts`

**Problem:** The `GET /api/pdfs` endpoint returned ALL PDFs to every user, meaning Requester 1 could see Requester 2's uploads.

**Fix:**
- Added `requester_email` query parameter to `GET /api/pdfs`
- When `requester_email` is provided and `all` is not "true", the endpoint filters results by `WHERE requester_email = ?`
- Signers use `all=true` or omit the parameter to see all PDFs
- Requesters pass their email to see only their own uploads

**File:** `client/src/hooks/usePdfFiles.ts`

**Changes:**
- Added optional `requesterEmail` parameter to `usePdfFiles()` hook
- When provided, sends `requester_email` query parameter in the API request
- Backend filters results so requesters only see their own uploaded PDFs

**File:** `client/src/components/homepage/Homepage.tsx`

**Changes:**
- Passes `user?.email` to `usePdfFiles()` hook
- Ensures each requester only sees their own uploaded PDFs

### 2. PDF Viewer Button Width Fix
**File:** `client/src/components/signer-homepage/SignerHomepage.css`

**Problem:** Sign and cancel buttons in the PDF viewer popup were too small in width.

**Fix:**
- Added `.signer-viewer-popup__actions .signer-action-btn.signer-action-btn--with-label` rule
- Forces buttons with labels to be full-width (`width: 100%`) in the viewer popup
- Both buttons now have the same width and are centered
- Layout remains column (vertical) with proper spacing

### 3. PDF Editor Alert Dialog Startup Inheritance
**File:** `client/src/components/signer-homepage/SignerHomepage.tsx`

**Problem:** The PDF editor used `window.alert()` for validation errors, which doesn't match the startup theme.

**Fix:**
- Added `AlertDialog` import from `../ui/alert-dialog`
- Added `alert` state to `PdfEditorPopup` component
- Replaced all `window.alert()` calls with styled `AlertDialog` component:
  - "Signature Required" alert when previewing without signature
  - "Preview Failed" alert when preview generation fails
  - "Signature Required" alert when confirming without signature
- AlertDialog inherits the startup dark theme styling

**File:** `client/src/components/signer-homepage/components/ConfirmDialog.tsx`

**Problem:** The inline ConfirmDialog didn't inherit startup styling.

**Fix:**
- Complete rewrite to use `alert-backdrop` and `alert-card` CSS classes
- Now displays as a proper modal dialog with:
  - Semi-transparent backdrop with blur
  - Dark card with rounded corners
  - Warning icon (AlertTriangle)
  - Title and message text
  - Confirm (Sign) and Cancel buttons
- Styled identically to the AlertDialog component

### 4. PDF Editor Button Width & Margin Fix
**File:** `client/src/components/signer-homepage/SignerHomepage.css`

**Problem:** Sign button not same width as cancel button in editor sidebar. No margin between preview and sign buttons.

**Fix:**
- Added `.signer-editor-popup__sidebar-actions .signer-action-btn.signer-action-btn--with-label` rule
- Forces buttons with labels to be full-width in the editor sidebar
- Added `.signer-editor-popup__sidebar-actions .signer-action-btn--indigo` rule
- Adds `margin-bottom: 4px` to the preview button (indigo) for spacing before sign/cancel buttons

### 5. PDF List Delete Alert After Download
**File:** `client/src/components/homepage/Homepage.tsx`

**Problem:** No alert dialog prompting delete PDF after downloading.

**Fix:**
- Added `AlertDialog` import from `../ui/alert-dialog`
- Added `downloadDeleteTarget` state to track PDFs pending post-download deletion
- Modified `handleDownload` to show AlertDialog after successful download
- AlertDialog asks: "Do you want to delete [PDF name] after downloading?"
- Confirming deletes the PDF, dismissing keeps it
- Alert inherits startup theme styling

**File:** `client/src/components/homepage/Homepage.tsx` (DeleteConfirmDialog)

**Problem:** DeleteConfirmDialog didn't inherit startup styling.

**Fix:**
- Updated to use `alert-backdrop` and `alert-card` CSS classes
- Now styled identically to the AlertDialog component
- Uses same animations (fadeIn, slideUp) and visual design

---

## Modified Files (Session 7)

| File | Location | Changes |
|------|----------|---------|
| `pdf.routes.ts` | `server/src/routes/` | Added `requester_email` query param to GET /api/pdfs for filtering |
| `usePdfFiles.ts` | `client/src/hooks/` | Added `requesterEmail` parameter, sends query param in API request |
| `Homepage.tsx` | `client/src/components/homepage/` | Passes user.email to usePdfFiles, added download-then-delete AlertDialog, updated DeleteConfirmDialog styling |
| `SignerHomepage.tsx` | `client/src/components/signer-homepage/` | Added AlertDialog import, replaced window.alert() with styled dialogs |
| `SignerHomepage.css` | `client/src/components/signer-homepage/` | Full-width buttons in viewer and editor, margin between preview and sign |
| `ConfirmDialog.tsx` | `client/src/components/signer-homepage/components/` | Complete rewrite to inherit startup AlertDialog styling |

---

## Design Compliance

- Dark mode only (matches Startup.css variables) ✓
- Indigo accent (#6366f1) ✓
- Rounded cards, soft shadows, smooth transitions ✓
- AlertDialog inherits startup style ✓
- PDF isolation per requester ✓
- Button widths consistent (same width for sign/cancel) ✓
- Responsive design ✓
- Comments in modified files ✓

---

# Session 8: AlertDialog Enhancement — Delete/Cancel Buttons for PDF List

## Overview

Fix to satisfy the Authentication.md requirement:
- PDF List alert dialog after download now has Delete and Cancel buttons
- Delete button is red with Lucide icon
- Cancel button uses Lucide icon
- PDF is only deleted when the Delete button is pressed (not on backdrop click or cancel)

## Changes Made

### 1. AlertDialog Component Enhancement
**File:** `client/src/components/ui/alert-dialog.tsx`

**Problem:** The AlertDialog only had a single "OK" button. When used for the post-download delete prompt, clicking OK or the backdrop would auto-delete the PDF with no way to cancel.

**Fix:**
- Added optional `icon` prop to replace the default warning icon
- Added optional `actions` prop — an array of `AlertDialogAction` objects
- Each action has: `label`, `icon` (optional Lucide element), `onClick`, `variant` ("primary" | "danger" | "ghost")
- When `actions` is provided, renders custom buttons instead of the default OK
- Backdrop click still calls `onClose` for dismissal
- Exported `AlertDialogAction` interface for type safety

### 2. AlertDialog CSS — Button Variants
**File:** `client/src/components/ui/alert-dialog.css`

- Added `.alert-card__actions` flex container for multiple buttons
- Added `.alert-card__button-icon` for icon alignment inside buttons
- Added `.alert-card__button--primary` (indigo, default OK)
- Added `.alert-card__button--danger` (red, for delete/confirm destructive actions)
- Added `.alert-card__button--ghost` (transparent with border, for cancel/dismiss)
- All variants inherit base button styles (flex, padding, border-radius, transitions)

### 3. Homepage Post-Download Delete Prompt
**File:** `client/src/components/homepage/Homepage.tsx`

**Problem:** The post-download AlertDialog only had an OK button and auto-deleted the PDF when closed. No way to cancel (keep the PDF).

**Fix:**
- Added `X` icon import from Lucide Icons (for cancel button)
- Added `handleDownloadDeleteCancel` handler that closes the dialog without deleting
- Replaced AlertDialog with custom actions:
  - **Cancel button**: ghost variant, X icon, closes dialog without deleting
  - **Delete button**: danger variant, Trash2 icon, deletes the PDF
- PDF is only deleted when the Delete button is pressed
- Backdrop click calls `onClose` which triggers cancel (safe default)

---

## Modified Files (Session 8)

| File | Location | Changes |
|------|----------|---------|
| `alert-dialog.tsx` | `client/src/components/ui/` | Added `icon` and `actions` props, exported `AlertDialogAction` interface |
| `alert-dialog.css` | `client/src/components/ui/` | Added button variant styles (primary, danger, ghost), actions container, button icon |
| `Homepage.tsx` | `client/src/components/homepage/` | Added X icon import, cancel handler, updated post-download AlertDialog with delete/cancel buttons |

---

## Design Compliance

- Dark mode only (matches Startup.css variables) ✓
- Indigo accent (#6366f1) ✓
- Rounded cards, soft shadows, smooth transitions ✓
- AlertDialog inherits startup style ✓
- Delete button: red with Lucide icon (Trash2) ✓
- Cancel button: ghost with Lucide icon (X) ✓
- PDF only deleted when Delete button pressed ✓
- Backdrop click cancels (safe default) ✓
- Responsive design ✓
- Comments in modified files ✓
