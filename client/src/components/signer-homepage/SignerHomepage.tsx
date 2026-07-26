/**
 * SignerHomepage.tsx — The signer's main screen after selecting their role.
 *
 * Displays a scrollable list of PDFs waiting for signature with:
 * - Title, push date/time, and status for each PDF
 * - E-sign button per row (file-pen-line icon)
 * - PDF viewer popup (glass/blur overlay, 70% viewer + 30% details)
 * - PDF editor popup (left: 70% PDF canvas, right: 30% sidebar with column buttons)
 * - Sort dropdown with arrow-up-down icon (Recently Uploaded, Oldest, Alphabetical)
 * - Empty state with illustration when no PDFs exist
 *
 * Architecture:
 *   SignerHomepage
 *   ├── Navbar (shared, with back button)
 *   ├── Header with SortDropdown (title + sort controls)
 *   ├── LoadingSkeleton (shown while PDFs load from API)
 *   ├── SignerPdfList (scrollable list of PDF rows)
 *   │   └── SignerPdfRow (single PDF: icon, title, date, status, e-sign button)
 *   ├── SignerEmptyState (shown when no PDFs)
 *   ├── PdfViewerPopup (modal: iframe PDF preview + details + sign/cancel)
 *   │   └── PopupOverlay + ActionButtons (reusable)
 *   └── PdfEditorPopup (modal: left PDF canvas + right sidebar with drag signature)
 *       └── PopupOverlay + ActionButtons + ConfirmDialog + useSignatureDrag (reusable)
 *       └── PreviewPopup (debug: shows combined PDF before confirming)
 */

