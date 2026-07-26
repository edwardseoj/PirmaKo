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
import { AlertDialog } from "../ui/alert-dialog";
import {
  useSignerPdfs,
  type SignerPdfRecord,
} from "../../hooks/useSignerPdfs";
import { usePdfRenderer } from "../../hooks/usePdfRenderer";
import { apiFetch } from "../../lib/api";
import { formatShortDate, formatLongDate, formatTime } from "../../lib/formatDate";
import { PopupOverlay } from "./components/PopupOverlay";
import { ActionButtons, ActionButton } from "./components/ActionButtons";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { SortDropdown } from "./components/SortDropdown";
import { useSignatureDrag } from "./hooks/useSignatureDrag";
import "./SignerHomepage.css";

interface SignerHomepageProps {

  onBack?: () => void;
}

export function SignerHomepage({ onBack }: SignerHomepageProps) {
  const { pdfs, loading, sort, setSort, signPdf } = useSignerPdfs();

  const [viewerTarget, setViewerTarget] = useState<SignerPdfRecord | null>(null);

  const [editorTarget, setEditorTarget] = useState<SignerPdfRecord | null>(null);

  const handleESignClick = (pdf: SignerPdfRecord) => {
    setViewerTarget(pdf);
  };

  const handleSignClick = () => {
    if (!viewerTarget) return;
    setEditorTarget(viewerTarget);
    setViewerTarget(null);
  };

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

  const handleCancelClick = () => {
    setViewerTarget(null);
    setEditorTarget(null);
  };

  return (
    <div className="signer-homepage">
      <Navbar onBack={onBack} />

      <main className="signer-homepage__main">
        <div className="signer-header">
          <h1 className="signer-header__heading">Documents for Signing</h1>
          <SortDropdown sort={sort} onSortChange={setSort} />
        </div>

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

      {viewerTarget && (
        <PdfViewerPopup
          pdf={viewerTarget}
          onSign={handleSignClick}
          onCancel={handleCancelClick}
        />
      )}

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

function SignerPdfRow({
  pdf,
  onESign,
}: {
  pdf: SignerPdfRecord;
  onESign: () => void;
}) {

  const formattedDate = formatShortDate(pdf.uploaded_at);
  const formattedTime = formatTime(pdf.uploaded_at);

  return (
    <div className="signer-pdf-row">
      <div className="signer-pdf-row__info">
        <div className="signer-pdf-row__icon">
          <FileText size={20} strokeWidth={1.5} />
        </div>
        <div className="signer-pdf-row__details">
          <span className="signer-pdf-row__title">{pdf.title}</span>
          <span className="signer-pdf-row__meta">
            Pushed {formattedDate} at {formattedTime}
          </span>
          {pdf.requester_email && (
            <span className="signer-pdf-row__requester">
              From: {pdf.requester_email}
            </span>
          )}
        </div>
      </div>

      <div className="signer-pdf-row__actions">
        <span
          className={`signer-pdf-row__status signer-pdf-row__status--${pdf.status.toLowerCase()}`}
        >
          {pdf.status}
        </span>

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

function SignerEmptyState() {
  return (
    <div className="signer-empty-state">
      <div className="signer-empty-state__illustration">
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

function PdfViewerPopup({
  pdf,
  onSign,
  onCancel,
}: {
  pdf: SignerPdfRecord;
  onSign: () => void;
  onCancel: () => void;
}) {

  const formattedDate = formatLongDate(pdf.uploaded_at);
  const formattedTime = formatTime(pdf.uploaded_at);

  const pdfUrl = `/api/pdfs/${pdf.id}/download`;

  return (
    <PopupOverlay onClose={onCancel}>
      <div className="signer-popup signer-viewer-popup">
        <div className="signer-viewer-popup__pdf-area">
          <iframe
            src={pdfUrl}
            className="signer-viewer-popup__iframe"
            title={`Preview of ${pdf.title}`}
          />
        </div>

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

          {pdf.requester_email && (
            <div className="signer-viewer-popup__info">
              <span className="signer-viewer-popup__label">Requested by</span>
              <span className="signer-viewer-popup__value signer-viewer-popup__requester">
                {pdf.requester_email}
              </span>
            </div>
          )}

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

const SIG_PADDING_X = 16;

const SIG_PADDING_Y = 10;

function PdfEditorPopup({
  pdf,
  onCheck,
  onCancel,
}: {
  pdf: SignerPdfRecord;
  onCheck: (signatureFile: File, posX: number, posY: number) => void;
  onCancel: () => void;
}) {

  const pageRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sigPos, handleDragStart, centerPosition } =
    useSignatureDrag(pageRef);

  const pdfUrl = `/api/pdfs/${pdf.id}/download`;
  const { canvasRef, renderInfo } = usePdfRenderer(pdfUrl, pageRef);

  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignatureFile(file);

    const previewUrl = URL.createObjectURL(file);
    setSignaturePreview(previewUrl);

    centerPosition();
  };

  const convertToPdfCoords = (x: number, y: number) => {
    if (!renderInfo) return { posX: 0, posY: 0 };
    const posX = (x + SIG_PADDING_X - renderInfo.offsetX) / renderInfo.scale;
    const posY = (y + SIG_PADDING_Y - renderInfo.offsetY) / renderInfo.scale;
    return { posX, posY };
  };

  const handlePreview = async () => {
    if (!signatureFile || !renderInfo) {
      setAlert({
        title: "Signature Required",
        message: "Please upload an e-signature image first.",
      });
      return;
    }

    setPreviewLoading(true);
    try {
      const { posX, posY } = convertToPdfCoords(sigPos.x, sigPos.y);

      const formData = new FormData();
      formData.append("signature", signatureFile);
      formData.append("posX", String(posX));
      formData.append("posY", String(posY));

      const res = await apiFetch(`/api/pdfs/${pdf.id}/preview`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Preview failed");

      const blob = await res.blob();

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview generation failed:", err);
      setAlert({
        title: "Preview Failed",
        message: "Failed to generate preview. Please try again.",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleConfirmSign = () => {
    if (!signatureFile || !renderInfo) return;

    setShowConfirm(false);

    const { posX, posY } = convertToPdfCoords(sigPos.x, sigPos.y);
    onCheck(signatureFile, posX, posY);
  };

  const handleCheckClick = () => {
    if (!signatureFile) {
      setAlert({
        title: "Signature Required",
        message: "Please upload an e-signature image before confirming.",
      });
      return;
    }
    setShowConfirm(true);
  };

  return (
    <PopupOverlay onClose={onCancel}>
      <div className="signer-popup signer-editor-popup">
        <div className="signer-editor-popup__pdf-area">
          <div className="signer-editor-popup__page" ref={pageRef}>
            <canvas
              ref={canvasRef}
              className="signer-editor-popup__canvas"
            />

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

        <div className="signer-editor-popup__sidebar">
          <div className="signer-editor-popup__sidebar-header">
            <span className="signer-editor-popup__sidebar-title">{pdf.title}</span>
            <span className="signer-editor-popup__sidebar-hint">
              {signatureFile
                ? "Drag the signature to the desired position"
                : "Upload an e-signature image first"}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="signer-editor-popup__file-input"
            onChange={handleFileChange}
          />

          <div className="signer-editor-popup__sidebar-actions">
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

            <ActionButton
              icon={<EyeOff size={18} strokeWidth={1.75} />}
              label="Preview"
              tooltip="Preview how the signed PDF will look"
              color="indigo"
              onClick={handlePreview}
              disabled={!signatureFile || previewLoading}
            />

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

      {alert && (
        <AlertDialog
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </PopupOverlay>
  );
}
