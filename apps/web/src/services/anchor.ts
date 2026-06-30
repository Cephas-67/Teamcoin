import { supabase } from "../lib/supabase";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service anchor · interface client vers l'Edge Function anchor-document    ║
// ║                                                                          ║
// ║ Le frontend n'invoque JAMAIS OpenTimestamps directement :                ║
// ║   • mauvaise idée sécurité (logique d'ancrage côté client = manipulable) ║
// ║   • mauvaise idée fiabilité (le navigateur peut fermer mid-stamp)        ║
// ║                                                                          ║
// ║ À la place : on appelle l'Edge Function qui télécharge le PDF depuis     ║
// ║ Storage, recalcule le hash, et soumet à OpenTimestamps côté serveur.     ║
// ║                                                                          ║
// ║ supabase.functions.invoke() gère automatiquement :                       ║
// ║   • l'URL de l'Edge Function (pas besoin du PROJECT_REF en clair)        ║
// ║   • les headers d'authentification (Authorization Bearer anon_key)       ║
// ║   • la sérialisation JSON et la gestion d'erreur                         ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type AnchorResponse =
  | { ok: true; status: "pending"; hash: string; proofPath: string; message: string; alreadyAnchored?: boolean }
  | { ok: true; alreadyAnchored: true; status: "pending" | "confirmed"; hash: string }
  | { ok: false; error: string; dbHash?: string; fileHash?: string };

/**
 * Demande l'ancrage Bitcoin d'un document déjà uploadé dans Storage.
 *
 * Cycle attendu côté UI :
 *   1. UI affiche "Ancrage en cours..." (spinner jaune, statut OTS pending)
 *   2. Appel anchorDocument(documentId)
 *   3. À résolution : refresh de la ligne documents → ots_status visible
 *
 * À noter : la résolution de cette promesse signifie "preuve soumise au
 * calendrier OTS", PAS "confirmée par Bitcoin". La confirmation arrive
 * plusieurs heures plus tard et est gérée par le cron upgrade-ots.
 */
export async function anchorDocument(documentId: string): Promise<AnchorResponse> {
  const { data, error } = await supabase.functions.invoke<AnchorResponse>(
    "anchor-document",
    { body: { documentId } },
  );

  if (error) {
    return { ok: false, error: error.message ?? "Erreur Edge Function inconnue" };
  }
  if (!data) {
    return { ok: false, error: "Réponse vide de anchor-document" };
  }
  return data;
}

/**
 * Force une passe manuelle du cron upgrade-ots (utile pour la démo : on ne
 * veut pas attendre 30 minutes que pg_cron fire pendant le pitch).
 *
 * En prod, cette fonction est appelée automatiquement par pg_cron.
 * On expose un bouton "Vérifier maintenant" dans le dashboard admin pour
 * pouvoir déclencher manuellement pendant la démo.
 */
export type UpgradeStats = {
  scanned: number;
  upgraded: number;
  stillPending: number;
  errors: { documentId: string; error: string }[];
};

export async function triggerUpgradeNow(): Promise<{ ok: boolean; stats?: UpgradeStats; error?: string }> {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; stats: UpgradeStats }>(
    "upgrade-ots",
    { body: {} },
  );

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Réponse vide" };
  return data;
}
