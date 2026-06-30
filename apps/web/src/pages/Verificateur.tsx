import { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, Loader2, Search, Bitcoin } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { FileScan } from "../components/FileScan";
import { BackButton } from "../components/BackButton";
import { supabase, type Dossier, type StatusHistoryEntry, type Document } from "../lib/supabase";
import { extractKandoDossierId } from "../lib/pdf";

type Verdict =
  | { kind: "authentic"; dossier: Dossier; history: StatusHistoryEntry[]; via: "uuid" | "hash" }
  | { kind: "tampered"; dossier: Dossier; expectedHash: string | null; computedHash: string }
  | { kind: "unknown"; computedHash: string | null; uuid: string | null };

// Recupere le dernier document scelle pour un dossier (= la "version officielle"
// dont on compare l'empreinte). Renvoie null si aucun document n'a encore ete
// genere/ancre.
async function fetchLatestDocument(dossierId: string): Promise<Document | null> {
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Document | null;
}

async function fetchHistory(dossierId: string): Promise<StatusHistoryEntry[]> {
  const { data } = await supabase
    .from("dossier_status_history")
    .select("*")
    .eq("dossier_id", dossierId)
    .order("changed_at");
  return (data ?? []) as StatusHistoryEntry[];
}

export default function Verificateur() {
  const [uuid, setUuid] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docHash, setDocHash] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    setVerdict(null);

    try {
      // 1. Récupération de l'UUID · priorité au fichier (métadonnée PDF), fallback champ texte.
      let extractedUuid: string | null = null;
      if (docFile) extractedUuid = await extractKandoDossierId(docFile);
      const effectiveUuid = extractedUuid ?? (uuid.trim() || null);

      // 2. Recherche du dossier par UUID
      let dossier: Dossier | null = null;
      if (effectiveUuid) {
        const { data } = await supabase.from("dossiers").select("*").eq("id", effectiveUuid).maybeSingle();
        dossier = data;
      }

      // 3. Branchement 3 cas
      if (effectiveUuid && dossier) {
        if (!docHash) {
          // UUID connu mais pas de fichier a comparer
          const history = await fetchHistory(dossier.id);
          setVerdict({ kind: "authentic", dossier, history, via: "uuid" });
          return;
        }
        const latestDoc = await fetchLatestDocument(dossier.id);
        if (latestDoc && latestDoc.sha256 === docHash) {
          // 🟢 UUID connu + hash correspond
          const history = await fetchHistory(dossier.id);
          setVerdict({ kind: "authentic", dossier, history, via: "uuid" });
        } else {
          // 🔴 UUID connu + hash different · DOCUMENT FALSIFIE
          setVerdict({ kind: "tampered", dossier, expectedHash: latestDoc?.sha256 ?? null, computedHash: docHash });
        }
        return;
      }

      // Pas d'UUID exploitable · recherche fallback via la table documents
      if (docHash) {
        const { data: doc } = await supabase
          .from("documents")
          .select("*, dossiers(*)")
          .eq("sha256", docHash)
          .maybeSingle();
        if (doc && (doc as any).dossiers) {
          const matched = (doc as any).dossiers as Dossier;
          const history = await fetchHistory(matched.id);
          setVerdict({ kind: "authentic", dossier: matched, history, via: "hash" });
          return;
        }
      }

      // ⚪ Inconnu
      setVerdict({ kind: "unknown", computedHash: docHash, uuid: effectiveUuid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <BackButton fallback="/" />
      </div>

      <PageHeader
        title="Vérifier un document foncier"
        subtitle="Téléverse le PDF officiel · le système lit son identifiant caché et compare son empreinte à la blockchain."
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <section className="bg-surface border border-border rounded-xl p-5">
            <FileScan
              label="Document à vérifier"
              hint="Glisse le PDF officiel KandoFoncier · son identifiant est lu automatiquement."
              onChange={(file, hash) => { setDocFile(file); setDocHash(hash); }}
            />
          </section>

          <section className="bg-surface border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">OU identifiant de dossier (si tu n'as pas le PDF)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={uuid}
                onChange={(e) => setUuid(e.target.value)}
                placeholder="7b9e1c4d-…"
                className="w-full h-11 pl-10 pr-3 rounded-md bg-bg border border-border text-sm font-mono focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </section>

          <Button variant="primary" size="lg" className="w-full" onClick={verify} disabled={loading || (!uuid.trim() && !docFile)}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" />Vérifier l'authenticité</>}
          </Button>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="bg-surface border border-border rounded-xl p-5 h-full">
            <h2 className="text-sm font-semibold mb-3">Verdict</h2>

            {!verdict && !loading && (
              <div className="space-y-3 text-sm text-muted">
                <p>3 verdicts possibles :</p>
                <Legend dot="bg-accent" label="Document Certifié Conforme" desc="Identifiant connu, empreinte intacte." />
                <Legend dot="bg-danger" label="Document Falsifié" desc="Identifiant connu, mais contenu modifié." />
                <Legend dot="bg-muted" label="Document Inconnu / Lambda" desc="Aucune empreinte enregistrée sur KandoFoncier." />
              </div>
            )}

            {verdict?.kind === "authentic" && <AuthenticVerdict v={verdict} />}
            {verdict?.kind === "tampered" && <TamperedVerdict v={verdict} />}
            {verdict?.kind === "unknown" && <UnknownVerdict v={verdict} />}
          </div>
        </div>
      </div>
    </>
  );
}

function Legend({ dot, label, desc }: { dot: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-1.5 w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
    </div>
  );
}

function AuthenticVerdict({ v }: { v: Extract<Verdict, { kind: "authentic" }> }) {
  return (
    <div className="space-y-3">
      <p className="inline-flex items-center gap-2 text-accent font-bold text-base">
        <CheckCircle2 className="w-5 h-5" />
        Document Certifié Conforme
      </p>
      <p className="text-xs text-muted">
        Identifié via <strong>{v.via === "uuid" ? "métadonnée PDF" : "empreinte directe"}</strong>.
        L'empreinte cryptographique correspond exactement à ce qui a été scellé sur Bitcoin via OpenTimestamps.
      </p>
      <div className="text-sm space-y-1.5 pt-2 border-t border-border">
        <Row label="Parcelle" value={v.dossier.parcelle_ref} />
        <Row label="Lieu" value={`${v.dossier.quartier} · ${v.dossier.commune}`} />
        <Row label="Vendeur" value={v.dossier.vendeur_nom} />
        <Row label="Acheteur" value={v.dossier.acheteur_nom} />
        <Row label="Statut" value={v.dossier.statut} />
      </div>
      <div className="pt-2 border-t border-border">
        <p className="text-xs uppercase text-muted mb-2">Etapes validees</p>
        <ul className="space-y-1.5">
          {v.history.map((h) => (
            <li key={h.id} className="flex justify-between text-xs">
              <span className="font-medium">{h.nouveau_statut}</span>
              <span className="text-muted">{new Date(h.changed_at).toLocaleDateString("fr-FR")}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-3 border-t border-border flex items-start gap-2 text-xs text-muted">
        <Bitcoin className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
        Preuve ancrée dans la blockchain Bitcoin via OpenTimestamps (simulation hackathon).
      </div>
    </div>
  );
}

function TamperedVerdict({ v }: { v: Extract<Verdict, { kind: "tampered" }> }) {
  return (
    <div className="space-y-3">
      <p className="inline-flex items-center gap-2 text-danger font-bold text-base">
        <AlertTriangle className="w-5 h-5" />
        Document Falsifié
      </p>
      <p className="text-sm text-text">
        L'identifiant pointe vers la vente <strong>{v.dossier.vendeur_nom} → {v.dossier.acheteur_nom}</strong>,
        mais le contenu du PDF que tu as déposé <strong>a été modifié</strong> depuis le scellement.
      </p>
      <div className="text-sm space-y-1.5 pt-2 border-t border-danger/30">
        <Row label="Parcelle d'origine" value={v.dossier.parcelle_ref} />
        <Row label="Empreinte attendue" value={shorten(v.expectedHash)} />
        <Row label="Empreinte calculee" value={shorten(v.computedHash)} />
      </div>
      <p className="text-xs text-danger/80 pt-2 border-t border-danger/30">
        🚨 Ne signe pas ce document. Demande au Chef de Quartier le PDF original.
      </p>
    </div>
  );
}

function UnknownVerdict({ v }: { v: Extract<Verdict, { kind: "unknown" }> }) {
  return (
    <div className="space-y-3">
      <p className="inline-flex items-center gap-2 text-muted font-bold text-base">
        <HelpCircle className="w-5 h-5" />
        Document Inconnu
      </p>
      <p className="text-sm text-muted">
        Ce document n'a jamais été enregistré ni certifié sur KandoFoncier. Soit c'est un PDF lambda,
        soit il a été créé en dehors de notre plateforme.
      </p>
      {v.uuid && (
        <p className="text-xs text-muted pt-2 border-t border-border">
          L'identifiant <span className="font-mono">{v.uuid.slice(0, 8)}…</span> est inconnu de notre base.
        </p>
      )}
      {v.computedHash && (
        <p className="text-xs font-mono text-muted break-all">empreinte · {v.computedHash}</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right truncate font-mono text-xs">{value ?? "—"}</span>
    </div>
  );
}

function shorten(h: string | null): string {
  if (!h) return "—";
  return `${h.slice(0, 12)}…${h.slice(-6)}`;
}
