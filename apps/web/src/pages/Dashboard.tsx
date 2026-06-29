import { useEffect, useState } from "react";
import { FilePlus2, ShieldCheck, FileText, MapPin, Wrench, Compass, LayoutDashboard, ArrowRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { KpiCard } from "../components/KpiCard";
import { LinkButton } from "../components/Button";

type Acte = {
  id: string;
  parcelle_ref: string;
  parcelle_ville: string;
  acheteur_nom: string;
  vendeur_nom: string;
  combined_hash: string;
  created_at: string;
};

export default function Dashboard() {
  const [actes, setActes] = useState<Acte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/actes")
      .then((r) => r.json())
      .then((data: Acte[]) => {
        setActes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = actes.length;
  const villes = new Set(actes.map((a) => a.parcelle_ville)).size;
  const parcelles = new Set(actes.map((a) => a.parcelle_ref)).size;
  const recents = actes.slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrowIcon={LayoutDashboard}
        eyebrow="Pilotage"
        title="Tableau de bord"
        subtitle="Vue d'ensemble du ledger foncier et des actes récents."
        actions={
          <>
            <LinkButton to="/verifier" variant="outline" size="md">
              <ShieldCheck className="w-4 h-4" />
              Vérifier
            </LinkButton>
            <LinkButton to="/notariser" variant="primary" size="md">
              <FilePlus2 className="w-4 h-4" />
              Nouvel acte
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4 mb-7">
        <div className="col-span-12 md:col-span-4">
          <KpiCard
            label="Actes notarisés"
            value={total}
            icon={FileText}
            trend={`${villes} ville${villes > 1 ? "s" : ""} couverte${villes > 1 ? "s" : ""}`}
            to="/explorer"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <KpiCard
            label="Parcelles uniques"
            value={parcelles}
            icon={MapPin}
            trend="Suivi par référence cadastrale"
            to="/explorer"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <KpiCard
            label="Ancrages en attente"
            value={total}
            icon={Wrench}
            trend="Batch OpenTimestamps simulé"
            trendColor="up"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold">Derniers actes notarisés</h2>
                <p className="text-xs text-muted mt-0.5">5 dernières opérations enregistrées</p>
              </div>
              <LinkButton to="/explorer" variant="ghost" size="sm">
                <span>Tout voir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </LinkButton>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted border-b border-border">Date</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted border-b border-border">Parcelle</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted border-b border-border">Vente</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted border-b border-border">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={4} className="px-4 py-6 text-muted text-center">Chargement…</td></tr>
                  )}
                  {!loading && recents.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-muted text-center">Aucun acte. Va sur Notariser pour créer le premier.</td></tr>
                  )}
                  {recents.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-muted">{a.parcelle_ref}</div>
                        <div className="text-sm">{a.parcelle_ville}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {a.vendeur_nom} → <span className="text-text">{a.acheteur_nom}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {a.combined_hash.slice(0, 12)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface border border-border rounded-xl p-5 h-full">
            <h2 className="text-sm font-semibold mb-1">Actions rapides</h2>
            <p className="text-xs text-muted mb-4">Trois gestes pour piloter le ledger.</p>
            <div className="flex flex-col gap-2">
              <LinkButton to="/notariser" variant="outline" size="sm" className="justify-start">
                <FilePlus2 className="w-4 h-4" /> Notariser un acte
              </LinkButton>
              <LinkButton to="/verifier" variant="outline" size="sm" className="justify-start">
                <ShieldCheck className="w-4 h-4" /> Vérifier un document
              </LinkButton>
              <LinkButton to="/explorer" variant="outline" size="sm" className="justify-start">
                <Compass className="w-4 h-4" /> Explorer le ledger
              </LinkButton>
            </div>

            <div className="h-px bg-border my-5" />

            <h2 className="text-sm font-semibold mb-3">Aide</h2>
            <p className="text-xs text-muted leading-relaxed">
              Chaque acte est scellé via un hash SHA-256 du couple <span className="text-text">document + audio</span>.
              L'ancrage Bitcoin se fait par batch via OpenTimestamps. Aucune donnée sensible n'est publiée
              sur la blockchain.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
