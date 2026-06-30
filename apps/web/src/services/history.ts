import { supabase } from "../lib/supabase";
import type { StatusHistoryEntry } from "../lib/types";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service history · piste d'audit des changements de statut                ║
// ║                                                                          ║
// ║ La table est alimentée automatiquement par le trigger SQL                ║
// ║ log_status_change (voir supabase/schema.sql). Côté app, on ne fait que   ║
// ║ lire. C'est volontaire : on évite le risque "oubli de logger".           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const TABLE = "dossier_status_history";

export async function getHistory(dossierId: string): Promise<StatusHistoryEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("dossier_id", dossierId)
    .order("changed_at", { ascending: true });
  if (error) throw new Error(`getHistory: ${error.message}`);
  return (data ?? []) as StatusHistoryEntry[];
}

// Ajout manuel d'une entrée d'historique avec commentaire libre.
// Le trigger SQL gère déjà les changements de statut automatiques ;
// cette fonction sert pour les annotations explicites (ex : "rejeté car bornage incomplet").
export async function annoterHistory(
  dossierId: string,
  nouveau_statut: StatusHistoryEntry["nouveau_statut"],
  ancien_statut: StatusHistoryEntry["ancien_statut"],
  commentaire: string,
  acteurId?: string,
  acteurLabel?: string,
): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    dossier_id: dossierId,
    nouveau_statut,
    ancien_statut,
    commentaire,
    acteur: acteurId ?? null,
    acteur_label: acteurLabel ?? null,
  });
  if (error) throw new Error(`annoterHistory: ${error.message}`);
}
