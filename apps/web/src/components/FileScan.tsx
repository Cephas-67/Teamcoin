import { useEffect, useState } from "react";
import { Upload, FileText, Image as ImageIcon, ShieldCheck, Loader2, X, Eye } from "lucide-react";
import { sha256OfFile } from "@gandehou/ledger";
import { cn } from "../lib/cn";

type Props = {
  label: string;
  hint?: string;
  accept?: string;
  onChange: (file: File | null, hash: string | null) => void;
};

// Composant qui combine upload + preview + scan (hash SHA-256 calculé en live).
// Donne au user un feedback immédiat : "voici ton fichier, voici son empreinte".
export function FileScan({ label, hint, accept = ".pdf,image/*", onChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = async (f: File | null) => {
    setFile(f);
    setHash(null);
    onChange(f, null);
    if (!f) return;
    setScanning(true);
    try {
      const h = await sha256OfFile(f);
      setHash(h);
      onChange(f, h);
    } finally {
      setScanning(false);
    }
  };

  const reset = () => {
    setFile(null);
    setHash(null);
    setScanning(false);
    onChange(null, null);
  };

  if (!file) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        {hint && <p className="text-xs text-muted mb-2">{hint}</p>}
        <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-md border-2 border-dashed border-border-strong cursor-pointer hover:bg-surface-2 hover:border-accent transition-colors">
          <Upload className="w-6 h-6 text-muted" />
          <span className="text-sm font-medium">Choisir un fichier</span>
          <span className="text-xs text-muted">PDF ou image · max 20 Mo</span>
          <input type="file" accept={accept} className="hidden" aria-label={label} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>
    );
  }

  const kind = fileKind(file);

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        {/* En-tête fichier */}
        <div className="flex items-center gap-3 p-3 border-b border-border">
          <div className="w-10 h-10 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0">
            {kind === "image" && <ImageIcon className="w-4 h-4 text-muted" />}
            {kind === "pdf" && <FileText className="w-4 h-4 text-muted" />}
            {kind === "other" && <FileText className="w-4 h-4 text-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-text px-2 py-1 rounded-md hover:bg-surface-2"
            aria-label="Aperçu"
          >
            <Eye className="w-3.5 h-3.5" />
            {previewOpen ? "Masquer" : "Aperçu"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center w-7 h-7 text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
            aria-label="Retirer le fichier"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aperçu */}
        {previewOpen && previewUrl && (
          <div className="bg-surface-2 border-b border-border p-3 max-h-[420px] overflow-auto">
            {kind === "image" && (
              <img
                src={previewUrl}
                alt="Aperçu document"
                className="max-h-[400px] w-auto mx-auto rounded-md border border-border"
              />
            )}
            {kind === "pdf" && (
              <iframe
                src={previewUrl}
                title="Aperçu PDF"
                className="w-full h-[400px] rounded-md border border-border bg-white"
              />
            )}
            {kind === "other" && (
              <p className="text-sm text-muted text-center py-6">Aperçu non disponible pour ce type de fichier.</p>
            )}
          </div>
        )}

        {/* Scan / Hash */}
        <div className={cn(
          "px-3 py-2.5 text-xs",
          scanning ? "bg-info/5" : hash ? "bg-accent/5" : "",
        )}>
          {scanning && (
            <div className="flex items-center gap-2 text-info">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scan en cours · calcul SHA-256…</span>
            </div>
          )}
          {hash && !scanning && (
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-accent font-medium mb-0.5">Empreinte calculée</div>
                <div className="font-mono text-[11px] text-muted break-all">{hash}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fileKind(file: File): "image" | "pdf" | "other" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "other";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} ko`;
  return `${(n / 1024 / 1024).toFixed(2)} Mo`;
}
