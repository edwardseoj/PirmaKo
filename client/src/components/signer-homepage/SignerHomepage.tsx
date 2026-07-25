/**
 * SignerHomepage.tsx — The signer's main screen after selecting their role.
 *
 * Displays a scrollable list of PDFs waiting for signature with:
 * - Title, push date/time, and status for each PDF
 * - E-sign button per row (file-pen-line icon)
 * - PDF viewer popup (glass/blur overlay, 70% viewer + 30% details)
 * - PDF editor popup (drag-and-drop signature placement)
 * - Sort dropdown with funnel icon (Recently Uploaded, Oldest, Alphabetical)
 * - Empty state with illustration when no PDFs exist
 *
 * Architecture:
 *   SignerHomepage
 *   ├── Navbar (shared, with back button)
 *   ├── Header with SortDropdown (title + sort controls)
 *   ├── SignerPdfList (scrollable list of PDF rows)
 *   │   └── SignerPdfRow (single PDF: icon, title, date, status, e-sign button)
 *   ├── SignerEmptyState (shown when no PDFs)
 *   ├── PdfViewerPopup (modal: scrollable PDF preview + details + sign/cancel)
 *   │   └── PopupOverlay + ActionButtons (reusable)
 *   └── PdfEditorPopup (modal: drag-and-drop signature + confirm/cancel)
 *       └── PopupOverlay + ActionButtons + ConfirmDialog + useSignatureDrag (reusable)
 */

import { useState, useRef } from "react";
import {
  FilePenLine,
  FileText,
  Signature,
  CircleX,
  Check,
  FilePlus,
} from "lucide-react";
import { Navbar } from "../shared/Navbar";
import {
  useSignerPdfs,
  type SignerPdfRecord,
} from "../../hooks/useSignerPdfs";
import { PopupOverlay } from "./components/PopupOverlay";
import { ActionButtons, ActionButton } from "./components/ActionButtons";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { SortDropdown } from "./components/SortDropdown";
import { useSignatureDrag } from "./hooks/useSignatureDrag";
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
  };

  // ── Sign button handler (inside viewer popup) ────────────────
  // Closes the viewer and opens the editor for signature placement.
  const handleSignClick = () => {
    if (!viewerTarget) return;
    setEditorTarget(viewerTarget);
    setViewerTarget(null);
  };

  // ── Check button handler (inside editor popup) ───────────────
  // Marks the PDF as signed and closes the editor.
  const handleCheckClick = () => {
    if (!editorTarget) return;
    signPdf(editorTarget.id);
    setEditorTarget(null);
  };

  // ── Cancel button handler ────────────────────────────────────
  // Closes whichever popup is open.
  const handleCancelClick = () => {
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
        <div className="signer-header">
          <h1 className="signer-header__heading">Documents for Signing</h1>
          <SortDropdown sort={sort} onSortChange={setSort} />
        </div>

        {/* Main content — empty state or PDF list */}
        <div className="signer-homepage__content">
          {pdfs.length === 0 ? (
            <SignerEmptyState />
          ) : (
            <SignerPdfList pdfs={pdfs} onESign={handleESignClick} />
          )}
        </div>
      </main>

      {/* PDF Viewer Popup — glass/blur overlay, scrollable PDF area */}
      {viewerTarget && (
        <PdfViewerPopup
          pdf={viewerTarget}
          onSign={handleSignClick}
          onCancel={handleCancelClick}
        />
      )}

      {/* PDF Editor Popup — signature drag-and-drop with confirmation */}
      {editorTarget && (
        <PdfEditorPopup
          pdf={editorTarget}
          onCheck={handleCheckClick}
          onCancel={handleCancelClick}
        />
      )}
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
 *   - Left side (70%): PDF viewer area (scrollable, placeholder for now)
 *   - Right side (30%): PDF details + Sign / Cancel buttons
 *   - Background: glass/blur effect via PopupOverlay
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
    <PopupOverlay onClose={onCancel}>
      <div className="signer-popup signer-viewer-popup">
        {/* Left side — PDF viewer (70% width, scrollable) */}
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

          {/* Action buttons — Sign (green) and Cancel (red) */}
          <div className="signer-viewer-popup__actions">
            <ActionButtons>
              <ActionButton
                icon={<Signature size={18} strokeWidth={1.75} />}
                tooltip="Sign this document"
                color="green"
                onClick={onSign}
                filled
              />
              <ActionButton
                icon={<CircleX size={18} strokeWidth={1.75} />}
                tooltip="Cancel signing"
                color="red"
                onClick={onCancel}
              />
            </ActionButtons>
          </div>
        </div>
      </div>
    </PopupOverlay>
  );
}

