/**
 * Homepage.tsx — The requester's main screen after selecting their role.
 *
 * Displays a scrollable list of uploaded PDFs with:
 * - Title, upload date/time, and status for each PDF
 * - Floating upload button (file-up icon)
 * - Delete button per row (with confirmation dialog)
 * - Download button per row (disabled unless status is "Signed")
 * - Sort dropdown (Newest, Oldest, Alphabetical)
 * - Empty state with illustration when no PDFs exist
 * - Loading skeleton while data loads from SQLite
 * - Toast notifications for upload/delete actions
 *
 * Components:
 *   Homepage
 *   ├── Navbar (shared, with back button)
 *   ├── HomepageHeader (title + sort dropdown)
 *   ├── PdfList (scrollable list of PDF rows)
 *   │   └── PdfRow (single PDF: title, date, status, actions)
 *   ├── EmptyState (shown when no PDFs)
 *   ├── LoadingSkeleton (shimmer placeholders while loading)
 *   ├── UploadButton (floating action button)
 *   └── DeleteConfirmDialog (modal confirmation)
 */

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileUp,
  Trash2,
  Download,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { Navbar } from "../shared/Navbar";
import { AlertDialog } from "../ui/alert-dialog";
import { SortDropdown } from "../signer-homepage/components/SortDropdown";
import { usePdfFiles, type PdfRecord } from "../../hooks/usePdfFiles";
import { useAuth } from "../../contexts/AuthContext";
import { formatShortDate, formatTime } from "../../lib/formatDate";
import "./Homepage.css";

/* ──────────────────────────────────────────────────────────────
 * Homepage — top-level component
 * ────────────────────────────────────────────────────────────── */

interface HomepageProps {
  /** Called when the user clicks the back button in the navbar. */
  onBack?: () => void;
}

