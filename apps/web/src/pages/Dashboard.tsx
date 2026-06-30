import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, ShieldCheck, FolderOpen, ArrowRight, LayoutDashboard, MapPin } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { KpiCard } from "../components/KpiCard";
import { LinkButton } from "../components/Button";
import { supabase, type Dossier } from "../lib/supabase";
import { useSession } from "../hooks/useSession";

const STATUT_LABEL: Record<Dossier["statut"], string> = {
  INIT: "En attente vendeur",
  VENDEUR_OK: "En attente acheteur",
  ACHETEUR_OK: "Prêt à sceller",
  SCELLE_COUTUMIER: "Scellé coutumier",
};

const STATUT_TONE: Record<Dossier["statut"], string> = {
  INIT: "bg-warn/15 text-warn",
  VENDEUR_OK: "bg-info/15 text-info",
  ACHETEUR_OK: "bg-info/15 text-info",
  SCELLE_COUTUMIER: "bg-accent/15 text-accent",
};

export default function Dashboard() {
  const { user } = useSession();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("dossiers")
      .select("*")
      .eq("chef_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDossiers(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const total = dossiers.length;
  const enCours = dossiers.filter((d) => d.statut !== "SCELLE_COUTUMIER").length;
  const scelles = dossiers.filter((d) => d.statut === "SCELLE_COUTUMIER").length;

  return (
    <>
      <PageHeader
        eyebrowIcon={LayoutDashboard}
        eyebrow="Pilotage"
        title="Mes dossiers"
        subtitle="Vue d'ensemble des ventes foncières en cours et scellées."
        actions={
          <>
            <LinkButton to="/verifier" variant="outline" size="md">
              <ShieldCheck className="w-4 h-4" />
              Vérifier
            </LinkButton>
            <LinkButton to="/dossier/nouveau" variant="primary" size="md">
              <FilePlus2 className="w-4 h-4" />
              Nouveau dossier
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4 mb-7">
        <div className="col-span-12 md:col-span-4">
          <KpiCard label="Total dossiers" value={total} icon={FolderOpen} trend={`${enCours} en cours`} />
        </div>
        <div className="col-span-12 md:col-span-4">
          <KpiCard label="En attente signature" value={enCours} icon={ShieldCheck} trend="Workflow ouvert" trendColor="up" />
        </div>
        <div className="col-span-12 md:col-span-4">
          <KpiCard label="Scellés coutumiers" value={scelles} icon={MapPin} trend="Ancrés sur Bitcoin" />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Liste des dossiers</h2>
            <p className="text-xs text-muted mt-0.5">Triés par date de création (récent en premier).</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <Th>Date</Th>
                <Th>Parcelle</Th>
                <Th>Vente</Th>
                <Th>Statut</Th>
                <Th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-6 text-muted text-center">Chargement…</td></tr>}
              {!loading && dossiers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-muted text-center">
                  Aucun dossier. <Link to="/dossier/nouveau" className="text-accent underline">Crée le premier</Link>.
                </td></tr>
              )}
              {dossiers.map((d) => (
                <tr key={d.id} className="hover:bg-surface-2 transition-colors border-t border-border">
                  <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-muted">{d.parcelle_ref}</div>
                    <div className="text-sm">{d.parcelle_quartier} · {d.parcelle_commune}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-muted">{d.vendeur_nom}</span>
                    <span className="text-muted mx-2">→</span>
                    <span>{d.acheteur_nom}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUT_TONE[d.statut]}`}>
                      {STATUT_LABEL[d.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/dossier/${d.id}?role=chef`} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      Ouvrir <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Th({ children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted" {...rest}>{children}</th>;
}
