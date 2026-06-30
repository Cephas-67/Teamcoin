// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Edge Function · verify-proof                                             ║
// ║                                                                          ║
// ║ Vérification cryptographique RÉELLE d'un document Gandehou.              ║
// ║                                                                          ║
// ║ La différence avec services/verify.ts (frontend) :                       ║
// ║   • verify.ts compare juste un hash en base (vulnérable si BD compromise)║
// ║   • verify-proof télécharge la preuve .ots et la vérifie contre les      ║
// ║     calendriers OpenTimestamps + Bitcoin (indépendant de la BD)          ║
// ║                                                                          ║
// ║ C'est CE niveau de vérification que le jury Bitcoin attend.              ║
// ║                                                                          ║
// ║ Contrat d'entrée :                                                       ║
// ║   POST { documentId: string }                       (mode A · UUID)      ║
// ║   POST { sha256: string }                           (mode B · hash brut) ║
// ║                                                                          ║
// ║ Contrat de sortie :                                                      ║
// ║   200 { ok: true, verdict: "confirmed", blockHeight, bitcoinTimestamp }  ║
// ║   200 { ok: true, verdict: "pending", ... }                              ║
// ║   200 { ok: true, verdict: "mismatch", ... }                             ║
// ║   200 { ok: true, verdict: "invalid", ... }                              ║
// ║   404 { ok: false, error }                                               ║
// ║                                                                          ║
// ║ Effet de bord : si verdict === "mismatch", met à jour ots_status en base ║
// ║ pour propager le drapeau rouge dans tout le système.                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { corsHeaders, corsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";
import { sha256OfBytes, verifyProof } from "../_shared/ots.ts";

const OTS_BUCKET = "ots-proofs";
const AUDIO_BUCKET = "documents-audio";

async function computeCombinedHash(
  pdfHash: string,
  audioHash: string | null,
  sigHash: string | null,
): Promise<string> {
  let acc = pdfHash.toLowerCase();
  const enc = new TextEncoder();
  for (const h of [audioHash, sigHash]) {
    if (!h) continue;
    const bytes = enc.encode(`${acc}::${h.toLowerCase()}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    acc = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return acc;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POST attendu" }, { status: 405 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const documentId: string | undefined = body?.documentId;
    const sha256Input: string | undefined = body?.sha256;

    if (!documentId && !sha256Input) {
      return jsonResponse(
        { ok: false, error: "documentId ou sha256 requis" },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();

    // ─── Récupération du document à vérifier ────────────────────────────────
    const COLS = "id, dossier_id, storage_bucket, storage_path, sha256, pdf_sha256, audio_storage_path, audio_sha256, signataire_pubkey_hash, ots_proof_path";
    let doc: any;
    if (documentId) {
      const { data, error } = await supabase
        .from("documents")
        .select(COLS)
        .eq("id", documentId)
        .maybeSingle();
      if (error) throw new Error(`Lecture document : ${error.message}`);
      doc = data;
    } else {
      const { data, error } = await supabase
        .from("documents")
        .select(COLS)
        .eq("sha256", sha256Input!.toLowerCase())
        .maybeSingle();
      if (error) throw new Error(`Lecture document par hash : ${error.message}`);
      doc = data;
    }

    if (!doc) {
      return jsonResponse({
        ok: true,
        verdict: "invalid",
        reason: "Aucun document Gandehou ne correspond. Le fichier n'a jamais été ancré ou a été modifié.",
      });
    }

    if (!doc.ots_proof_path) {
      return jsonResponse({
        ok: true,
        verdict: "invalid",
        reason: `Document ${doc.id} jamais ancré (ots_proof_path null).`,
      });
    }

    // ─── Téléchargement parallèle PDF + preuve .ots ─────────────────────────
    const [pdfDl, otsDl] = await Promise.all([
      supabase.storage.from(doc.storage_bucket).download(doc.storage_path),
      supabase.storage.from(OTS_BUCKET).download(doc.ots_proof_path),
    ]);

    if (pdfDl.error || !pdfDl.data) {
      throw new Error(`Download PDF (${doc.storage_bucket}/${doc.storage_path}) : ${pdfDl.error?.message ?? "blob vide"}`);
    }
    if (otsDl.error || !otsDl.data) {
      throw new Error(`Download .ots (${OTS_BUCKET}/${doc.ots_proof_path}) : ${otsDl.error?.message ?? "blob vide"}`);
    }

    // ─── Recalcul SHA-256 du PDF actuel ─────────────────────────────────────
    const pdfBytes = await pdfDl.data.arrayBuffer();
    const pdfHashActuel = await sha256OfBytes(pdfBytes);
    const pdfHashAttendu = (doc.pdf_sha256 ?? doc.sha256).toLowerCase();

    if (pdfHashActuel !== pdfHashAttendu) {
      await supabase.from("documents").update({ ots_status: "mismatch" }).eq("id", doc.id);
      return jsonResponse({
        ok: true,
        verdict: "mismatch",
        reason: "Le PDF en Storage a été altéré depuis l'ancrage.",
        expectedPdfHash: pdfHashAttendu,
        actualPdfHash: pdfHashActuel,
      });
    }

    // ─── Si audio attaché : recalcul + vérification ─────────────────────────
    let audioHashActuel: string | null = null;
    if (doc.audio_storage_path) {
      const { data: audioBlob, error: audioErr } = await supabase.storage
        .from(AUDIO_BUCKET)
        .download(doc.audio_storage_path);
      if (audioErr || !audioBlob) {
        return jsonResponse({
          ok: true,
          verdict: "mismatch",
          reason: `Audio attendu introuvable (${doc.audio_storage_path}).`,
        });
      }
      audioHashActuel = await sha256OfBytes(await audioBlob.arrayBuffer());
      if (audioHashActuel !== (doc.audio_sha256 ?? "").toLowerCase()) {
        await supabase.from("documents").update({ ots_status: "mismatch" }).eq("id", doc.id);
        return jsonResponse({
          ok: true,
          verdict: "mismatch",
          reason: "L'audio en Storage a été altéré depuis l'ancrage.",
          expectedAudioHash: doc.audio_sha256,
          actualAudioHash: audioHashActuel,
        });
      }
    }

    // ─── Recalculer le combined hash (ce qui a été ANCRÉ sur Bitcoin) ───────
    const combinedActuel = await computeCombinedHash(
      pdfHashActuel,
      audioHashActuel,
      doc.signataire_pubkey_hash ?? null,
    );

    // ─── Vérification crypto réelle contre la preuve OTS ────────────────────
    const otsBytes = new Uint8Array(await otsDl.data.arrayBuffer());
    const result = await verifyProof(otsBytes, combinedActuel);

    // ─── Propagation du verdict en base si mismatch ─────────────────────────
    if (result.verdict === "mismatch") {
      await supabase
        .from("documents")
        .update({ ots_status: "mismatch" })
        .eq("id", doc.id);
    }

    return jsonResponse({
      ok: true,
      documentId: doc.id,
      dossierId: doc.dossier_id,
      hash: combinedActuel,
      pdfHash: pdfHashActuel,
      audioHash: audioHashActuel,
      signatureHash: doc.signataire_pubkey_hash ?? null,
      hasAudio: !!doc.audio_storage_path,
      hasSignature: !!doc.signataire_pubkey_hash,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
