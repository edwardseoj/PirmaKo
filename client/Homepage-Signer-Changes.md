# Homepage-Signer-Changes.md

This document tracks all files that were **created**, **modified**, or **deleted** during the Signer Homepage screen improvement.

---

## Created Files

| File | Location | Description |
|------|----------|-------------|
| `useSignatureDrag.ts` | `src/components/signer-homepage/hooks/useSignatureDrag.ts` | Custom hook for smooth drag-and-drop signature placement within the PDF page |
| `PopupOverlay.tsx` | `src/components/signer-homepage/components/PopupOverlay.tsx` | Reusable glass/blur modal backdrop — click-outside-to-close pattern |
| `ActionButtons.tsx` | `src/components/signer-homepage/components/ActionButtons.tsx` | Reusable icon-only action buttons with color theming (green/red/indigo, outline/filled) |
| `ConfirmDialog.tsx` | `src/components/signer-homepage/components/ConfirmDialog.tsx` | Inline confirmation prompt with confirm/cancel icon buttons |
| `SortDropdown.tsx` | `src/components/signer-homepage/components/SortDropdown.tsx` | Reusable sort dropdown with funnel icon, extracted from SignerHeader |

---

## Modified Files

| File | Location | What Changed |
|------|----------|-------------|
| `SignerHomepage.tsx` | `src/components/signer-homepage/SignerHomepage.tsx` | Major refactor: removed toasts, extracted reusable components, fixed drag-and-drop, added upload e-signature button, added confirmation dialog, updated check/cancel to icon-only buttons |
| `SignerHomepage.css` | `src/components/signer-homepage/SignerHomepage.css` | Added styles for new components (ActionButtons, ConfirmDialog, upload button), added scrollable areas for viewer/editor, improved responsive design |

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
    │   └── ActionButtons (green Sign, red Cancel)
    └── PdfEditorPopup (via PopupOverlay)
        ├── Header (title + hint)
        ├── Canvas area (scrollable, simulated PDF page)
        │   └── useSignatureDrag (smooth drag-and-drop hook)
        ├── Upload e-signature button (FilePlus, indigo, leftmost)
        └── ActionButtons or ConfirmDialog (green Check + red Cancel)
```

---

## Key Improvements Made

### Bug Fixes
- **PDF Viewer scrollable** — Added `overflow-y: auto` to the PDF preview area
- **PDF Editor scrollable** — Added `overflow-y: auto` to the canvas area
- **Signature drag teleport** — Fixed by using the PDF page element as the drag reference and measuring container bounds on each mousemove event
- **Toast notifications removed** — All `toast.info`, `toast.success`, `toast.warning` calls and `sonner` imports removed

### UX Improvements
- **Check/Cancel buttons** — Now minimal icon-only buttons (no text), green/red respectively, with confirmation dialog on Check
- **Upload e-signature button** — Added to editor action bar (leftmost, `FilePlus` icon, indigo color)
- **Sorting** — Added `Filter` (funnel) icon from Lucide Icons to the sort dropdown
- **Confirmation dialog** — Inline "Sign this document?" prompt before signing

### Code Quality
- **Reusable components** — `PopupOverlay`, `ActionButtons`/`ActionButton`, `ConfirmDialog`, `SortDropdown`
- **Custom hook** — `useSignatureDrag` extracts drag-and-drop logic from the component
- **TypeScript** — Proper types for all props, interfaces, and function signatures
- **Comments** — All files contain detailed comments explaining each section
- **Component size** — Main `SignerHomepage.tsx` is ~310 lines (reduced from 622 with extracted components)

---

## Notes

- All data is **frontend-only** (hardcoded sample PDFs). No SQLite or backend integration yet.
- The PDF viewer displays a placeholder until a real PDF renderer (e.g., `react-pdf`) is connected.
- The PDF editor uses a simulated white page with line placeholders for the signature drag-and-drop area.
- Styling matches `Startup.css` — same CSS variables, transitions, shadows, border radii, and dark-mode palette.
- Build passes with `bun run build` (TypeScript + Vite).
