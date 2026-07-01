// @ts-nocheck
// TODO: refactor pour le nouveau schema (statuts brouillon/atteste_cq/valide_mairie,
// suppression du champ 'mode', migration document_hash -> table documents).
import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Share2, Copy, CheckCircle2, AlertCircle, Loader2, Mic, Bitcoin, FileText, Download,
} from "lucide-react";
import { BackButton } from "../components/BackButton";
import { generateOfficialPdf } from "../lib/pdf";
import { supabase, type Dossier, type Checkpoint } from "../lib/supabase";
import { sha256, sha256OfFile, combinedHash } from "@gandehou/ledger";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { SmsOtpVerify } from "../components/SmsOtpVerify";
import { AudioRecorder } from "../components/AudioRecorder";
import { FingerprintCapture } from "../components/FingerprintCapture";
import { FileScan } from "../components/FileScan";
import { useChef } from "../hooks/useChef";

type Role = "chef" | "vendeur" | "acheteur";

const STATUT_LABEL: Record<Dossier["statut"], string> = {
  INIT: "En attente vendeur",
  VENDEUR_OK: "En attente acheteur",
  ACHETEUR_OK: "Prêt à sceller",
  SCELLE_COUTUMIER: "Scellé coutumier · ancré Bitcoin",
};

export default function DossierPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const role = (params.get("role") as Role | null) ?? "chef";
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!id) return;
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from("dossiers").select("*").eq("id", id).maybeSingle(),
      supabase.from("dossier_checkpoints").select("*").eq("dossier_id", id).order("created_at"),
    ]);
    setDossier(d);
    setCheckpoints(c ?? []);
    setLoading(false);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <Centered>Chargement…</Centered>;
  if (!dossier) return <Centered>Dossier introuvable.</Centered>;

  return (
    <div className="container py-6 lg:py-10">
      {role === "chef" && <ChefView dossier={dossier} checkpoints={checkpoints} onReload={reload} />}
      {role === "vendeur" && <SignerView dossier={dossier} role="vendeur" onReload={reload} />}
      {role === "acheteur" && <SignerView dossier={dossier} role="acheteur" onReload={reload} />}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh] flex items-center justify-center text-muted text-sm">{children}</div>;
}

