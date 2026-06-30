// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Edge Function · upgrade-ots                                              ║
// ║                                                                          ║
// ║ Tâche planifiée qui tente de passer les preuves "pending" en "confirmed" ║
// ║ en interrogeant les calendriers OpenTimestamps.                          ║
// ║                                                                          ║
// ║ Déclenchement : pg_cron (toutes les 30 minutes par défaut).              ║
// ║                                                                          ║
// ║ Comportement :                                                           ║
// ║   1. Liste les documents avec ots_status = 'pending' (limite 50)         ║
// ║   2. Pour chacun : télécharge la preuve, tente l'upgrade                 ║
// ║   3. Si confirmed : réuploade la nouvelle preuve, met à jour la ligne    ║
// ║   4. Sinon : laisse en pending pour la prochaine itération               ║
// ║                                                                          ║
// ║ Le rythme réel de confirmation Bitcoin :                                 ║
// ║   • bloc Bitcoin moyen : ~10 min                                         ║
// ║   • agrégation OTS : entre 1h et 6h selon les calendriers utilisés       ║
// ║   • cas extrêmes : jusqu'à 24h                                           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { corsHeaders, corsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";
import { upgradeProof } from "../_shared/ots.ts";

const OTS_BUCKET = "ots-proofs";
const BATCH_SIZE = 50;

type UpgradeStats = {
  scanned: number;
  upgraded: number;
  stillPending: number;
  errors: { documentId: string; error: string }[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();

  const stats: UpgradeStats = { scanned: 0, upgraded: 0, stillPending: 0, errors: [] };

  try {
    const supabase = getAdminClient();

    // 1. Liste des documents en attente
    const { data: pending, error } = await supabase
      .from("documents")
      .select("id, dossier_id, ots_proof_path")
      .eq("ots_status", "pending")
      .not("ots_proof_path", "is", null)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw new Error(`Liste pending : ${error.message}`);
    stats.scanned = pending?.length ?? 0;

    for (const doc of pending ?? []) {
      try {
        // 2. Téléchargement de la preuve actuelle
        const { data: blob, error: dlErr } = await supabase.storage
          .from(OTS_BUCKET)
          .download(doc.ots_proof_path as string);
        if (dlErr || !blob) {
          throw new Error(`Download .ots : ${dlErr?.message ?? "blob vide"}`);
        }
        const proofBytes = new Uint8Array(await blob.arrayBuffer());

        // 3. Tentative d'upgrade · réseau requis (calendriers + bitcoin)
        const result = await upgradeProof(proofBytes);

        if (result.status === "confirmed") {
          // Réuploade la preuve enrichie
          const { error: upErr } = await supabase.storage
            .from(OTS_BUCKET)
            .upload(doc.ots_proof_path as string, result.proofBytes, {
              contentType: "application/octet-stream",
              upsert: true,
            });
          if (upErr) throw new Error(`Réupload .ots : ${upErr.message}`);

          // Met à jour la ligne avec confirmation Bitcoin
          const { error: updErr } = await supabase
            .from("documents")
            .update({
              ots_status: "confirmed",
              ots_block_height: result.blockHeight,
              ots_confirmed_at: result.bitcoinTimestamp
                ? new Date(result.bitcoinTimestamp * 1000).toISOString()
                : new Date().toISOString(),
            })
            .eq("id", doc.id);
          if (updErr) throw new Error(`Update confirmed : ${updErr.message}`);

          stats.upgraded++;
        } else {
          stats.stillPending++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        stats.errors.push({ documentId: doc.id, error: msg });
      }
    }

    return jsonResponse({ ok: true, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ ok: false, error: message, stats }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
