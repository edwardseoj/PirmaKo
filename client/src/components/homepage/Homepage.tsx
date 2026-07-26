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

interface HomepageProps {

  onBack?: () => void;
}

export function Homepage({ onBack }: HomepageProps) {
  const { user } = useAuth();

  const {
    pdfs,
    loading,
    sort,
    setSort,
    upload,
    remove,
    download,
  } = usePdfFiles(user?.email);

  const [deleteTarget, setDeleteTarget] = useState<PdfRecord | null>(null);

  const [downloadDeleteTarget, setDownloadDeleteTarget] = useState<PdfRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {

      await upload(file, user?.email);
      toast.success("PDF uploaded", {
        description: `"${file.name}" is now pending signing.`,
      });
    } catch {
      toast.error("Upload failed", {
        description: "Something went wrong while uploading your PDF.",
      });
    }

    e.target.value = "";
  };

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

  const handleDownload = async (pdf: PdfRecord) => {
    try {
      await download(pdf.id, pdf.title);
      toast.success("Download started", {
        description: `"${pdf.title}.pdf" is downloading.`,
      });

      setDownloadDeleteTarget(pdf);
    } catch {
      toast.error("Download failed", {
        description: "Could not download the PDF file.",
      });
    }
  };

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

  const handleDownloadDeleteCancel = () => {
    setDownloadDeleteTarget(null);
  };

  return (
    <div className="homepage">
      <Navbar onBack={onBack} />

      <main className="homepage__main">
        <HomepageHeader sort={sort} onSortChange={setSort} />

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

      <button
        className="homepage__upload-btn"
        onClick={handleUploadClick}
        type="button"
        aria-label="Upload PDF"
      >
        <FileUp size={24} strokeWidth={2} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="homepage__file-input"
        onChange={handleFileChange}
      />

      {deleteTarget && (
        <DeleteConfirmDialog
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

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

function PdfRow({
  pdf,
  onDelete,
  onDownload,
}: {
  pdf: PdfRecord;
  onDelete: () => void;
  onDownload: () => void;
}) {

  const formattedDate = formatShortDate(pdf.uploaded_at);
  const formattedTime = formatTime(pdf.uploaded_at);

  const isDownloadable = pdf.status === "Signed";

  return (
    <div className="pdf-row">
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

      <div className="pdf-row__actions">
        <span className={`pdf-row__status pdf-row__status--${pdf.status.toLowerCase()}`}>
          {pdf.status}
        </span>

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

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__illustration">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
          <line x1="28" y1="28" x2="52" y2="28" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="36" x2="48" y2="36" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="44" x2="44" y2="44" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="56" cy="56" r="14" fill="var(--color-accent)" opacity="0.9" />
          <line x1="56" y1="49" x2="56" y2="63" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="49" y1="56" x2="63" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="empty-state__text">Upload your first PDF for signing.</p>
    </div>
  );
}

function LoadingSkeleton() {

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
