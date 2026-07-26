# Homepage-Signer-Changes.md

This document tracks all files that were **created**, **modified**, or **deleted** during the Signer Homepage screen improvement and backend/database fixes.

---

## Created Files

| File | Location | Description |
|------|----------|-------------|
| `useSignatureDrag.ts` | `src/components/signer-homepage/hooks/useSignatureDrag.ts` | Custom hook for smooth drag-and-drop signature placement within the PDF page |
| `PopupOverlay.tsx` | `src/components/signer-homepage/components/PopupOverlay.tsx` | Reusable glass/blur modal backdrop — click-outside-to-close pattern |
| `ActionButtons.tsx` | `src/components/signer-homepage/components/ActionButtons.tsx` | Reusable action buttons with optional text labels, color theming (green/red/indigo, outline/filled) |
| `ConfirmDialog.tsx` | `src/components/signer-homepage/components/ConfirmDialog.tsx` | Inline confirmation prompt with confirm/cancel icon buttons |
| `SortDropdown.tsx` | `src/components/signer-homepage/components/SortDropdown.tsx` | Reusable sort dropdown with funnel icon, extracted from SignerHeader |

---

## Modified Files

| File | Location | What Changed |
|------|----------|-------------|
| `SignerHomepage.tsx` | `src/components/signer-homepage/SignerHomepage.tsx` | Added text labels ("Sign", "Cancel") to PDF viewer popup action buttons; centered action buttons in viewer details panel; added `handleCheckClick` that shows alert dialog when clicking check without e-signature uploaded |
| `SignerHomepage.css` | `src/components/signer-homepage/SignerHomepage.css` | Increased popup window size (92% width, 1100px max-width, 78vh height, 720px max-height); centered action buttons; added pill-shaped button styles with text labels; added editor action bar layout; improved responsive breakpoints for larger popup; **fixed PDF editor page to fill available space (removed 500x500px cap); changed canvas area to use `overflow: hidden` with stretch alignment** |
| `ActionButtons.tsx` | `src/components/signer-homepage/components/ActionButtons.tsx` | Added optional `label` prop for text labels alongside icons; buttons render as pill-shaped when label is provided, circular when icon-only |
| `useSignatureDrag.ts` | `src/components/signer-homepage/hooks/useSignatureDrag.ts` | **Fixed drag offset calculation — converted mouse coordinates to container-relative before computing offset, and simplified `handleMouseMove` to use consistent container-relative math throughout** |

---

## Deleted Files

None.

---

## Component Architecture (Updated)

```
App.tsx (screen router)
├── Startup (role selection)
│   └── UserTypeCard (clickable card → navigates to homepage)
├── Homepage (Requester view — unchanged)
└── SignerHomepage (Signer view — improved)
    ├── Navbar (shared, with back button)
    ├── SignerHeader (title)
    ├── SortDropdown (reusable — funnel icon, click-outside close)
    ├── SignerPdfList (scrollable list)
    │   └── SignerPdfRow (icon, title, date, status, e-sign button)
    ├── SignerEmptyState (illustration + "No PDFs for signing")
    ├── PdfViewerPopup (glass/blur overlay via PopupOverlay)
    │   ├── PDF area (70%, scrollable)
    │   ├── Details panel (30%, title, date, status)
    │   └── ActionButtons (green "Sign", red "Cancel" — centered, with text)
    └── PdfEditorPopup (via PopupOverlay)
        ├── Header (title + hint)
        ├── Canvas area (PDF page fills available space)
        │   └── useSignatureDrag (smooth drag-and-drop hook)
        ├── Upload e-signature button (FilePlus, indigo, leftmost)
        └── ActionButtons or ConfirmDialog (green Check + red Cancel)
```

---

## Key Improvements Made

### Bug Fixes
- **PDF Viewer popup too small** — Increased popup dimensions: 92% width (was 90%), 1100px max-width (was 960px), 78vh height (was 70vh), 720px max-height (was 600px)
- **PDF Editor page too small** — Removed `max-width: 500px` and `max-height: 500px` from `.signer-editor-popup__page`; page now fills the entire canvas area. Changed canvas area from scrollable to `overflow: hidden` with `align-items: stretch` so the page fills available space
- **Drag-and-drop not following cursor** — Fixed coordinate system mismatch in `useSignatureDrag.ts`: `handleDragStart` now converts mouse position to container-relative coordinates before computing offset; `handleMouseMove` now uses consistent container-relative math (no more mixing viewport and container coordinates)
- **No alert when checking without signature** — Added `handleCheckClick` guard in `PdfEditorPopup` that shows `window.alert("Please upload an e-signature image before confirming.")` when the check button is clicked without a signature uploaded
- **Sign/Cancel buttons not centered** — Added `align-items: center` to `.signer-viewer-popup__actions` and `justify-content: center` to `.signer-action-buttons`
- **Sign/Cancel buttons missing text** — Added optional `label` prop to `ActionButton` component; "Sign" and "Cancel" text now displayed alongside icons in the PDF viewer popup
- **PDF Viewer scrollable** — Added `overflow-y: auto` to the PDF preview area
- **PDF Editor scrollable** — Added `overflow-y: auto` to the canvas area
- **Signature drag teleport** — Fixed by using the PDF page element as the drag reference and measuring container bounds on each mousemove event
- **Toast notifications removed** — All `toast.info`, `toast.success`, `toast.warning` calls and `sonner` imports removed