// ─── VUE CHEF ────────────────────────────────────────────────────────────────
function ChefView({ dossier, checkpoints, onReload }: { dossier: Dossier; checkpoints: Checkpoint[]; onReload: () => void }) {
  const { chef } = useChef();
  const isOwner = chef?.id === dossier.chef_id;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const vendeurLink = `${baseUrl}/dossier/${dossier.id}?role=vendeur`;
  const acheteurLink = `${baseUrl}/dossier/${dossier.id}?role=acheteur`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  };

  const whatsapp = (link: string, partyName: string) => {
    const msg = encodeURIComponent(
      `Bonjour ${partyName}, voici votre lien personnel pour signer le dossier foncier sur KandoFoncier : ${link}`,
    );
    return `https://wa.me/?text=${msg}`;
  };

  const canSeal = dossier.statut === "ACHETEUR_OK";
  const sealed = dossier.statut === "SCELLE_COUTUMIER";

  const sealDossier = async () => {
    try {
      // 1. Génère le PDF officiel · contient l'UUID en métadonnée + QR + texte visible
      const pdfBlob = await generateOfficialPdf(dossier, checkpoints);
      const pdfHash = await sha256OfFile(pdfBlob);

      // 2. Hash final = chaîne des checkpoints + hash du PDF officiel
      const allHashes = [...checkpoints.map((c) => c.current_hash), pdfHash].join("::");
      const finalHash = await sha256(new TextEncoder().encode(allHashes));

      // 3. Insère le checkpoint COUTUMIER · document_hash = hash du PDF officiel
      await supabase.from("dossier_checkpoints").insert({
        dossier_id: dossier.id,
        etape: "COUTUMIER",
        document_hash: pdfHash,
        current_hash: finalHash,
        bitcoin_proof: "ots-pending::" + finalHash,
      });

      // 4. Update le dossier · document_hash devient celui du PDF officiel (clé de vérification)
      await supabase.from("dossiers")
        .update({ statut: "SCELLE_COUTUMIER", document_hash: pdfHash })
        .eq("id", dossier.id);

      // 5. Télécharge le PDF officiel
      downloadBlob(pdfBlob, `KandoFoncier-${dossier.parcelle_ref}.pdf`);

      toast.success("Dossier scellé · PDF officiel téléchargé");
      onReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur scellement");
    }
  };

  const downloadAgain = async () => {
    const pdfBlob = await generateOfficialPdf(dossier, checkpoints);
    downloadBlob(pdfBlob, `KandoFoncier-${dossier.parcelle_ref}.pdf`);
  };

  return (
    <>
      <div className="mb-4">
        <BackButton fallback="/dashboard" />
      </div>

      <PageHeader
        eyebrowIcon={FileText}
        eyebrow={`Dossier · ${dossier.parcelle_ref}`}
        title={`${dossier.vendeur_nom} → ${dossier.acheteur_nom}`}
        subtitle={`${dossier.parcelle_quartier} · ${dossier.parcelle_commune}${dossier.parcelle_superficie ? ` · ${dossier.parcelle_superficie} m²` : ""}`}
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <StatutCard statut={dossier.statut} />

          {dossier.mode === "distanciel" && !sealed && (
            <section className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-1">Liens à partager</h2>
              <p className="text-xs text-muted mb-4">Envoie chaque lien à la bonne partie via WhatsApp.</p>

              <ShareRow
                title="Espace Vendeur"
                name={dossier.vendeur_nom}
                phone={dossier.vendeur_phone}
                done={dossier.statut !== "INIT"}
                link={vendeurLink}
                onCopy={() => copy(vendeurLink, "Lien vendeur")}
                whatsappUrl={whatsapp(vendeurLink, dossier.vendeur_nom)}
              />
              <div className="h-3" />
              <ShareRow
                title="Espace Acheteur"
                name={dossier.acheteur_nom}
                phone={dossier.acheteur_phone}
                done={dossier.statut === "ACHETEUR_OK" || dossier.statut === "SCELLE_COUTUMIER"}
                link={acheteurLink}
                onCopy={() => copy(acheteurLink, "Lien acheteur")}
                whatsappUrl={whatsapp(acheteurLink, dossier.acheteur_nom)}
              />
            </section>
          )}

          {dossier.mode === "presentiel" && !sealed && (
            <section className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-1">Mode présentiel</h2>
              <p className="text-xs text-muted mb-4">Vendeur et acheteur sont avec toi. Continue le processus sur cet appareil.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                {dossier.statut === "INIT" && (
                  <Link to={`/dossier/${dossier.id}?role=vendeur`} className="flex-1">
                    <Button variant="primary" className="w-full">Espace Vendeur ({dossier.vendeur_nom})</Button>
                  </Link>
                )}
                {dossier.statut === "VENDEUR_OK" && (
                  <Link to={`/dossier/${dossier.id}?role=acheteur`} className="flex-1">
                    <Button variant="primary" className="w-full">Espace Acheteur ({dossier.acheteur_nom})</Button>
                  </Link>
                )}
                {dossier.statut === "ACHETEUR_OK" && (
                  <Button variant="primary" className="flex-1" onClick={sealDossier} disabled={!isOwner}>
                    <Bitcoin className="w-4 h-4" /> Sceller sur Bitcoin
                  </Button>
                )}
              </div>
            </section>
          )}

          {canSeal && dossier.mode === "distanciel" && (
            <section className="bg-accent/5 border border-accent/30 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-2">Les deux parties ont signé.</h2>
              <p className="text-sm text-muted mb-4">Tu peux maintenant ancrer le dossier sur la blockchain Bitcoin.</p>
              <Button variant="primary" onClick={sealDossier} disabled={!isOwner}>
                <Bitcoin className="w-4 h-4" /> Sceller sur Bitcoin
              </Button>
            </section>
          )}

          {sealed && (
            <section className="bg-accent/5 border border-accent/30 rounded-xl p-5 space-y-3">
              <p className="inline-flex items-center gap-2 font-semibold text-accent">
                <CheckCircle2 className="w-5 h-5" /> Dossier scellé · ancré sur Bitcoin
              </p>
              <p className="text-sm text-muted">
                Le PDF officiel contient un QR code, l'identifiant de dossier en clair
                ET une métadonnée cachée. N'importe qui peut le vérifier via la page Vérificateur.
              </p>
              <Button variant="outline" onClick={downloadAgain}>
                <Download className="w-4 h-4" />
                Télécharger à nouveau le PDF officiel
              </Button>
            </section>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5">
          <HistoryCard dossierId={dossier.id} checkpoints={checkpoints} />
        </div>
      </div>
    </>
  );
}

function ShareRow({ title, name, phone, link, onCopy, whatsappUrl, done }: { title: string; name: string; phone: string; link: string; onCopy: () => void; whatsappUrl: string; done: boolean }) {
  return (
    <div className="p-4 rounded-md border border-border bg-bg">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted">{name} · {phone}</p>
        </div>
        {done && <span className="inline-flex items-center gap-1 text-xs text-accent"><CheckCircle2 className="w-3.5 h-3.5" />Signé</span>}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input readOnly value={link} className="flex-1 px-3 py-2 rounded-md bg-surface border border-border text-xs font-mono truncate" aria-label={title} />
        <Button variant="outline" size="sm" onClick={onCopy}><Copy className="w-3.5 h-3.5" />Copier</Button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-accent text-accent-contrast text-sm font-medium hover:bg-accent-hover transition-colors">
          <Share2 className="w-3.5 h-3.5" /> WhatsApp
        </a>
      </div>
    </div>
  );
}

function StatutCard({ statut }: { statut: Dossier["statut"] }) {
  const isSealed = statut === "SCELLE_COUTUMIER";
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-md ${isSealed ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn"}`}>
        {isSealed ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      </span>
      <div>
        <p className="text-xs text-muted">Statut</p>
        <p className="text-sm font-semibold">{STATUT_LABEL[statut]}</p>
      </div>
    </div>
  );
}

function HistoryCard({ dossierId, checkpoints }: { dossierId: string; checkpoints: Checkpoint[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold mb-1">Historique des checkpoints</h2>
      <p className="text-xs text-muted mb-4">Chaque étape ajoute un hash chaîné à la précédente.</p>
      <ol className="space-y-3">
        {checkpoints.map((c) => (
          <li key={c.id} className="p-3 rounded-md bg-bg border border-border">
            <div className="flex justify-between text-xs">
              <span className="font-semibold">{c.etape}</span>
              <span className="text-muted">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
            </div>
            <p className="text-[11px] font-mono text-muted break-all mt-1">{c.current_hash.slice(0, 24)}…{c.current_hash.slice(-8)}</p>
            {c.signer_phone && <p className="text-xs text-muted mt-1">Signé par {c.signer_phone}</p>}
          </li>
        ))}
        {checkpoints.length === 0 && <p className="text-sm text-muted italic">Aucun checkpoint pour le moment.</p>}
      </ol>
      <p className="text-[10px] text-muted mt-3 font-mono break-all">UUID · {dossierId}</p>
    </div>
  );
}

// ─── VUE SIGNATAIRE (vendeur ou acheteur) ────────────────────────────────────
function SignerView({ dossier, role, onReload }: { dossier: Dossier; role: "vendeur" | "acheteur"; onReload: () => void }) {
  const name = role === "vendeur" ? dossier.vendeur_nom : dossier.acheteur_nom;
  const phone = role === "vendeur" ? dossier.vendeur_phone : dossier.acheteur_phone;
  const otherName = role === "vendeur" ? dossier.acheteur_nom : dossier.vendeur_nom;
  const alreadyDone =
    (role === "vendeur" && dossier.statut !== "INIT") ||
    (role === "acheteur" && (dossier.statut === "ACHETEUR_OK" || dossier.statut === "SCELLE_COUTUMIER"));

  const [phoneOk, setPhoneOk] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [cipFile, setCipFile] = useState<File | null>(null);
  const [cipHash, setCipHash] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cipNeeded = role === "acheteur";
  const cipOk = !cipNeeded || (cipFile !== null && cipHash !== null);
  const allOk = phoneOk && audio !== null && cipOk && signature !== null;

  if (alreadyDone) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-accent/5 border border-accent/30 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-1">Merci {name}</h1>
          <p className="text-sm text-muted">Ta signature a déjà été enregistrée pour ce dossier.</p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!allOk) return toast.error("Complète toutes les étapes");
    setSubmitting(true);
    try {
      const audioHash = await sha256OfFile(audio!);
      const base = dossier.document_hash ?? dossier.id;
      // Hash combiné · enchaîne document + audio + cip (si présent) + signature
      const parts = [base, audioHash, cipHash ?? "", signature!].filter(Boolean).join("::");
      const currentHash = await sha256(new TextEncoder().encode(parts));

      await supabase.from("dossier_checkpoints").insert({
        dossier_id: dossier.id,
        etape: role === "vendeur" ? "VENDEUR" : "ACHETEUR",
        audio_hash: audioHash,
        document_hash: cipHash ?? dossier.document_hash,
        current_hash: currentHash,
        signer_phone: phone,
      });

      const newStatut = role === "vendeur" ? "VENDEUR_OK" : "ACHETEUR_OK";
      await supabase.from("dossiers").update({ statut: newStatut }).eq("id", dossier.id);

      toast.success("Signature enregistrée");
      onReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-4">
        <BackButton fallback="/" />
      </div>

      <div className="text-center mb-6">
        <span className="text-xs uppercase tracking-wider text-accent">Espace {role}</span>
        <h1 className="text-2xl font-bold mt-1">Bienvenue {name}</h1>
        <p className="text-sm text-muted mt-1">
          Vente parcelle <span className="font-mono">{dossier.parcelle_ref}</span> · {dossier.parcelle_commune}
        </p>
      </div>

      <Step n={1} title="Vérification de ton numéro" done={phoneOk}>
        <SmsOtpVerify phone={phone} onVerified={() => setPhoneOk(true)} />
      </Step>

      {phoneOk && (
        <Step n={2} title="Consentement vocal en langue locale" done={!!audio}>
          <p className="text-sm text-muted mb-4">
            Dis dans ta langue : « Moi, {name}, je {role === "vendeur" ? "vends ma parcelle à" : "achète la parcelle de"} {otherName}, en pleine conscience. »
          </p>
          <AudioRecorder onRecorded={setAudio} />
        </Step>
      )}

      {phoneOk && audio && cipNeeded && (
        <Step n={3} title="Pièce d'identité (CIP ou IFU)" done={cipOk}>
          <FileScan
            label=""
            hint="Téléverse une photo claire de ta CIP ou ton IFU."
            onChange={(file, hash) => { setCipFile(file); setCipHash(hash); }}
          />
        </Step>
      )}

      {phoneOk && audio && cipOk && (
        <Step n={cipNeeded ? 4 : 3} title="Signature biométrique" done={!!signature}>
          <FingerprintCapture onCaptured={setSignature} />
        </Step>
      )}

      {allOk && (
        <Button variant="primary" size="lg" className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mic className="w-4 h-4" />Valider ma signature</>}
        </Button>
      )}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold inline-flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            done ? "bg-accent text-accent-contrast" : "bg-surface-2 text-muted border border-border"
          }`}>
            {done ? "✓" : n}
          </span>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