export function Homepage({ onBack }: HomepageProps) {
  const { user } = useAuth();
  // Pass the requester's email so they only see their own uploaded PDFs.
  // This ensures Requester 1 cannot see Requester 2's uploads (and vice versa).
  const {
    pdfs,
    loading,
    sort,
    setSort,
    upload,
    remove,
    download,
  } = usePdfFiles(user?.email);

  // Track which PDF is pending deletion (for the confirmation dialog).
  const [deleteTarget, setDeleteTarget] = useState<PdfRecord | null>(null);

  // Track which PDF was just downloaded (for the post-download delete prompt).
  // After a successful download, an AlertDialog asks if the user wants to delete the PDF.
  const [downloadDeleteTarget, setDownloadDeleteTarget] = useState<PdfRecord | null>(null);

  // Hidden file input ref — triggered by the floating upload button.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload handler ──────────────────────────────────────────
  // Opens the native file picker filtered to PDF files only.
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Pass the requester's email to link the PDF to their account
      await upload(file, user?.email);
      toast.success("PDF uploaded", {
        description: `"${file.name}" is now pending signing.`,
      });
    } catch {
      toast.error("Upload failed", {
        description: "Something went wrong while uploading your PDF.",
      });
    }

    // Reset the input so the same file can be re-uploaded if needed.
    e.target.value = "";
  };

  // ── Delete handler ──────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget.id);
      toast.success("PDF deleted", {
        description: `"${deleteTarget.title}" has been removed.`,
      });
    } catch {
      toast.error("Delete failed", {
        description: "Something went wrong while deleting the PDF.",
      });
    }

    setDeleteTarget(null);
  };

  // ── Download handler ────────────────────────────────────────
  // After a successful download, shows an AlertDialog prompting
  // the user to delete the PDF. This matches the requirement:
  // "Alert dialog delete PDF prompt after download."
  const handleDownload = async (pdf: PdfRecord) => {
    try {
      await download(pdf.id, pdf.title);
      toast.success("Download started", {
        description: `"${pdf.title}.pdf" is downloading.`,
      });
      // Show delete prompt after successful download
      setDownloadDeleteTarget(pdf);
    } catch {
      toast.error("Download failed", {
        description: "Could not download the PDF file.",
      });
    }
  };

  // ── Delete after download handler ─────────────────────────
  // Deletes the PDF that was just downloaded.
  const handleDownloadDeleteConfirm = async () => {
    if (!downloadDeleteTarget) return;

    try {
      await remove(downloadDeleteTarget.id);
      toast.success("PDF deleted", {
        description: `"${downloadDeleteTarget.title}" has been removed.`,
      });
    } catch {
      toast.error("Delete failed", {
        description: "Something went wrong while deleting the PDF.",
      });
    }

    setDownloadDeleteTarget(null);
  };

  // ── Cancel handler for post-download prompt ──────────────
  // Just closes the dialog without deleting the PDF.
  const handleDownloadDeleteCancel = () => {
    setDownloadDeleteTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="homepage">
      {/* Shared navbar with a back button to return to startup */}
      <Navbar onBack={onBack} />

      <main className="homepage__main">
        {/* Header with title and sort controls */}
        <HomepageHeader sort={sort} onSortChange={setSort} />

        {/* Main content area — either loading skeleton, empty state, or PDF list */}
        <div className="homepage__content">
          {loading ? (
            <LoadingSkeleton />
          ) : pdfs.length === 0 ? (
            <EmptyState />
          ) : (
            <PdfList
              pdfs={pdfs}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
            />
          )}
        </div>
      </main>

      {/* Floating upload button — fixed to bottom-right */}
      <button
        className="homepage__upload-btn"
        onClick={handleUploadClick}
        type="button"
        aria-label="Upload PDF"
      >
        <FileUp size={24} strokeWidth={2} />
      </button>

      {/* Hidden file input — only shown when upload button is clicked */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="homepage__file-input"
        onChange={handleFileChange}
      />

      {/* Delete confirmation dialog — modal overlay */}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Post-download delete prompt — styled AlertDialog with delete/cancel buttons */}
      {downloadDeleteTarget && (
        <AlertDialog
          title="Delete PDF"
          message={`Do you want to delete "${downloadDeleteTarget.title}" after downloading? This action cannot be undone.`}
          icon={<AlertCircle size={24} strokeWidth={1.5} />}
          onClose={handleDownloadDeleteCancel}
          actions={[
            {
              label: "Cancel",
              icon: <X size={16} strokeWidth={2} />,
              onClick: handleDownloadDeleteCancel,
              variant: "ghost",
            },
            {
              label: "Delete",
              icon: <Trash2 size={16} strokeWidth={2} />,
              onClick: handleDownloadDeleteConfirm,
              variant: "danger",
            },
          ]}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * HomepageHeader — title row + sort dropdown
 *
 * Uses the shared SortDropdown component (from signer-homepage)
 * to avoid duplicating the sort dropdown logic and markup.
 * ────────────────────────────────────────────────────────────── */

function HomepageHeader({
  sort,
  onSortChange,
}: {
  sort: "newest" | "oldest" | "alpha";
  onSortChange: (s: "newest" | "oldest" | "alpha") => void;
}) {
  return (
    <div className="homepage__header">
      <h1 className="homepage__heading">Your PDFs</h1>
      <SortDropdown sort={sort} onSortChange={onSortChange} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * PdfList — scrollable container of PDF rows
 * ────────────────────────────────────────────────────────────── */

function PdfList({
  pdfs,
  onDelete,
  onDownload,
}: {
  pdfs: PdfRecord[];
  onDelete: (pdf: PdfRecord) => void;
  onDownload: (pdf: PdfRecord) => void;
}) {
  return (
    <div className="pdf-list">
      {pdfs.map((pdf) => (
        <PdfRow
          key={pdf.id}
          pdf={pdf}
          onDelete={() => onDelete(pdf)}
          onDownload={() => onDownload(pdf)}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * PdfRow — a single PDF entry in the list
 * ────────────────────────────────────────────────────────────── */

function PdfRow({
  pdf,
  onDelete,
  onDownload,
}: {
  pdf: PdfRecord;
  onDelete: () => void;
  onDownload: () => void;
}) {
  // Format the ISO timestamp into a readable local date+time string.
  const formattedDate = formatShortDate(pdf.uploaded_at);
  const formattedTime = formatTime(pdf.uploaded_at);

  // The download button is disabled (grayed) unless status is "Signed".
  const isDownloadable = pdf.status === "Signed";

  return (
    <div className="pdf-row">
      {/* Left side: icon + text info */}
      <div className="pdf-row__info">
        <div className="pdf-row__icon">
          <FileText size={20} strokeWidth={1.5} />
        </div>
        <div className="pdf-row__details">
          <span className="pdf-row__title">{pdf.title}</span>
          <span className="pdf-row__meta">
            {formattedDate} at {formattedTime}
          </span>
        </div>
      </div>

      {/* Right side: status badge + action buttons */}
      <div className="pdf-row__actions">
        {/* Status badge — color changes based on status */}
        <span className={`pdf-row__status pdf-row__status--${pdf.status.toLowerCase()}`}>
          {pdf.status}
        </span>

        {/* Download button — green when Signed, gray/disabled otherwise */}
        <button
          className={`pdf-row__btn pdf-row__btn--download ${
            isDownloadable ? "pdf-row__btn--active" : "pdf-row__btn--disabled"
          }`}
          onClick={isDownloadable ? onDownload : undefined}
          disabled={!isDownloadable}
          type="button"
          aria-label={`Download ${pdf.title}`}
        >
          <Download size={16} strokeWidth={1.75} />
        </button>

        {/* Delete button — always clickable, opens confirmation dialog */}
        <button
          className="pdf-row__btn pdf-row__btn--delete"
          onClick={onDelete}
          type="button"
          aria-label={`Delete ${pdf.title}`}
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * EmptyState — shown when there are no PDFs to display
 * ────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="empty-state">
      {/* Simple SVG illustration — a document with a plus sign */}
      <div className="empty-state__illustration">
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
          <line x1="28" y1="28" x2="52" y2="28" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="36" x2="48" y2="36" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="44" x2="44" y2="44" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
          {/* Plus sign — represents adding a new document */}
          <circle cx="56" cy="56" r="14" fill="var(--color-accent)" opacity="0.9" />
          <line x1="56" y1="49" x2="56" y2="63" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="49" y1="56" x2="63" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="empty-state__text">Upload your first PDF for signing.</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * LoadingSkeleton — shimmer placeholders shown while data loads
 * ────────────────────────────────────────────────────────────── */

function LoadingSkeleton() {
  // Render 5 skeleton rows to give the impression of loading content.
  return (
    <div className="pdf-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-row__icon skeleton-shimmer" />
          <div className="skeleton-row__text">
            <div className="skeleton-row__title skeleton-shimmer" />
            <div className="skeleton-row__meta skeleton-shimmer" />
          </div>
          <div className="skeleton-row__badge skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * DeleteConfirmDialog — modal overlay for confirming deletion
 * Uses alert-backdrop/alert-card classes to inherit startup styling.
 * ────────────────────────────────────────────────────────────── */

function DeleteConfirmDialog({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="alert-backdrop" onClick={onCancel}>
      <div className="alert-card" onClick={(e) => e.stopPropagation()}>
        <div className="alert-card__icon">
          <AlertCircle size={24} strokeWidth={1.5} />
        </div>
        <h2 className="alert-card__title">Delete PDF</h2>
        <p className="alert-card__message">
          Are you sure you want to delete <strong>"{title}"</strong>? This
          action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="alert-card__button"
            onClick={onCancel}
            type="button"
            style={{
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            className="alert-card__button"
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
