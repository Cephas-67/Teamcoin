import { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Loader2, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { FileScan } from "../components/FileScan";
import { supabase, type Dossier, type Checkpoint } from "../lib/supabase";

type Verdict =
  | { kind: "valid"; dossier: Dossier; checkpoints: Checkpoint[] }
  | { kind: "invalid"; reason: string; computedHash: string }
  | { kind: "not-found" };

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
      let dossier: Dossier | null = null;

      if (uuid.trim()) {
        const { data } = await supabase.from("dossiers").select("*").eq("id", uuid.trim()).maybeSingle();
        dossier = data;
      }

      if (docHash) {
        if (!dossier) {
          const { data } = await supabase.from("dossiers").select("*").eq("document_hash", docHash).maybeSingle();
          dossier = data;
        } else if (dossier.document_hash !== docHash) {
          setVerdict({ kind: "invalid", reason: "Le hash du document ne correspond pas à celui scellé. Document modifié.", computedHash: docHash });
          return;
        }
      }

      if (!dossier) {
        setVerdict({ kind: "not-found" });
        return;
      }

      const { data: checkpoints } = await supabase.from("dossier_checkpoints").select("*").eq("dossier_id", dossier.id).order("created_at");
      setVerdict({ kind: "valid", dossier, checkpoints: checkpoints ?? [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Vérifier un document foncier"
        subtitle="Entre l'identifiant du dossier, ou téléverse le document à authentifier."
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <section className="bg-surface border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">Identifiant du dossier (UUID)</label>
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
            <p className="text-xs text-muted mt-1.5">Tu trouveras cet identifiant en pied de page du dossier transmis par le Chef.</p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-5">
            <FileScan
              label="OU document à vérifier"
              hint="On recalcule son hash localement et on compare à ce qui est scellé."
              onChange={(file, hash) => { setDocFile(file); setDocHash(hash); }}
            />
          </section>

          <Button variant="primary" size="lg" className="w-full" onClick={verify} disabled={loading || (!uuid.trim() && !docFile)}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" />Vérifier l'authenticité</>}
          </Button>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="bg-surface border border-border rounded-xl p-5 h-full">
            <h2 className="text-sm font-semibold mb-3">Verdict</h2>

            {!verdict && !loading && (
              <p className="text-sm text-muted">Téléverse le document ou entre l'identifiant, puis lance la vérification.</p>
            )}

            {verdict?.kind === "not-found" && (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-warn font-semibold"><AlertTriangle className="w-5 h-5" />Aucun dossier trouvé</p>
                <p className="text-sm text-muted">Le UUID est inconnu ou le document n'a jamais été scellé sur KandoFoncier.</p>
              </div>
            )}

            {verdict?.kind === "invalid" && (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-danger font-semibold"><AlertTriangle className="w-5 h-5" />Alerte rouge · document falsifié</p>
                <p className="text-sm text-muted">{verdict.reason}</p>
                <p className="text-xs font-mono text-muted break-all pt-2 border-t border-border">hash calculé · {verdict.computedHash}</p>
              </div>
            )}

            {verdict?.kind === "valid" && (
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-accent font-semibold"><CheckCircle2 className="w-5 h-5" />Document certifié immuable</p>
                <div className="text-sm space-y-1.5">
                  <Row label="Parcelle" value={verdict.dossier.parcelle_ref} />
                  <Row label="Lieu" value={`${verdict.dossier.parcelle_quartier} · ${verdict.dossier.parcelle_commune}`} />
                  <Row label="Vendeur" value={verdict.dossier.vendeur_nom} />
                  <Row label="Acheteur" value={verdict.dossier.acheteur_nom} />
                  <Row label="Statut" value={verdict.dossier.statut} />
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs uppercase text-muted mb-2">Étapes validées</p>
                  <ul className="space-y-1.5">
                    {verdict.checkpoints.map((c) => (
                      <li key={c.id} className="flex justify-between text-xs">
                        <span className="font-medium">{c.etape}</span>
                        <span className="text-muted">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}
