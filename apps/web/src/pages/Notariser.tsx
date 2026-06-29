import { useState } from "react";
import { toast } from "sonner";

const inputCls = "px-3 py-2 rounded-md border border-border bg-background text-sm";

export default function Notariser() {
  const [document, setDocument] = useState<File | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [meta, setMeta] = useState({ parcelleRef: "", parcelleVille: "", acheteurNom: "", vendeurNom: "" });
  const [result, setResult] = useState<null | { id: string; combinedHash: string }>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      setAudio(new Blob(chunks, { type: "audio/webm" }));
      stream.getTracks().forEach((t) => t.stop());
    };
    rec.start();
    setRecorder(rec);
    setRecording(true);
  };

  const stopRecording = () => {
    recorder?.stop();
    setRecording(false);
  };

  const submit = async () => {
    if (!document || !audio) return toast.error("Document et audio requis");
    if (!meta.parcelleRef || !meta.acheteurNom) return toast.error("Référence parcelle et acheteur requis");

    const form = new FormData();
    form.append("document", document);
    form.append("audio", audio, "consentement.webm");
    form.append("meta", JSON.stringify({ ...meta, signature: crypto.randomUUID() }));

    const res = await fetch("/api/notarize", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Erreur");
    setResult(data);
    toast.success("Acte notarisé et ancré.");
  };

  return (
    <div className="container py-12 max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-bold">Notariser une vente</h1>

      <div className="grid grid-cols-2 gap-4">
        <input className={inputCls} placeholder="Référence parcelle (ex. BN-4421)" value={meta.parcelleRef} onChange={(e) => setMeta({ ...meta, parcelleRef: e.target.value })} />
        <input className={inputCls} placeholder="Ville (ex. Abomey-Calavi)" value={meta.parcelleVille} onChange={(e) => setMeta({ ...meta, parcelleVille: e.target.value })} />
        <input className={inputCls} placeholder="Nom de l'acheteur" value={meta.acheteurNom} onChange={(e) => setMeta({ ...meta, acheteurNom: e.target.value })} />
        <input className={inputCls} placeholder="Nom du vendeur" value={meta.vendeurNom} onChange={(e) => setMeta({ ...meta, vendeurNom: e.target.value })} />
      </div>

      <Field label="1. Convention de vente (PDF ou image)">
        <input type="file" aria-label="Convention de vente" accept=".pdf,image/*" onChange={(e) => setDocument(e.target.files?.[0] ?? null)} />
      </Field>

      <Field label="2. Consentement audio (langue locale)">
        {!recording ? (
          <button type="button" onClick={startRecording} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">🎙️ Démarrer l'enregistrement</button>
        ) : (
          <button type="button" onClick={stopRecording} className="px-4 py-2 rounded-lg bg-danger text-danger-foreground font-medium">⏹️ Arrêter</button>
        )}
        {audio && <audio controls src={URL.createObjectURL(audio)} className="mt-3 w-full" />}
      </Field>

      <Field label="3. Empreinte (simulation Passkey)">
        <button type="button" onClick={() => toast.info("Empreinte capturée (simulation)")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
          👆 Poser le doigt
        </button>
      </Field>

      <button type="button" onClick={submit} className="w-full py-4 rounded-lg bg-accent text-accent-foreground font-semibold text-lg">
        Sceller sur Bitcoin
      </button>

      {result && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30 space-y-2">
          <p className="font-semibold text-success">✅ Acte notarisé</p>
          <p className="text-xs font-mono break-all">ID : {result.id}</p>
          <p className="text-xs font-mono break-all">Hash : {result.combinedHash}</p>
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
