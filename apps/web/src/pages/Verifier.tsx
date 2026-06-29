import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";

type VerifyResponse =
  | { status: "valid"; acte: { id: string; parcelle_ref: string; parcelle_ville: string; created_at: string }; computedHash: string }
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

    try {
      const res = await fetch("/api/verify", { method: "POST", body: form });
      const data: VerifyResponse = await res.json();
      setResult(data);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrowIcon={ShieldCheck}
        eyebrow="Vérification"
        title="Authentifier un document foncier"
        subtitle="On recalcule le hash du couple (document + audio) et on le compare au ledger."
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <FileSlot
            label="Document à vérifier"
            hint="Le contrat tel qu'on vous le présente aujourd'hui (PDF ou image)."
            file={document}
            accept=".pdf,image/*"
            onChange={setDocument}
          />
          <FileSlot
            label="Audio de consentement original"
            hint="Le fichier audio de l'enregistrement de notarisation."
            file={audio}
            accept="audio/*"
            onChange={setAudio}
          />

          <Button variant="primary" size="lg" className="w-full" onClick={verify} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Vérification…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Vérifier l'authenticité
              </>
            )}
          </Button>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="bg-surface border border-border rounded-xl p-5 h-full">
            <h2 className="text-sm font-semibold mb-3">Verdict</h2>

            {!result && !loading && (
              <p className="text-sm text-muted">
                Téléverse le document et l'audio puis lance la vérification. Le résultat tombe
                en moins de deux secondes.
              </p>
            )}

            {result?.status === "valid" && (
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-accent font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Document authentique
                </p>
                <dl className="text-sm space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Parcelle</dt>
                    <dd className="font-mono text-xs">{result.acte.parcelle_ref}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Ville</dt>
                    <dd>{result.acte.parcelle_ville}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Date acte</dt>
                    <dd>{new Date(result.acte.created_at).toLocaleDateString("fr-FR")}</dd>
                  </div>
                </dl>
                <p className="text-xs font-mono text-muted break-all pt-2 border-t border-border">
                  hash · {result.computedHash}
                </p>
              </div>
            )}

            {result?.status === "invalid" && (
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-danger font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  Alerte rouge · fraude probable
                </p>
                <p className="text-sm text-muted">{result.reason}</p>
                <p className="text-xs font-mono text-muted break-all pt-2 border-t border-border">
                  hash calculé · {result.computedHash}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FileSlot({
  label,
  hint,
  file,
  accept,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  accept: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <section className="bg-surface border border-border rounded-xl p-5">
      <label className="block mb-3">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted mt-0.5">{hint}</span>
      </label>
      <label className="flex items-center gap-3 px-4 py-3 rounded-md border border-dashed border-border-strong cursor-pointer hover:bg-surface-2 transition-colors">
        <Upload className="w-4 h-4 text-muted" />
        <span className="text-sm truncate">{file ? file.name : "Choisir un fichier"}</span>
        <input
          type="file"
          aria-label={label}
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </section>
  );
}