/* ──────────────────────────────────────────────────────────────
 * PdfEditorPopup — modal overlay for placing a signature on the PDF
 *
 * Features:
 *   - A scrollable PDF page with a draggable signature element
 *   - Upload e-signature button (leftmost, FilePlus icon, indigo)
 *   - Check button (green) with inline confirmation dialog
 *   - Cancel button (red) to abort signing
 *   - Uses useSignatureDrag hook for smooth drag-and-drop
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
  // Ref to the PDF page element (used by the drag hook for coordinate math)
  const pageRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop hook — manages signature position and mouse events
  const { sigPos, handleDragStart, resetPosition } = useSignatureDrag(pageRef);

  // Confirmation state: when true, shows "Are you sure?" instead of the check button
  const [showConfirm, setShowConfirm] = useState(false);

  // Handle the upload e-signature button click (placeholder — no file picker yet)
  const handleUploadClick = () => {
    resetPosition();
  };

  // Called when the user confirms they want to sign
  const handleConfirmSign = () => {
    setShowConfirm(false);
    onCheck();
  };

  return (
    <PopupOverlay onClose={onCancel}>
      <div className="signer-popup signer-editor-popup">
        {/* Header showing which document is being edited */}
        <div className="signer-editor-popup__header">
          <span className="signer-editor-popup__header-title">{pdf.title}</span>
          <span className="signer-editor-popup__header-hint">
            Drag the signature to the desired position
          </span>
        </div>

        {/* PDF editor canvas — scrollable area with the simulated PDF page */}
        <div className="signer-editor-popup__canvas-area">
          <div className="signer-editor-popup__page" ref={pageRef}>
            {/* Simulated text lines on the page */}
            <div className="signer-editor-popup__page-lines">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="signer-editor-popup__line" />
              ))}
            </div>

            {/* Draggable signature element — position is managed by the hook */}
            <div
              className="signer-editor-popup__signature"
              style={{ left: sigPos.x, top: sigPos.y }}
              onMouseDown={handleDragStart}
              role="img"
              aria-label="Drag to place your signature"
            >
              <Signature size={24} strokeWidth={1.5} />
              <span>Your Signature</span>
            </div>
          </div>
        </div>

        {/* Action buttons — upload (left) and check/cancel (right) */}
        <div className="signer-editor-popup__actions">
          {/* Upload e-signature button — leftmost, indigo */}
          <button
            className="signer-editor-popup__upload-btn"
            onClick={handleUploadClick}
            type="button"
            title="Upload e-signature"
            aria-label="Upload e-signature image"
          >
            <FilePlus size={16} strokeWidth={2} />
          </button>

          {/* Right side: check/cancel, or confirmation dialog */}
          {showConfirm ? (
            <ConfirmDialog
              message="Sign this document?"
              onConfirm={handleConfirmSign}
              onCancel={() => setShowConfirm(false)}
            />
          ) : (
            <ActionButtons>
              <ActionButton
                icon={<Check size={18} strokeWidth={2} />}
                tooltip="Confirm signature"
                color="green"
                onClick={() => setShowConfirm(true)}
                filled
              />
              <ActionButton
                icon={<CircleX size={18} strokeWidth={1.75} />}
                tooltip="Cancel signing"
                color="red"
                onClick={onCancel}
              />
            </ActionButtons>
          )}
        </div>
      </div>
    </PopupOverlay>
  );
}
