// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Edge Function · anchor-document                                          ║
// ║                                                                          ║
// ║ Ancrage Bitcoin via OpenTimestamps d'un document déjà uploadé.           ║
// ║                                                                          ║
// ║ Contrat d'entrée  : POST { documentId: string }                          ║
// ║ Contrat de sortie : 200 { ok: true, status: "pending", hash, proofPath } ║
// ║                     4xx { ok: false, error }                             ║
// ║                                                                          ║
// ║ Étapes :                                                                 ║
// ║   1. Lire la ligne `documents` (bucket + path + sha256 attendu)          ║
// ║   2. Télécharger le PDF depuis le bucket                                 ║
// ║   3. Recalculer SHA-256 et vérifier qu'il correspond                     ║
// ║      (garde-fou : on n'ancre jamais un hash dont on n'a pas le fichier)  ║
// ║   4. Appeler OpenTimestamps stamp() → preuve "pending"                   ║
// ║   5. Uploader le .ots dans le bucket ots-proofs                          ║
// ║   6. Mettre à jour documents.ots_proof_path + ots_status = "pending"     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { corsHeaders, corsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";
import { sha256OfBytes, stampHash } from "../_shared/ots.ts";

const OTS_BUCKET = "ots-proofs";

// Combine pdf + audio + signature en cascade :
//   acc = pdf
//   si audio :     acc = SHA-256(acc + "::" + audio_hash)
//   si signature : acc = SHA-256(acc + "::" + sig_hash)
// Doit rester aligné sur combinedHash() de packages/ledger/hash.ts.
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
    if (!documentId) {
      return jsonResponse(
        { ok: false, error: "documentId requis dans le body JSON" },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();

    // 1. Lecture du document
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("id, dossier_id, storage_bucket, storage_path, sha256, pdf_sha256, audio_storage_path, audio_sha256, signataire_pubkey_hash, ots_status, ots_proof_path")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr) throw new Error(`Lecture document : ${docErr.message}`);
    if (!doc) {
      return jsonResponse(
        { ok: false, error: `Document ${documentId} introuvable` },
        { status: 404 },
      );
    }

    // Idempotence : on se base sur la présence d'un fichier .ots, PAS sur le statut.
    // Le défaut de ots_status est 'pending' dès l'insert, donc on ne peut pas s'en servir
    // comme indicateur de "déjà ancré". Le vrai signal, c'est ots_proof_path renseigné.
    if (doc.ots_proof_path) {
      return jsonResponse({
        ok: true,
        alreadyAnchored: true,
        status: doc.ots_status,
        hash: doc.sha256,
        proofPath: doc.ots_proof_path,
      });
    }

    // 2. Téléchargement du PDF
    const { data: blob, error: dlErr } = await supabase.storage
      .from(doc.storage_bucket)
      .download(doc.storage_path);
    if (dlErr || !blob) {
      throw new Error(
        `Téléchargement PDF (${doc.storage_bucket}/${doc.storage_path}) : ${dlErr?.message ?? "blob vide"}`,
      );
    }

    // 3. Recalcul SHA-256 du PDF
    const bytes = await blob.arrayBuffer();
    const pdfHash = await sha256OfBytes(bytes);
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

    // 3bis. Si audio attaché : télécharger + vérifier son hash
    if (doc.audio_storage_path) {
      const { data: audioBlob, error: audioErr } = await supabase.storage
        .from("documents-audio")
        .download(doc.audio_storage_path);
      if (audioErr || !audioBlob) {
        throw new Error(`Téléchargement audio (${doc.audio_storage_path}) : ${audioErr?.message ?? "blob vide"}`);
      }
      const audioHash = await sha256OfBytes(await audioBlob.arrayBuffer());
      if (audioHash.toLowerCase() !== (doc.audio_sha256 ?? "").toLowerCase()) {
        return jsonResponse(
          { ok: false, error: "Hash audio divergent", dbAudioHash: doc.audio_sha256, fileAudioHash: audioHash },
          { status: 409 },
        );
      }
    }

    // 3ter. Recalculer le combined hash (ce qui SERA ancré sur Bitcoin)
    //       = pdf_sha256 [+ audio_sha256] [+ signataire_pubkey_hash]
    const combined = await computeCombinedHash(
      pdfHash,
      doc.audio_sha256 ?? null,
      doc.signataire_pubkey_hash ?? null,
    );
    if (combined.toLowerCase() !== doc.sha256.toLowerCase()) {
      return jsonResponse(
        {
          ok: false,
          error: "Hash combiné divergent (PDF + audio + signature). Possible corruption ou mauvais calcul côté client.",
          dbCombined: doc.sha256,
          recomputedCombined: combined,
        },
        { status: 409 },
      );
    }

    // 4. Création de la preuve OTS sur le combined hash
    const { proofBytes } = await stampHash(combined);

    // 5. Upload de la preuve dans ots-proofs
    const proofPath = `${doc.dossier_id}/${doc.id}.ots`;
    const { error: upErr } = await supabase.storage
      .from(OTS_BUCKET)
      .upload(proofPath, proofBytes, {
        contentType: "application/octet-stream",
        upsert: true,
      });
    if (upErr) throw new Error(`Upload .ots : ${upErr.message}`);

    // 6. Mise à jour du document
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
      audioHash: doc.audio_sha256 ?? null,
      signatureHash: doc.signataire_pubkey_hash ?? null,
      proofPath,
      message:
        "Preuve soumise au calendrier OpenTimestamps. Agrégation Bitcoin dans quelques heures.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
