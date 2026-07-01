// ============================================================================
// Edge Function · verify-proof (bipartite)
//
// Verification cryptographique REELLE d'un document Gandehou :
//   1. Recupere la ligne documents (colonnes bipartites)
//   2. Telecharge le PDF + la preuve .ots
//   3. Recalcule le hash PDF, verifie qu'il matche pdf_sha256 en base
//   4. Pour chaque piece bipartite presente (audio vendeur/acheteur) :
//      telecharge, recalcule le hash, verifie match
//   5. Recalcule le combined hash cascade et le verifie contre la .ots
//   6. Renvoie verdict : confirmed | pending | mismatch | invalid
//
// Aligne sur anchor-document::computeCascade et
// packages/ledger::combinedHashCascade.
//
// Contrat :
//   POST { documentId: string }     (mode A · UUID)
//   POST { sha256: string }         (mode B · hash brut du fichier depose)
//
// Effet de bord : si verdict === mismatch, met a jour ots_status en base.
// ============================================================================

import { corsHeaders, corsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";
import { sha256OfBytes, verifyProof } from "../_shared/ots.ts";

const OTS_BUCKET = "ots-proofs";
const AUDIO_BUCKET = "documents-audio";

async function computeCascade(input: {
  pdf: string;
  vendeurAudio: string | null;
  vendeurSig: string | null;
  acheteurAudio: string | null;
  acheteurSig: string | null;
}): Promise<string> {
  const enc = new TextEncoder();
  let acc = input.pdf.toLowerCase();
  const ordered = [
    input.vendeurAudio,
    input.vendeurSig,
    input.acheteurAudio,
    input.acheteurSig,
  ];
  for (const h of ordered) {
    if (!h) continue;
    const bytes = enc.encode(`${acc}::${h.toLowerCase()}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    acc = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return acc;
}

const COLS = `
  id, dossier_id, storage_bucket, storage_path,
  sha256, pdf_sha256,
  vendeur_audio_path, vendeur_audio_sha256, vendeur_pubkey_hash,
  acheteur_audio_path, acheteur_audio_sha256, acheteur_pubkey_hash,
  ots_proof_path
`;

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

    // 1. Recuperation du document
    let doc: any;
    if (documentId) {
      const { data, error } = await supabase
        .from("documents").select(COLS).eq("id", documentId).maybeSingle();
      if (error) throw new Error(`Lecture document : ${error.message}`);
      doc = data;
    } else {
      const { data, error } = await supabase
        .from("documents").select(COLS).eq("sha256", sha256Input!.toLowerCase()).maybeSingle();
      if (error) throw new Error(`Lecture document par hash : ${error.message}`);
      doc = data;
    }

    if (!doc) {
      return jsonResponse({
        ok: true,
        verdict: "invalid",
        reason: "Aucun document Gandehou ne correspond. Le fichier n'a jamais ete ancre ou a ete modifie.",
      });
    }

    if (!doc.ots_proof_path) {
      return jsonResponse({
        ok: true,
        verdict: "invalid",
        reason: `Document ${doc.id} jamais ancre (ots_proof_path null).`,
      });
    }

    // 2. Telechargement parallele PDF + preuve .ots
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

    // 3. Verification du hash PDF
    const pdfHashActuel = await sha256OfBytes(await pdfDl.data.arrayBuffer());
    const pdfHashAttendu = (doc.pdf_sha256 ?? doc.sha256).toLowerCase();

    if (pdfHashActuel !== pdfHashAttendu) {
      await supabase.from("documents").update({ ots_status: "mismatch" }).eq("id", doc.id);
      return jsonResponse({
        ok: true,
        verdict: "mismatch",
        reason: "Le PDF en Storage a ete altere depuis l'ancrage.",
        expectedPdfHash: pdfHashAttendu,
        actualPdfHash: pdfHashActuel,
      });
    }

    // 4. Verification bipartite des audios (si presents)
    for (const [party, path, expected] of [
      ["vendeur", doc.vendeur_audio_path, doc.vendeur_audio_sha256],
      ["acheteur", doc.acheteur_audio_path, doc.acheteur_audio_sha256],
    ] as const) {
      if (!path) continue;
      const { data: audioBlob, error: audioErr } = await supabase.storage
        .from(AUDIO_BUCKET).download(path);
      if (audioErr || !audioBlob) {
        return jsonResponse({
          ok: true,
          verdict: "mismatch",
          reason: `Audio ${party} attendu introuvable (${path}).`,
          party,
        });
      }
      const actual = await sha256OfBytes(await audioBlob.arrayBuffer());
      if (actual !== (expected ?? "").toLowerCase()) {
        await supabase.from("documents").update({ ots_status: "mismatch" }).eq("id", doc.id);
        return jsonResponse({
          ok: true,
          verdict: "mismatch",
          reason: `L'audio ${party} en Storage a ete altere depuis l'ancrage.`,
          party,
          expectedAudioHash: expected,
          actualAudioHash: actual,
        });
      }
    }

    // 5. Recalcul du combined hash cascade et verification crypto
    const combinedActuel = await computeCascade({
      pdf: pdfHashActuel,
      vendeurAudio: doc.vendeur_audio_sha256 ?? null,
      vendeurSig: doc.vendeur_pubkey_hash ?? null,
      acheteurAudio: doc.acheteur_audio_sha256 ?? null,
      acheteurSig: doc.acheteur_pubkey_hash ?? null,
    });

    const otsBytes = new Uint8Array(await otsDl.data.arrayBuffer());
    const result = await verifyProof(otsBytes, combinedActuel);

    if (result.verdict === "mismatch") {
      await supabase.from("documents").update({ ots_status: "mismatch" }).eq("id", doc.id);
    }

    return jsonResponse({
      ok: true,
      documentId: doc.id,
      dossierId: doc.dossier_id,
      hash: combinedActuel,
      pdfHash: pdfHashActuel,
      hasVendeurAudio: !!doc.vendeur_audio_path,
      hasAcheteurAudio: !!doc.acheteur_audio_path,
      hasVendeurSig: !!doc.vendeur_pubkey_hash,
      hasAcheteurSig: !!doc.acheteur_pubkey_hash,
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
