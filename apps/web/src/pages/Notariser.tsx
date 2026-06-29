import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  FilePlus2,
  Upload,
  Mic,
  Square,
  Fingerprint,
  Shield,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { cn } from "../lib/cn";

const inputCls =
  "w-full h-11 px-3.5 rounded-md bg-surface border border-border text-text text-sm placeholder:text-muted focus:border-accent focus:outline-none transition-colors";

export default function Notariser() {
  const [document, setDocument] = useState<File | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [meta, setMeta] = useState({
    parcelleRef: "",
    parcelleVille: "",
    acheteurNom: "",
    vendeurNom: "",
  });
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { id: string; combinedHash: string }>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        setAudio(new Blob(chunks, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Accès micro refusé");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const captureFingerprint = () => {
    setSigned(true);
    toast.success("Empreinte capturée (simulation Passkey)");
  };

  const submit = async () => {
    if (!document) return toast.error("Convention de vente requise");
    if (!audio) return toast.error("Enregistrement audio requis");
    if (!signed) return toast.error("Signature biométrique requise");
    if (!meta.parcelleRef || !meta.acheteurNom || !meta.vendeurNom || !meta.parcelleVille) {
      return toast.error("Champs parcelle, ville, acheteur et vendeur requis");
    }

    setSubmitting(true);
    const form = new FormData();
    form.append("document", document);
    form.append("audio", audio, "consentement.webm");
    form.append("meta", JSON.stringify({ ...meta, signature: crypto.randomUUID() }));

    try {
      const res = await fetch("/api/notarize", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setResult(data);
      toast.success("Acte notarisé et ancré.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrowIcon={FilePlus2}
        eyebrow="Notarisation"
        title="Sceller une vente foncière"
        subtitle="Convention + consentement audio + empreinte biométrique → hash combiné ancré sur Bitcoin."
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card step="1" title="Parties et parcelle">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Référence parcelle" required>
                <input
                  className={inputCls}
                  placeholder="BN-4421"
                  value={meta.parcelleRef}
                  onChange={(e) => setMeta({ ...meta, parcelleRef: e.target.value })}
                />
              </Field>
              <Field label="Ville" required>
                <input
                  className={inputCls}
                  placeholder="Abomey-Calavi"
                  value={meta.parcelleVille}
                  onChange={(e) => setMeta({ ...meta, parcelleVille: e.target.value })}
                />
              </Field>
              <Field label="Nom du vendeur" required>
                <input
                  className={inputCls}
                  placeholder="M. Koffi Adjovi"
                  value={meta.vendeurNom}
                  onChange={(e) => setMeta({ ...meta, vendeurNom: e.target.value })}
                />
              </Field>
              <Field label="Nom de l'acheteur" required>
                <input
                  className={inputCls}
                  placeholder="Mme Chantal Hounkpe"
                  value={meta.acheteurNom}
                  onChange={(e) => setMeta({ ...meta, acheteurNom: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          <Card step="2" title="Convention de vente">
            <label className="flex items-center gap-3 px-4 py-3 rounded-md border border-dashed border-border-strong cursor-pointer hover:bg-surface-2 transition-colors">
              <Upload className="w-4 h-4 text-muted" />
              <span className="text-sm">
                {document ? document.name : "Téléverser un PDF ou une photo de la convention"}
              </span>
              <input
                type="file"
                aria-label="Convention de vente"
                accept=".pdf,image/*"
                onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {document && (
              <p className="text-xs text-muted mt-2">
                Taille : {(document.size / 1024).toFixed(1)} ko · le hash sera calculé au moment du scellement.
              </p>
            )}
          </Card>

          <Card step="3" title="Consentement audio en langue locale">
            <p className="text-sm text-muted mb-3">
              La cliente déclare oralement son achat (« Moi, Chantal, j'achète la parcelle…»),
              dans la langue qu'elle parle.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {!recording ? (
                <Button variant="primary" onClick={startRecording}>
                  <Mic className="w-4 h-4" />
                  Démarrer l'enregistrement
                </Button>
              ) : (
                <Button variant="danger" onClick={stopRecording}>
                  <Square className="w-4 h-4" />
                  Arrêter
                </Button>
              )}
              {recording && (
                <span className="inline-flex items-center gap-2 text-sm text-danger">
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  Enregistrement en cours…
                </span>
              )}
            </div>
            {audio && !recording && (
              <audio controls src={URL.createObjectURL(audio)} className="mt-4 w-full" />
            )}
          </Card>

          <Card step="4" title="Signature biométrique">
            <p className="text-sm text-muted mb-3">
              L'empreinte digitale débloque une clé cryptographique gérée localement
              par l'enclave sécurisée du téléphone.
            </p>
            <Button
              variant={signed ? "outline" : "primary"}
              onClick={captureFingerprint}
              disabled={signed}
            >
              {signed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Empreinte capturée
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Poser le doigt
                </>
              )}
            </Button>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface border border-border rounded-xl p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold">Récapitulatif</h2>
            </div>
            <ul className="text-sm space-y-2 mb-5">
              <Recap label="Parcelle" value={meta.parcelleRef || "—"} />
              <Recap label="Ville" value={meta.parcelleVille || "—"} />
              <Recap label="Vendeur" value={meta.vendeurNom || "—"} />
              <Recap label="Acheteur" value={meta.acheteurNom || "—"} />
              <Recap label="Document" value={document ? "✓ chargé" : "—"} ok={!!document} />
              <Recap label="Audio" value={audio ? "✓ enregistré" : "—"} ok={!!audio} />
              <Recap label="Empreinte" value={signed ? "✓ capturée" : "—"} ok={signed} />
            </ul>

            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scellement…
                </>
              ) : (
                <>Sceller sur Bitcoin</>
              )}
            </Button>

            {result && (
              <div className="mt-5 p-4 rounded-md border border-accent/30 bg-accent/5 text-sm space-y-2">
                <p className="font-semibold text-accent flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Acte scellé
                </p>
                <p className="font-mono text-xs text-muted break-all">id : {result.id}</p>
                <p className="font-mono text-xs text-muted break-all">hash : {result.combinedHash}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Card({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-xs text-muted font-mono">{step}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function Recap({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={cn("truncate text-right", ok ? "text-accent" : "text-text")}>{value}</span>
    </li>
  );
}
