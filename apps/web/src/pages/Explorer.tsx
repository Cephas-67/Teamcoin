import { useEffect, useMemo, useState } from "react";
import { Compass, Search, ArrowUpRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

type Acte = {
  id: string;
  parcelle_ref: string;
  parcelle_ville: string;
  acheteur_nom: string;
  vendeur_nom: string;
  combined_hash: string;
  created_at: string;
};

export default function Explorer() {
  const [actes, setActes] = useState<Acte[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/actes")
      .then((r) => r.json())
      .then((data: Acte[]) => {
        setActes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return actes;
    const t = q.toLowerCase();
    return actes.filter(
      (a) =>
        a.parcelle_ref.toLowerCase().includes(t) ||
        a.parcelle_ville.toLowerCase().includes(t) ||
        a.acheteur_nom.toLowerCase().includes(t) ||
        a.vendeur_nom.toLowerCase().includes(t),
    );
  }, [actes, q]);

  return (
    <>
      <PageHeader
        eyebrowIcon={Compass}
        eyebrow="Explorer public"
        title="Ledger foncier"
        subtitle="Tous les actes notarisés et leurs hashes. Lecture publique, vérifiable à tout moment."
      />

      <div className="bg-surface border border-border rounded-xl p-4 mb-4">
        <label className="block">
          <span className="sr-only">Rechercher</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrer par parcelle, ville, vendeur ou acheteur…"
              className="w-full h-11 pl-10 pr-4 rounded-md bg-bg border border-border text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </label>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <Th>Date</Th>
                <Th>Parcelle</Th>
                <Th>Vendeur → Acheteur</Th>
                <Th>Hash combiné</Th>
                <Th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-6 text-muted text-center">Chargement…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-muted text-center">
                  {actes.length === 0
                    ? "Aucun acte notarisé pour le moment."
                    : "Aucun résultat pour cette recherche."}
                </td></tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-surface-2 transition-colors border-t border-border">
                  <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-muted">{a.parcelle_ref}</div>
                    <div className="text-sm">{a.parcelle_ville}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-muted">{a.vendeur_nom}</span>
                    <span className="text-muted mx-2">→</span>
                    <span>{a.acheteur_nom}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {a.combined_hash.slice(0, 16)}…{a.combined_hash.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/actes/${a.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
                    >
                      JSON
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">
        {filtered.length} acte{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        {q && actes.length !== filtered.length ? ` sur ${actes.length}` : ""}.
      </p>
    </>
  );
}

function Th({ children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted" {...rest}>
      {children}
    </th>
  );
}
