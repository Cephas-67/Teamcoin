import { useEffect, useState } from "react";

type Acte = {
  id: string;
  parcelle_ref: string;
  parcelle_ville: string;
  acheteur_nom: string;
  vendeur_nom: string;
  combined_hash: string;
  created_at: number;
};

export default function Explorer() {
  const [actes, setActes] = useState<Acte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/actes")
      .then((r) => r.json())
      .then((data: Acte[]) => {
        setActes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="container py-12 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold">Explorer foncier</h1>
        <p className="text-muted-foreground">Tous les actes notarisés et ancrés sur Bitcoin via OpenTimestamps.</p>
      </div>

      {loading && <p className="text-muted-foreground">Chargement…</p>}

      {!loading && actes.length === 0 && (
        <p className="text-muted-foreground italic">Aucun acte pour le moment. Va sur <a href="/notariser" className="text-primary underline">Notariser</a> pour créer le premier.</p>
      )}

      <div className="grid gap-3">
        {actes.map((a) => (
          <div key={a.id} className="p-4 rounded-lg border border-border bg-background hover:border-primary/40 transition">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-display text-lg font-semibold">{a.parcelle_ref} · {a.parcelle_ville}</p>
                <p className="text-sm text-muted-foreground">{a.vendeur_nom} → {a.acheteur_nom}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
            <p className="text-xs font-mono mt-2 break-all text-muted-foreground">{a.combined_hash}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
