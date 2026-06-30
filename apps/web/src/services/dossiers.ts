import { supabase } from "../lib/supabase";
import type {
  Dossier,
  DossierInput,
  DossierStatut,
  DossierAvecDocuments,
  DossierAvecDernierDocument,
  Document,
} from "../lib/types";
import { evaluerReglesAndf } from "./regles-andf";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service dossiers · cœur métier de Gandehou                               ║
// ║                                                                          ║
// ║ Un dossier = 1 transaction foncière. Statuts :                           ║
// ║   brouillon → atteste_cq → valide_mairie (+ litige en cas de problème)   ║
// ║                                                                          ║
// ║ Le moteur de règles ANDF (regles-andf.ts) calcule les flags juridiques   ║
// ║ avant chaque insert/update pour rester en base avec la donnée.           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const TABLE = "dossiers";

// ─── Lecture ────────────────────────────────────────────────────────────────

export async function getDossier(id: string): Promise<Dossier | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getDossier: ${error.message}`);
  return data as Dossier | null;
}

export async function getDossierAvecDocuments(id: string): Promise<DossierAvecDocuments | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, documents(*)")
    .eq("id", id)
    .order("created_at", { foreignTable: "documents", ascending: true })
    .maybeSingle();
  if (error) throw new Error(`getDossierAvecDocuments: ${error.message}`);
  return data as DossierAvecDocuments | null;
}

export type ListDossiersOptions = {
  statut?: DossierStatut;
  creePar?: string;       // filtrer par chef_id (chef de quartier ne voit que les siens)
  commune?: string;       // filtrer par commune (agent mairie ne voit que sa commune)
  limit?: number;
};

export async function listDossiers(opts: ListDossiersOptions = {}): Promise<Dossier[]> {
  let q = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (opts.statut) q = q.eq("statut", opts.statut);
  if (opts.creePar) q = q.eq("cree_par", opts.creePar);
  if (opts.commune) q = q.eq("commune", opts.commune);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw new Error(`listDossiers: ${error.message}`);
  return (data ?? []) as Dossier[];
}

// Variante enrichie pour les listes de dashboard : 1 requête, 1 join, 1 doc max.
export async function listDossiersAvecDernierDocument(
  opts: ListDossiersOptions = {},
): Promise<DossierAvecDernierDocument[]> {
  const dossiers = await listDossiers(opts);
  if (dossiers.length === 0) return [];

  const ids = dossiers.map((d) => d.id);
  const { data: docs, error } = await supabase
    .from("documents")
    .select("*")
    .in("dossier_id", ids)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listDossiersAvecDernierDocument: ${error.message}`);

  const dernierParDossier = new Map<string, Document>();
  for (const d of (docs ?? []) as Document[]) {
    if (!dernierParDossier.has(d.dossier_id)) dernierParDossier.set(d.dossier_id, d);
  }

  return dossiers.map((d) => ({
    ...d,
    dernier_document: dernierParDossier.get(d.id) ?? null,
  }));
}

// ─── Écriture ───────────────────────────────────────────────────────────────

export async function createDossier(input: DossierInput): Promise<Dossier> {
  const flags = evaluerReglesAndf(input);
  const payload = {
    ...input,
    statut: input.statut ?? "brouillon",
    flag_etranger_zone_rurale: flags.etrangerZoneRurale,
    flag_superficie_seuil: flags.superficieSeuil,
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();
  if (error) throw new Error(`createDossier: ${error.message}`);
  return data as Dossier;
}

export async function updateDossier(id: string, patch: Partial<Dossier>): Promise<Dossier> {
  // Si des champs liés aux règles ANDF changent, on recalcule les flags.
  const champsCritiques: (keyof Dossier)[] = [
    "zone", "acheteur_nationalite", "superficie_m2",
  ];
  const recalculer = champsCritiques.some((k) => k in patch);

  let finalPatch: Partial<Dossier> = { ...patch };
  if (recalculer) {
    const courant = await getDossier(id);
    if (courant) {
      const flags = evaluerReglesAndf({ ...courant, ...patch });
      finalPatch = {
        ...finalPatch,
        flag_etranger_zone_rurale: flags.etrangerZoneRurale,
        flag_superficie_seuil: flags.superficieSeuil,
      };
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(finalPatch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateDossier: ${error.message}`);
  return data as Dossier;
}

export async function changerStatut(id: string, nouveau: DossierStatut): Promise<Dossier> {
  // Le trigger SQL log_status_change historise automatiquement.
  return updateDossier(id, { statut: nouveau });
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Action métier · rejeter un dossier (passage en litige avec motif)        ║
// ║                                                                          ║
// ║ Le trigger SQL log_status_change capture le changement, MAIS sans motif. ║
// ║ Ici on ajoute une annotation manuelle dans l'historique pour garder      ║
// ║ trace de POURQUOI le dossier a été rejeté.                               ║
// ║                                                                          ║
// ║ Utilisation typique : agent Mairie qui détecte une incohérence et veut   ║
// ║ bloquer la validation finale.                                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { annoterHistory } from "./history";

export type RejeterDossierInput = {
  motif: string;
  acteurId?: string;
  acteurLabel?: string;  // ex : "Agent Mairie Abomey-Calavi"
};

export async function rejeterDossier(
  id: string,
  { motif, acteurId, acteurLabel }: RejeterDossierInput,
): Promise<Dossier> {
  if (!motif || motif.trim().length < 10) {
    throw new Error("Motif de rejet trop court (10 caractères minimum).");
  }

  const courant = await getDossier(id);
  if (!courant) throw new Error(`Dossier ${id} introuvable.`);
  if (courant.statut === "litige") {
    throw new Error("Ce dossier est déjà en litige.");
  }

  // 1. Changement de statut (le trigger SQL l'enregistre automatiquement)
  const ancien = courant.statut;
  const rejete = await updateDossier(id, { statut: "litige" });

  // 2. Annotation manuelle avec le motif (le trigger n'a pas accès au motif)
  await annoterHistory(id, "litige", ancien, `REJET · ${motif.trim()}`, acteurId, acteurLabel);

  return rejete;
}

export async function deleteDossier(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`deleteDossier: ${error.message}`);
}
