import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, Users, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { PhoneInput } from "../components/PhoneInput";
import { FileScan } from "../components/FileScan";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";

const inputCls = "w-full h-11 px-3.5 rounded-md bg-bg border border-border text-sm focus:border-accent focus:outline-none transition-colors";

type Mode = "presentiel" | "distanciel";

export default function NouveauDossier() {
  const navigate = useNavigate();
  const { user } = useSession();

  const [parcelleRef, setParcelleRef] = useState("");
  const [quartier, setQuartier] = useState("");
  const [commune, setCommune] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [vendeurNom, setVendeurNom] = useState("");
  const [vendeurPhone, setVendeurPhone] = useState("");
  const [vendeurPhoneOk, setVendeurPhoneOk] = useState(false);
  const [acheteurNom, setAcheteurNom] = useState("");
  const [acheteurPhone, setAcheteurPhone] = useState("");
  const [acheteurPhoneOk, setAcheteurPhoneOk] = useState(false);
  const [document, setDocument] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("presentiel");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Session expirée");
    if (!parcelleRef || !quartier || !commune) return toast.error("Champs parcelle requis");
    if (!vendeurNom || !vendeurPhoneOk) return toast.error("Vendeur incomplet");
    if (!acheteurNom || !acheteurPhoneOk) return toast.error("Acheteur incomplet");

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("dossiers")
        .insert({
          chef_id: user.id,
          parcelle_ref: parcelleRef,
          parcelle_quartier: quartier,
          parcelle_commune: commune,
          parcelle_superficie: superficie ? Number(superficie) : null,
          vendeur_nom: vendeurNom,
          vendeur_phone: vendeurPhone,
          acheteur_nom: acheteurNom,
          acheteur_phone: acheteurPhone,
          mode,
          document_hash: documentHash,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("dossier_checkpoints").insert({
        dossier_id: data.id,
        etape: "CREATION",
        document_hash: documentHash,
        current_hash: documentHash ?? data.id,
      });

      toast.success("Dossier créé");
      navigate(`/dossier/${data.id}?role=chef`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrowIcon={FilePlus2}
        eyebrow="Création"
        title="Nouveau dossier foncier"
        subtitle="Renseigne les parties, la parcelle et choisis le mode de traitement."
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card title="1 · Parcelle">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="N° d'état des lieux" required>
                <input className={inputCls} placeholder="EDL-2026-0421" value={parcelleRef} onChange={(e) => setParcelleRef(e.target.value)} />
              </Field>
              <Field label="Superficie (m²)">
                <input className={inputCls} type="number" placeholder="500" value={superficie} onChange={(e) => setSuperficie(e.target.value)} />
              </Field>
              <Field label="Quartier" required>
                <input className={inputCls} placeholder="Akpakpa" value={quartier} onChange={(e) => setQuartier(e.target.value)} />
              </Field>
              <Field label="Commune" required>
                <input className={inputCls} placeholder="Cotonou" value={commune} onChange={(e) => setCommune(e.target.value)} />
              </Field>
            </div>

            <div className="mt-4">
              <FileScan
                label="Plan topo ou accord de base"
                hint="PDF ou image · l'empreinte SHA-256 sera calculée et scellée."
                onChange={(file, hash) => { setDocument(file); setDocumentHash(hash); }}
              />
            </div>
          </Card>

          <Card title="2 · Parties">
            <div className="space-y-5">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-muted mb-3">Vendeur</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nom complet" required>
                    <input className={inputCls} placeholder="M. Koffi Adjovi" value={vendeurNom} onChange={(e) => setVendeurNom(e.target.value)} />
                  </Field>
                  <PhoneInput
                    label="Numéro de téléphone"
                    onChange={(e164, complete) => { setVendeurPhone(e164); setVendeurPhoneOk(complete); }}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-muted mb-3">Acheteur</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nom complet" required>
                    <input className={inputCls} placeholder="Mme Chantal Hounkpe" value={acheteurNom} onChange={(e) => setAcheteurNom(e.target.value)} />
                  </Field>
                  <PhoneInput
                    label="Numéro de téléphone"
                    onChange={(e164, complete) => { setAcheteurPhone(e164); setAcheteurPhoneOk(complete); }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="3 · Mode de traitement">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeCard
                selected={mode === "presentiel"}
                onClick={() => setMode("presentiel")}
                icon={Users}
                title="Présentiel"
                desc="Vendeur et acheteur dans le bureau du Chef. Tout se fait sur cet appareil."
              />
              <ModeCard
                selected={mode === "distanciel"}
                onClick={() => setMode("distanciel")}
                icon={Share2}
                title="Distanciel"
                desc="On génère 2 liens à partager par WhatsApp. Chaque partie signe depuis son téléphone."
              />
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface border border-border rounded-xl p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold mb-3">Récapitulatif</h2>
            <ul className="text-sm space-y-2 mb-5">
              <Recap label="Parcelle" value={parcelleRef || "—"} ok={!!parcelleRef} />
              <Recap label="Vendeur" value={vendeurNom || "—"} ok={!!vendeurNom && vendeurPhoneOk} />
              <Recap label="Acheteur" value={acheteurNom || "—"} ok={!!acheteurNom && acheteurPhoneOk} />
              <Recap label="Document" value={document ? "✓ chargé" : "—"} ok={!!document} />
              <Recap label="Mode" value={mode === "presentiel" ? "Présentiel" : "Distanciel"} ok={true} />
            </ul>

            <Button variant="primary" size="lg" className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le dossier"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}{required && <span className="text-danger ml-0.5">*</span>}</span>
      {children}
    </label>
  );
}

function Recap({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`truncate text-right ${ok ? "text-accent" : "text-text"}`}>{value}</span>
    </li>
  );
}

function ModeCard({ selected, onClick, icon: Icon, title, desc }: { selected: boolean; onClick: () => void; icon: typeof Users; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-md border transition-colors ${
        selected
          ? "border-accent bg-accent/5"
          : "border-border bg-bg hover:border-border-strong"
      }`}
    >
      <Icon className={`w-5 h-5 mb-2 ${selected ? "text-accent" : "text-muted"}`} />
      <div className="font-semibold text-sm mb-1">{title}</div>
      <p className="text-xs text-muted leading-relaxed">{desc}</p>
    </button>
  );
}
