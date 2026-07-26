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
