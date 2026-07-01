// ============================================================================
// Edge Function · anchor-document
//
// Ancrage Bitcoin via OpenTimestamps d'un document deja uploade.
// Version BIPARTITE (vendeur + acheteur audio/signature).
//
// Contrat d'entree : POST { documentId: string }
// Contrat de sortie :
//   200 { ok: true, status: "pending", hash, pdfHash, cascade[], proofPath }
//   4xx { ok: false, error, ... }
//
// Etapes :
//   1. Lire la ligne `documents` (colonnes bipartites)
//   2. Telecharger le PDF depuis le bucket
//   3. Recalculer SHA-256 du PDF et verifier == pdf_sha256 en base
//   4. Pour chaque piece bipartite presente (vendeur_audio, acheteur_audio) :
//        recalculer son SHA-256 et verifier match avec la base
//   5. Recalculer le combined hash cascade et verifier == documents.sha256
//   6. Appeler OpenTimestamps stamp() sur le combined hash
//   7. Uploader la preuve .ots dans le bucket ots-proofs
//   8. Mettre a jour documents.ots_proof_path + ots_status='pending'
//
// L'ordre de cascade est FIGE. Doit rester aligne sur
// packages/ledger/src/hash.ts::combinedHashCascade.
// ============================================================================

import { corsHeaders, corsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";
import { sha256OfBytes, stampHash } from "../_shared/ots.ts";

const OTS_BUCKET = "ots-proofs";
const AUDIO_BUCKET = "documents-audio";

// Cascade canonique bipartite (5 elements max).
// pdf, vendeur_audio, vendeur_sig, acheteur_audio, acheteur_sig
async function computeCascade(input: {
  pdf: string;
  vendeurAudio: string | null;
  vendeurSig: string | null;
  acheteurAudio: string | null;
  acheteurSig: string | null;
}): Promise<{ hash: string; steps: string[] }> {
  const enc = new TextEncoder();
  let acc = input.pdf.toLowerCase();
  const steps: string[] = [`pdf:${acc}`];

  const ordered = [
    ["vendeur_audio", input.vendeurAudio],
    ["vendeur_sig", input.vendeurSig],
    ["acheteur_audio", input.acheteurAudio],
    ["acheteur_sig", input.acheteurSig],
  ] as const;

  for (const [label, h] of ordered) {
    if (!h) continue;
    const buf = enc.encode(`${acc}::${h.toLowerCase()}`);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    acc = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    steps.push(`${label}:${acc}`);
  }
  return { hash: acc, steps };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POST attendu" }, { status: 405 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const documentId: string | undefined = body?.documentId;
    if (!documentId) {
      return jsonResponse(
        { ok: false, error: "documentId requis dans le body JSON" },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();

    // 1. Lecture du document (colonnes bipartites)
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select(`
        id, dossier_id, storage_bucket, storage_path,
        sha256, pdf_sha256,
        vendeur_audio_path, vendeur_audio_sha256, vendeur_pubkey_hash,
        acheteur_audio_path, acheteur_audio_sha256, acheteur_pubkey_hash,
        ots_status, ots_proof_path
      `)
      .eq("id", documentId)
      .maybeSingle();

    if (docErr) throw new Error(`Lecture document : ${docErr.message}`);
    if (!doc) {
      return jsonResponse(
        { ok: false, error: `Document ${documentId} introuvable` },
        { status: 404 },
      );
    }

    // Idempotence : la presence de ots_proof_path est le vrai signal "deja ancre".
    if (doc.ots_proof_path) {
      return jsonResponse({
        ok: true,
        alreadyAnchored: true,
        status: doc.ots_status,
        hash: doc.sha256,
        proofPath: doc.ots_proof_path,
      });
    }

    // 2. Telechargement du PDF
    const { data: pdfBlob, error: dlErr } = await supabase.storage
      .from(doc.storage_bucket)
      .download(doc.storage_path);
    if (dlErr || !pdfBlob) {
      throw new Error(
        `Telechargement PDF (${doc.storage_bucket}/${doc.storage_path}) : ${dlErr?.message ?? "blob vide"}`,
      );
    }

    // 3. Recalcul et verification du hash PDF
    const pdfHash = await sha256OfBytes(await pdfBlob.arrayBuffer());
    const expectedPdfHash = (doc.pdf_sha256 ?? doc.sha256).toLowerCase();
    if (pdfHash.toLowerCase() !== expectedPdfHash) {
      return jsonResponse(
        {
          ok: false,
          error: "Hash PDF divergent entre ligne DB et fichier Storage",
          dbPdfHash: expectedPdfHash,
          filePdfHash: pdfHash,
        },
        { status: 409 },
      );
    }

    // 4. Verification bipartite des hashs audio (si presents)
    for (const [party, path, expectedHash] of [
      ["vendeur", doc.vendeur_audio_path, doc.vendeur_audio_sha256],
      ["acheteur", doc.acheteur_audio_path, doc.acheteur_audio_sha256],
    ] as const) {
      if (!path) continue;
      const { data: audioBlob, error: audioErr } = await supabase.storage
        .from(AUDIO_BUCKET)
        .download(path);
      if (audioErr || !audioBlob) {
        throw new Error(
          `Telechargement audio ${party} (${path}) : ${audioErr?.message ?? "blob vide"}`,
        );
      }
      const audioHash = await sha256OfBytes(await audioBlob.arrayBuffer());
      if (audioHash.toLowerCase() !== (expectedHash ?? "").toLowerCase()) {
        return jsonResponse(
          {
            ok: false,
            error: `Hash audio ${party} divergent`,
            party,
            dbAudioHash: expectedHash,
            fileAudioHash: audioHash,
          },
          { status: 409 },
        );
      }
    }

    // 5. Cascade et verification du combined hash
    const { hash: combined, steps } = await computeCascade({
      pdf: pdfHash,
      vendeurAudio: doc.vendeur_audio_sha256 ?? null,
      vendeurSig: doc.vendeur_pubkey_hash ?? null,
      acheteurAudio: doc.acheteur_audio_sha256 ?? null,
      acheteurSig: doc.acheteur_pubkey_hash ?? null,
    });

    if (combined.toLowerCase() !== doc.sha256.toLowerCase()) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Hash combine divergent (cascade bipartite). Verifier alignement client/serveur.",
          dbCombined: doc.sha256,
          recomputedCombined: combined,
          steps,
        },
        { status: 409 },
      );
    }

    // 6. Creation de la preuve OTS sur le combined hash
    const { proofBytes } = await stampHash(combined);

    // 7. Upload de la preuve dans ots-proofs
    const proofPath = `${doc.dossier_id}/${doc.id}.ots`;
    const { error: upErr } = await supabase.storage
      .from(OTS_BUCKET)
      .upload(proofPath, proofBytes, {
        contentType: "application/octet-stream",
        upsert: true,
      });
    if (upErr) throw new Error(`Upload .ots : ${upErr.message}`);

    // 8. Mise a jour du document
    const { error: updErr } = await supabase
      .from("documents")
      .update({
        ots_status: "pending",
        ots_proof_path: proofPath,
      })
      .eq("id", documentId);
    if (updErr) throw new Error(`Update document : ${updErr.message}`);

    return jsonResponse({
      ok: true,
      status: "pending",
      hash: combined,
      pdfHash,
      cascade: steps,
      proofPath,
      message:
        "Preuve soumise au calendrier OpenTimestamps. Agregation Bitcoin dans quelques heures.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
