# Homepage-Signer-Changes.md

This document tracks all files that were **created**, **modified**, or **deleted** to implement the Signer Homepage screen.

---

## Created Files

| File | Location | Description |
|------|----------|-------------|
| `SignerHomepage.tsx` | `src/components/signer-homepage/SignerHomepage.tsx` | Main Signer Homepage component with all sub-components: PDF list, viewer popup, editor popup, empty state, sorting |
| `SignerHomepage.css` | `src/components/signer-homepage/SignerHomepage.css` | All styles for the Signer Homepage — matches the existing Startup.css / Homepage.css design system |
| `useSignerPdfs.ts` | `src/hooks/useSignerPdfs.ts` | Custom React hook for managing signer PDFs (frontend-only with sample data, no backend yet) |

---

## Modified Files

| File | Location | What Changed |
|------|----------|-------------|
| `App.tsx` | `src/App.tsx` | Added `"signer-homepage"` screen to the router, imported `SignerHomepage`, added `onSignerClick` prop to `Startup`, added `SignerHomepage` render block |
| `Startup.tsx` | `src/components/startup/Startup.tsx` | Added `onSignerClick` prop to `StartupProps`, replaced hardcoded toast handler with prop callback, removed unused `toast` import |

---

## Deleted Files

None.

---

## Component Architecture

```
App.tsx (screen router)
├── Startup (role selection)
│   └── UserTypeCard (clickable card → navigates to homepage)
├── Homepage (Requester view — unchanged)
└── SignerHomepage (Signer view — NEW)
    ├── Navbar (shared, with back button)
    ├── SignerHeader (title + sort dropdown)
    ├── SignerPdfList (scrollable list)
    │   └── SignerPdfRow (title, date, status, e-sign button)
    ├── SignerEmptyState (illustration + "No PDFs for signing")
    ├── PdfViewerPopup (glass/blur overlay, 70% viewer + 30% details)
    │   ├── Sign button (green, opens editor)
    │   └── Cancel button (red, closes popup)
    └── PdfEditorPopup (drag-and-drop signature placement)
        ├── Check button (confirms signing)
        └── Cancel button (closes editor)
```

---

## Key Features Implemented

- **Navigation bar** — same as Startup, with back button
- **PDF list view** — title, date/time pushed, status badge (Pending/Signed), e-sign button
- **E-sign button** — `file-pen-line` icon from Lucide, rightmost per row
- **PDF viewer popup** — glass/blur background, 70/30 split layout, PDF details + Sign/Cancel
- **PDF editor popup** — draggable signature on simulated PDF page, Check/Cancel buttons
- **Sorting** — Recently Uploaded, Oldest, Alphabetical by Title
- **Empty state** — illustration + "No PDFs for signing" message
- **Toast notifications** — on e-sign, sign, check, and cancel actions
- **Responsive design** — adapts for mobile and tablet
- **Dark mode only** — indigo accent (#6366f1), matching existing design system

---

## Notes

- All data is **frontend-only** (hardcoded sample PDFs). No SQLite or backend integration yet.
- The PDF viewer displays a placeholder until a real PDF renderer (e.g., `react-pdf`) is connected.
- The PDF editor uses a simulated white page with line placeholders for the signature drag-and-drop area.
- Styling is identical to `Startup.css` and `Homepage.css` — same CSS variables, transitions, shadows, and border radii.