import { useState, useRef } from "react";
import {
  FilePenLine,
  FileText,
  Signature,
  CircleX,
  Check,
  FilePlus,
  EyeOff,
} from "lucide-react";
import { Navbar } from "../shared/Navbar";
import {
  useSignerPdfs,
  type SignerPdfRecord,
} from "../../hooks/useSignerPdfs";
import { usePdfRenderer } from "../../hooks/usePdfRenderer";
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
  const { pdfs, loading, sort, setSort, signPdf } = useSignerPdfs();

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
  // Sends the signature to the backend to combine with the PDF.
  // signatureFile: the uploaded signature image
  // posX, posY: position in PDF points (not pixels or percentages)
  const handleCheckClick = async (
    signatureFile: File,
    posX: number,
    posY: number
  ) => {
    if (!editorTarget) return;
    try {
      await signPdf(editorTarget.id, signatureFile, posX, posY);
      setEditorTarget(null);
    } catch (err) {
      console.error("Signing failed:", err);
    }
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

        {/* Main content — loading, empty state, or PDF list */}
        <div className="signer-homepage__content">
          {loading ? (
            <LoadingSkeleton />
          ) : pdfs.length === 0 ? (
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
 * LoadingSkeleton — shimmer placeholders shown while data loads
 * ────────────────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="signer-pdf-list">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="signer-skeleton-row">
          <div className="signer-skeleton-row__icon signer-skeleton-shimmer" />
          <div className="signer-skeleton-row__text">
            <div className="signer-skeleton-row__title signer-skeleton-shimmer" />
            <div className="signer-skeleton-row__meta signer-skeleton-shimmer" />
          </div>
          <div className="signer-skeleton-row__badge signer-skeleton-shimmer" />
        </div>
      ))}
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
 *   - Left side (70%): Real PDF rendered via iframe (scrollable)
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

  // URL to fetch the actual PDF file from the backend
  const pdfUrl = `/api/pdfs/${pdf.id}/download`;

  return (
    <PopupOverlay onClose={onCancel}>
      <div className="signer-popup signer-viewer-popup">
        {/* Left side — PDF viewer (70% width, scrollable) */}
        <div className="signer-viewer-popup__pdf-area">
          <iframe
            src={pdfUrl}
            className="signer-viewer-popup__iframe"
            title={`Preview of ${pdf.title}`}
          />
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

          {/* Action buttons — Sign (green) and Cancel (red), centered */}
          <div className="signer-viewer-popup__actions">
            <ActionButtons>
              <ActionButton
                icon={<Signature size={18} strokeWidth={1.75} />}
                label="Sign"
                tooltip="Sign this document"
                color="green"
                onClick={onSign}
                filled
              />
              <ActionButton
                icon={<CircleX size={18} strokeWidth={1.75} />}
                label="Cancel"
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
 * Uses pdf.js to render the PDF to a canvas (not an iframe) so we
 * have exact control over the rendering and can accurately map
 * pixel positions to PDF coordinates.
 *
 * Layout (per requirements):
 *   Left side (flex: 7): PDF canvas — takes up most of the window
 *   Right side (flex: 3): Document title, hint text, and action buttons
 *   Buttons are stacked vertically (column format) on the right side.
 *
 * Features:
 *   - Real PDF rendered via canvas (pdf.js) with draggable signature overlay
 *   - Upload e-signature button (FilePlus icon, indigo)
 *   - Preview button (indigo, EyeOff icon)
 *   - Check button (green) with inline confirmation dialog
 *   - Cancel button (red) to abort signing
 *   - Uses useSignatureDrag hook for smooth drag-and-drop
 *   - Sends signature + position to backend on confirm
 * ────────────────────────────────────────────────────────────── */

/*
 * Signature container padding/border offsets (in CSS pixels).
 * The signature element has padding: 8px 14px and border: 2px dashed.
 * When the user drags the signature, sigPos tracks the outer container's
 * top-left corner. But the actual image inside starts after the border
 * and padding. We subtract these offsets so the PDF signature matches
 * the visual position in the editor.
 */
const SIG_PADDING_X = 16; // border(2) + padding-left(14)
const SIG_PADDING_Y = 10; // border(2) + padding-top(8)

function PdfEditorPopup({
  pdf,
  onCheck,
  onCancel,
}: {
  pdf: SignerPdfRecord;
  onCheck: (signatureFile: File, posX: number, posY: number) => void;
  onCancel: () => void;
}) {
  // Ref to the PDF page element (used by the drag hook AND the canvas renderer)
  const pageRef = useRef<HTMLDivElement>(null);

  // Hidden file input ref for signature upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop hook — manages signature position and mouse events
  const { sigPos, handleDragStart, centerPosition } =
    useSignatureDrag(pageRef);

  // Canvas-based PDF renderer — gives us exact pixel-to-PDF coordinate mapping
  const pdfUrl = `/api/pdfs/${pdf.id}/download`;
  const { canvasRef, renderInfo } = usePdfRenderer(pdfUrl, pageRef);

  // The uploaded signature file
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  // Object URL for previewing the uploaded signature
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // Confirmation state: when true, shows "Are you sure?" instead of the check button
  const [showConfirm, setShowConfirm] = useState(false);

  // Preview state: blob URL of the combined PDF for debugging
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Upload e-signature button handler ────────────────────────
  // Opens the native file picker for image files (PNG, JPEG).
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // When a signature file is selected, store it and create a preview URL.
  // Also center the signature on the canvas for accurate initial placement.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignatureFile(file);
    // Create a temporary URL so the browser can display the image
    const previewUrl = URL.createObjectURL(file);
    setSignaturePreview(previewUrl);
    // Center the signature on the canvas once it's rendered
    centerPosition();
  };

  /**
   * Convert the signature's pixel position (relative to the page container)
   * into PDF point coordinates. Accounts for the signature container's
   * padding and border so the PDF signature matches the visual position.
   *
   * The canvas renderer provides:
   *   - renderInfo.offsetX/Y: where the PDF content starts in the container
   *   - renderInfo.scale: the factor used to resize the PDF to fit the container
   *
   * So: pdfX = (containerPixelX - offsetX) / scale
   *     pdfY = (containerPixelY - offsetY) / scale
   */
  const convertToPdfCoords = (x: number, y: number) => {
    if (!renderInfo) return { posX: 0, posY: 0 };
    const posX = (x + SIG_PADDING_X - renderInfo.offsetX) / renderInfo.scale;
    const posY = (y + SIG_PADDING_Y - renderInfo.offsetY) / renderInfo.scale;
    return { posX, posY };
  };

  // ── Preview button handler ───────────────────────────────────
  // Calls the backend preview endpoint to generate a combined PDF
  // with the signature embedded. Does NOT save to disk or update SQLite.
  const handlePreview = async () => {
    if (!signatureFile || !renderInfo) {
      window.alert("Please upload an e-signature image first.");
      return;
    }

    setPreviewLoading(true);
    try {
      const { posX, posY } = convertToPdfCoords(sigPos.x, sigPos.y);

      const formData = new FormData();
      formData.append("signature", signatureFile);
      formData.append("posX", String(posX));
      formData.append("posY", String(posY));

      const res = await fetch(`/api/pdfs/${pdf.id}/preview`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Preview failed");

      const blob = await res.blob();
      // Revoke previous preview URL to avoid memory leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview generation failed:", err);
      window.alert("Failed to generate preview. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Close the preview popup
  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // Called when the user confirms they want to sign.
  // Converts the signature's pixel position to PDF point coordinates
  // and sends it to the backend.
  const handleConfirmSign = () => {
    if (!signatureFile || !renderInfo) return;

    setShowConfirm(false);

    const { posX, posY } = convertToPdfCoords(sigPos.x, sigPos.y);
    onCheck(signatureFile, posX, posY);
  };

  // Check button handler — shows alert if no signature uploaded, otherwise opens confirmation
  const handleCheckClick = () => {
    if (!signatureFile) {
      window.alert("Please upload an e-signature image before confirming.");
      return;
    }
    setShowConfirm(true);
  };

  return (
    <PopupOverlay onClose={onCancel}>
      <div className="signer-popup signer-editor-popup">
        {/* Left side — PDF canvas (takes up most of the window) */}
        <div className="signer-editor-popup__pdf-area">
          {/* pageRef is shared between the drag hook and the canvas renderer */}
          <div className="signer-editor-popup__page" ref={pageRef}>
            {/* PDF rendered to canvas via pdf.js — gives us exact coordinate mapping */}
            <canvas
              ref={canvasRef}
              className="signer-editor-popup__canvas"
            />

            {/* Draggable signature element — only shown after uploading a signature */}
            {signatureFile && signaturePreview && (
              <div
                className="signer-editor-popup__signature"
                style={{ left: sigPos.x, top: sigPos.y }}
                onMouseDown={handleDragStart}
                role="img"
                aria-label="Drag to place your signature"
              >
                <img
                  src={signaturePreview}
                  alt="Your signature"
                  className="signer-editor-popup__signature-img"
                  draggable={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right side — document info + action buttons in column format */}
        <div className="signer-editor-popup__sidebar">
          {/* Document title */}
          <div className="signer-editor-popup__sidebar-header">
            <span className="signer-editor-popup__sidebar-title">{pdf.title}</span>
            <span className="signer-editor-popup__sidebar-hint">
              {signatureFile
                ? "Drag the signature to the desired position"
                : "Upload an e-signature image first"}
            </span>
          </div>

          {/* Hidden file input for signature upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="signer-editor-popup__file-input"
            onChange={handleFileChange}
          />

          {/* Action buttons — stacked vertically in column format */}
          <div className="signer-editor-popup__sidebar-actions">
            {/* Upload e-signature button — full width, indigo */}
            <button
              className="signer-editor-popup__upload-btn"
              onClick={handleUploadClick}
              type="button"
              title="Upload e-signature"
              aria-label="Upload e-signature image"
            >
              <FilePlus size={16} strokeWidth={2} />
              <span>Upload Signature</span>
            </button>

            {/* Preview button — indigo, full width */}
            <ActionButton
              icon={<EyeOff size={18} strokeWidth={1.75} />}
              label="Preview"
              tooltip="Preview how the signed PDF will look"
              color="indigo"
              onClick={handlePreview}
              disabled={!signatureFile || previewLoading}
            />

            {/* Confirmation dialog or check/cancel buttons */}
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
                  label="Sign"
                  tooltip="Confirm signature"
                  color="green"
                  onClick={handleCheckClick}
                  filled
                />
                <ActionButton
                  icon={<CircleX size={18} strokeWidth={1.75} />}
                  label="Cancel"
                  tooltip="Cancel signing"
                  color="red"
                  onClick={onCancel}
                />
              </ActionButtons>
            )}
          </div>
        </div>
      </div>

      {/* Preview popup — shows the combined PDF in an iframe for debugging */}
      {previewUrl && (
        <div className="signer-preview-overlay" onClick={closePreview}>
          <div
            className="signer-preview-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="signer-preview-popup__header">
              <span className="signer-preview-popup__title">
                Preview — {pdf.title}
              </span>
              <button
                className="signer-preview-popup__close"
                onClick={closePreview}
                type="button"
                aria-label="Close preview"
              >
                <CircleX size={18} strokeWidth={1.75} />
              </button>
            </div>
            <iframe
              src={previewUrl}
              className="signer-preview-popup__iframe"
              title={`Preview of signed ${pdf.title}`}
            />
          </div>
        </div>
      )}
    </PopupOverlay>
  );
}
