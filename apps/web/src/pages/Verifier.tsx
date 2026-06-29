import { useState } from "react";
import { toast } from "sonner";

type VerifyResponse =
  | { status: "valid"; acte: { id: string; parcelle_ref: string; created_at: number }; computedHash: string }
  | { status: "invalid"; reason: string; computedHash: string };

export default function Verifier() {
  const [document, setDocument] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!document || !audio) return toast.error("Document et audio requis");
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("document", document);
    form.append("audio", audio);

    const res = await fetch("/api/verify", { method: "POST", body: form });
    const data: VerifyResponse = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="container py-12 max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-bold">Vérifier un document</h1>
      <p className="text-muted-foreground">
        Téléverse le document et l'audio. KandoFoncier recalcule leur hash et le compare au ledger.
      </p>

      <Field label="Document à vérifier">
        <input type="file" aria-label="Document" accept=".pdf,image/*" onChange={(e) => setDocument(e.target.files?.[0] ?? null)} />
      </Field>

      <Field label="Audio de consentement original">
        <input type="file" aria-label="Audio original" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] ?? null)} />
      </Field>

      <button
        type="button"
        onClick={verify}
        disabled={loading}
        className="w-full py-4 rounded-lg bg-accent text-accent-foreground font-semibold text-lg disabled:opacity-50"
      >
        {loading ? "Vérification…" : "Vérifier"}
      </button>

      {result?.status === "valid" && (
        <div className="p-6 rounded-lg bg-success/10 border border-success/30 space-y-2">
          <p className="font-bold text-success text-xl">✅ Document authentique</p>
          <p className="text-sm">Acte ID : <span className="font-mono">{result.acte.id}</span></p>
          <p className="text-sm">Parcelle : {result.acte.parcelle_ref}</p>
          <p className="text-xs font-mono break-all text-muted-foreground">Hash : {result.computedHash}</p>
        </div>
      )}

      {result?.status === "invalid" && (
        <div className="p-6 rounded-lg bg-danger/10 border border-danger/40 space-y-2">
          <p className="font-bold text-danger text-xl">🚨 Alerte Rouge</p>
          <p className="text-sm">{result.reason}</p>
          <p className="text-xs font-mono break-all text-muted-foreground">Hash calculé : {result.computedHash}</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div>{children}</div>
    </div>
  );
}
