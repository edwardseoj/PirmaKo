/**
 * SignerHomepage.tsx — The signer's main screen after selecting their role.
 *
 * Displays a scrollable list of PDFs waiting for signature with:
 * - Title, push date/time, and status for each PDF
 * - E-sign button per row (file-pen-line icon)
 * - PDF viewer popup (glass/blur overlay, 70% viewer + 30% details)
 * - PDF editor popup (drag-and-drop signature placement)
 * - Sort dropdown (Recently Uploaded, Oldest, Alphabetical)
 * - Empty state with illustration when no PDFs exist
 * - Toast notifications for sign/cancel actions
 *
 * Architecture:
 *   SignerHomepage
 *   ├── Navbar (shared, with back button)
 *   ├── SignerHeader (title + sort dropdown)
 *   ├── SignerPdfList (scrollable list of PDF rows)
 *   │   └── SignerPdfRow (single PDF: title, date, status, e-sign button)
 *   ├── EmptyState (shown when no PDFs)
 *   ├── PdfViewerPopup (modal: PDF preview + details + sign/cancel)
 *   └── PdfEditorPopup (modal: signature drag-and-drop + check/cancel)
 */

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FilePenLine,
  FileText,
  Signature,
  CircleX,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { Navbar } from "../shared/Navbar";
import {
  useSignerPdfs,
  type SortOption,
  type SignerPdfRecord,
} from "../../hooks/useSignerPdfs";
import "./SignerHomepage.css";

/* ──────────────────────────────────────────────────────────────
 * SignerHomepage — top-level component
 * ────────────────────────────────────────────────────────────── */

interface SignerHomepageProps {
  /** Called when the user clicks the back button in the navbar. */
  onBack?: () => void;
}