### UX Improvements
- **Action buttons with text** — Sign and Cancel buttons now show icon + text label for better clarity
- **Larger popup** — More room for PDF viewing and button interaction
- **Centered buttons** — Sign/Cancel buttons are centered in the details panel for visual balance
- **Upload e-signature button** — Added to editor action bar (leftmost, `FilePlus` icon, indigo color)
- **Sorting** — Added `Filter` (funnel) icon from Lucide Icons to the sort dropdown
- **Confirmation dialog** — Inline "Sign this document?" prompt before signing

### Responsive Design
- **Tablet (≤768px)** — Popup stacks vertically, PDF area takes 55% height
- **Mobile (≤640px)** — Popup uses 98% width, action buttons stack vertically and fill width
- **Small mobile (≤400px)** — Smaller font sizes for PDF row titles and meta text

### Code Quality
- **Reusable components** — `PopupOverlay`, `ActionButtons`/`ActionButton`, `ConfirmDialog`, `SortDropdown`
- **Custom hook** — `useSignatureDrag` extracts drag-and-drop logic from the component
- **TypeScript** — Proper types for all props, interfaces, and function signatures
- **Comments** — All files contain detailed comments explaining each section
- **Component size** — Main `SignerHomepage.tsx` stays under 600 lines with extracted sub-components

### Design Consistency
- **Matches Startup.css** — Same CSS variables, transitions, shadows, border radii, and dark-mode palette
- **Indigo accent** — Consistent use of `--color-accent: #6366f1` across all interactive elements
- **Rounded cards** — 12px border-radius on PDF rows, 16px on popup containers
- **Soft shadows** — `--shadow-card` and `--shadow-card-hover` used consistently
- **Smooth transitions** — `--transition-default: 0.25s cubic-bezier(0.4, 0, 0.2, 1)` on all interactive elements

---

## Notes

- All data is fetched from the backend API (SQLite database via ElysiaJS).
- The PDF viewer and editor display real PDFs via iframe from the `/api/pdfs/:id/download` endpoint.
- Backend and database are fully functional: ElysiaJS server on port 3000, SQLite with WAL mode, pdf-lib for signature embedding.
- Vite dev server proxies `/api` requests to the backend at `http://localhost:3000`.
- Styling matches `Startup.css` — same CSS variables, transitions, shadows, border radii, and dark-mode palette.
- TypeScript compiles clean (`tsc --noEmit` passes). ESLint passes with no errors.

---

# Session 5: Authentication Fixes — HTTP Cookie, CORS, Logout

## Changes Made

### 1. HTTP Cookie for JWT Persistence
**File:** `server/src/routes/auth.routes.ts`

JWT token now stored in HTTP cookie (`pirmako_auth`) alongside response body. Provides persistence across browser restarts, HttpOnly for XSS protection, SameSite=Lax, 7-day expiry.

### 2. Logout Endpoint
**File:** `server/src/routes/auth.routes.ts`

Added `GET /api/auth/logout` that clears the JWT cookie via `Max-Age=0`.

### 3. CORS Configuration
**File:** `server/src/index.ts`

Added `credentials: true` and explicit origin list to allow cross-origin cookie support between Vite (5173) and Elysia (3000).

### 4. Client Logout Integration
**File:** `client/src/contexts/AuthContext.tsx`

`logout()` now calls `GET /api/auth/logout` to clear the server-side HTTP cookie before clearing localStorage and user state.

---

## Modified Files (Session 5)

| File | Location | Changes |
|------|----------|---------|
| `auth.routes.ts` | `server/src/routes/` | Added cookie config to JWT, added logout endpoint |
| `index.ts` | `server/src/` | Updated CORS with credentials and explicit origin |
| `AuthContext.tsx` | `client/src/contexts/` | logout() calls server endpoint to clear cookie |