export function SignerHomepage({ onBack }: SignerHomepageProps) {
  const { pdfs, sort, setSort, signPdf } = useSignerPdfs();

  // Which PDF is open in the viewer popup (null = closed)
  const [viewerTarget, setViewerTarget] = useState<SignerPdfRecord | null>(null);

  // Which PDF is open in the editor popup (null = closed)
  const [editorTarget, setEditorTarget] = useState<SignerPdfRecord | null>(null);

  // ── E-sign button handler ────────────────────────────────────
  // Opens the PDF viewer popup for the selected PDF.
  const handleESignClick = (pdf: SignerPdfRecord) => {
    setViewerTarget(pdf);
    toast.info("E-sign started", {
      description: `Opening "${pdf.title}" for review...`,
      duration: 2000,
    });
  };

  // ── Sign button handler (inside viewer popup) ────────────────
  // Closes the viewer and opens the editor for signature placement.
  const handleSignClick = () => {
    if (!viewerTarget) return;
    toast.info("Sign button pressed", {
      description: "Opening PDF editor for signature placement...",
      duration: 2000,
    });
    setEditorTarget(viewerTarget);
    setViewerTarget(null);
  };

  // ── Check button handler (inside editor popup) ───────────────
  // Marks the PDF as signed and closes the editor.
  const handleCheckClick = () => {
    if (!editorTarget) return;
    signPdf(editorTarget.id);
    toast.success("Document signed", {
      description: `"${editorTarget.title}" has been signed successfully.`,
      duration: 3000,
    });
    setEditorTarget(null);
  };

  // ── Cancel button handler ────────────────────────────────────
  // Closes whichever popup is open and shows a toast.
  const handleCancelClick = (context: "viewer" | "editor") => {
    const name = context === "viewer" ? viewerTarget?.title : editorTarget?.title;
    toast.warning("Cancelled", {
      description: name ? `"${name}" signing cancelled.` : "Signing cancelled.",
      duration: 2000,
    });
    setViewerTarget(null);
    setEditorTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="signer-homepage">
      {/* Shared navbar with a back button to return to startup */}
      <Navbar onBack={onBack} />

      <main className="signer-homepage__main">
        {/* Header with title and sort controls */}
        <SignerHeader sort={sort} onSortChange={setSort} />

        {/* Main content — empty state or PDF list */}
        <div className="signer-homepage__content">
          {pdfs.length === 0 ? (
            <SignerEmptyState />
          ) : (
            <SignerPdfList pdfs={pdfs} onESign={handleESignClick} />
          )}
        </div>
      </main>

      {/* PDF Viewer Popup — glass/blur overlay */}
      {viewerTarget && (
        <PdfViewerPopup
          pdf={viewerTarget}
          onSign={handleSignClick}
          onCancel={() => handleCancelClick("viewer")}
        />
      )}

      {/* PDF Editor Popup — signature drag-and-drop */}
      {editorTarget && (
        <PdfEditorPopup
          pdf={editorTarget}
          onCheck={handleCheckClick}
          onCancel={() => handleCancelClick("editor")}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * SignerHeader — title row + sort dropdown
 *
 * Reuses the same custom dropdown pattern from the Requester homepage.
 * ────────────────────────────────────────────────────────────── */

/** All available sort options with display labels */
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Recently Uploaded" },
  { value: "oldest", label: "Oldest" },
  { value: "alpha", label: "Alphabetical by Title" },
];

function SignerHeader({
  sort,
  onSortChange,
}: {
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <div className="signer-header">
      <h1 className="signer-header__heading">Documents for Signing</h1>

      {/* Custom sort dropdown */}
      <div className="signer-header__sort" ref={dropdownRef}>
        <ArrowUpDown size={14} className="signer-header__sort-icon" />

        <button
          className="signer-header__sort-trigger"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedLabel}
          <svg
            className={`signer-header__sort-chevron ${
              isOpen ? "signer-header__sort-chevron--open" : ""
            }`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="signer-header__sort-menu" role="listbox">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`signer-header__sort-option ${
                  sort === option.value
                    ? "signer-header__sort-option--active"
                    : ""
                }`}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                type="button"
                role="option"
                aria-selected={sort === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * SignerPdfList — scrollable container of PDF rows
 * ────────────────────────────────────────────────────────────── */

function SignerPdfList({
  pdfs,
  onESign,
}: {
  pdfs: SignerPdfRecord[];
  onESign: (pdf: SignerPdfRecord) => void;
}) {
  return (
    <div className="signer-pdf-list">
      {pdfs.map((pdf) => (
        <SignerPdfRow key={pdf.id} pdf={pdf} onESign={() => onESign(pdf)} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * SignerPdfRow — a single PDF entry in the list
 *
 * Shows: icon, title, date/time, status badge, and e-sign button.
 * The e-sign button is always on the rightmost side.
 * ────────────────────────────────────────────────────────────── */

function SignerPdfRow({
  pdf,
  onESign,
}: {
  pdf: SignerPdfRecord;
  onESign: () => void;
}) {
  // Format the ISO timestamp into readable local date + time
  const formattedDate = new Date(pdf.uploaded_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = new Date(pdf.uploaded_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="signer-pdf-row">
      {/* Left side: icon + text info */}
      <div className="signer-pdf-row__info">
        <div className="signer-pdf-row__icon">
          <FileText size={20} strokeWidth={1.5} />
        </div>
        <div className="signer-pdf-row__details">
          <span className="signer-pdf-row__title">{pdf.title}</span>
          <span className="signer-pdf-row__meta">
            Pushed {formattedDate} at {formattedTime}
          </span>
        </div>
      </div>

      {/* Right side: status badge + e-sign button */}
      <div className="signer-pdf-row__actions">
        {/* Status badge — color changes based on status */}
        <span
          className={`signer-pdf-row__status signer-pdf-row__status--${pdf.status.toLowerCase()}`}
        >
          {pdf.status}
        </span>

        {/* E-sign button — rightmost element, file-pen-line icon */}
        <button
          className="signer-pdf-row__btn signer-pdf-row__btn--esign"
          onClick={onESign}
          type="button"
          aria-label={`E-sign ${pdf.title}`}
          title="E-sign this document"
        >
          <FilePenLine size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * SignerEmptyState — shown when there are no PDFs to display
 * ────────────────────────────────────────────────────────────── */

function SignerEmptyState() {
  return (
    <div className="signer-empty-state">
      {/* SVG illustration — a document with a pen */}
      <div className="signer-empty-state__illustration">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Document outline */}
          <rect
            x="16"
            y="8"
            width="48"
            height="64"
            rx="8"
            stroke="var(--color-border)"
            strokeWidth="2"
            fill="var(--color-bg-secondary)"
          />
          {/* Horizontal lines to simulate text */}
          <line
            x1="28"
            y1="28"
            x2="52"
            y2="28"
            stroke="var(--color-border)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="28"
            y1="36"
            x2="48"
            y2="36"
            stroke="var(--color-border)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="28"
            y1="44"
            x2="44"
            y2="44"
            stroke="var(--color-border)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Pen icon — represents signing */}
          <circle
            cx="56"
            cy="56"
            r="14"
            fill="var(--color-accent)"
            opacity="0.9"
          />
          <path
            d="M50 62L62 50M62 50L56 50M62 50L62 56"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="signer-empty-state__text">No PDFs for signing</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * PdfViewerPopup — modal overlay for viewing a PDF before signing
 *
 * Layout:
 *   - Left side (70%): PDF viewer area (placeholder for now)
 *   - Right side (30%): PDF details + Sign / Cancel buttons
 *   - Background: glass/blur effect
 * ────────────────────────────────────────────────────────────── */

function PdfViewerPopup({
  pdf,
  onSign,
  onCancel,
}: {
  pdf: SignerPdfRecord;
  onSign: () => void;
  onCancel: () => void;
}) {
  // Format dates for the detail panel
  const formattedDate = new Date(pdf.uploaded_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = new Date(pdf.uploaded_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="signer-popup-overlay" onClick={onCancel}>
      <div
        className="signer-popup signer-viewer-popup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side — PDF viewer (70% width) */}
        <div className="signer-viewer-popup__pdf-area">
          <div className="signer-viewer-popup__pdf-placeholder">
            <FileText size={48} strokeWidth={1} />
            <span>PDF Preview</span>
          </div>
        </div>

        {/* Right side — PDF details + actions (30% width) */}
        <div className="signer-viewer-popup__details">
          <h2 className="signer-viewer-popup__title">{pdf.title}</h2>

          <div className="signer-viewer-popup__info">
            <span className="signer-viewer-popup__label">Date uploaded</span>
            <span className="signer-viewer-popup__value">
              {formattedDate} at {formattedTime}
            </span>
          </div>

          <div className="signer-viewer-popup__info">
            <span className="signer-viewer-popup__label">Status</span>
            <span
              className={`signer-pdf-row__status signer-pdf-row__status--${pdf.status.toLowerCase()}`}
            >
              {pdf.status}
            </span>
          </div>

          {/* Action buttons */}
          <div className="signer-viewer-popup__actions">
            <button
              className="signer-popup-btn signer-popup-btn--sign"
              onClick={onSign}
              type="button"
            >
              <Signature size={18} strokeWidth={1.75} />
              Sign
            </button>
            <button
              className="signer-popup-btn signer-popup-btn--cancel"
              onClick={onCancel}
              type="button"
            >
              <CircleX size={18} strokeWidth={1.75} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * PdfEditorPopup — modal overlay for placing a signature on the PDF
 *
 * Provides a drag-and-drop area for placing a signature.
 * Same size as the PDF viewer popup.
 * Two buttons: Check (confirm) and Cancel.
 * ────────────────────────────────────────────────────────────── */

function PdfEditorPopup({
  pdf,
  onCheck,
  onCancel,
}: {
  pdf: SignerPdfRecord;
  onCheck: () => void;
  onCancel: () => void;
}) {
  // Track signature position (drag state)
  const [sigPos, setSigPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on the signature — start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - sigPos.x,
      y: e.clientY - sigPos.y,
    };
  };

  // Handle mouse move — update signature position while dragging
  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      if (!editorRef.current) return;
      const rect = editorRef.current.getBoundingClientRect();
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Clamp position within the editor bounds
      setSigPos({
        x: Math.max(0, Math.min(newX - rect.left, rect.width - 80)),
        y: Math.max(0, Math.min(newY - rect.top, rect.height - 40)),
      });
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="signer-popup-overlay" onClick={onCancel}>
      <div
        className="signer-popup signer-editor-popup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header showing which document is being edited */}
        <div className="signer-editor-popup__header">
          <span className="signer-editor-popup__header-title">{pdf.title}</span>
          <span className="signer-editor-popup__header-hint">
            Drag the signature to the desired position
          </span>
        </div>

        {/* PDF editor canvas — same layout as viewer */}
        <div className="signer-editor-popup__canvas-area" ref={editorRef}>
          {/* Simulated PDF page */}
          <div className="signer-editor-popup__page">
            <div className="signer-editor-popup__page-lines">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="signer-editor-popup__line" />
              ))}
            </div>

            {/* Draggable signature */}
            <div
              className="signer-editor-popup__signature"
              style={{ left: sigPos.x, top: sigPos.y }}
              onMouseDown={handleMouseDown}
              role="img"
              aria-label="Drag to place your signature"
            >
              <Signature size={24} strokeWidth={1.5} />
              <span>Your Signature</span>
            </div>
          </div>
        </div>

        {/* Action buttons — bottom right */}
        <div className="signer-editor-popup__actions">
          <button
            className="signer-popup-btn signer-popup-btn--check"
            onClick={onCheck}
            type="button"
          >
            <Check size={18} strokeWidth={1.75} />
            Check
          </button>
          <button
            className="signer-popup-btn signer-popup-btn--cancel"
            onClick={onCancel}
            type="button"
          >
            <CircleX size={18} strokeWidth={1.75} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
