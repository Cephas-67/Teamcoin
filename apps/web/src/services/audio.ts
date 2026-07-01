import { sha256OfFile } from "@gandehou/ledger";
import { supabase } from "../lib/supabase";
import { STORAGE_BUCKETS } from "../lib/types";

// ==========================================================================
// Service audio · enregistrement vocal du consentement (bipartite)
//
// Chaque partie (vendeur + acheteur) enregistre son propre audio de
// consentement. Le hash de chaque audio entre dans le combined hash ancre
// sur Bitcoin (cascade canonique : cf. packages/ledger::combinedHashCascade).
//
// Convention de path : <dossierId>/<documentId>/<party>-consentement.<ext>
// ==========================================================================

export type Party = "vendeur" | "acheteur";

export type UploadedAudio = {
  party: Party;
  storagePath: string;
  sha256: string;
  publicUrl: string;
  sizeBytes: number;
};

/**
 * Uploade un enregistrement audio pour une partie donnee.
 * Retourne les infos a passer a createDocumentBundle.
 */
export async function uploadAudio(
  dossierId: string,
  documentId: string,
  party: Party,
  audioBlob: Blob,
): Promise<UploadedAudio> {
  const ext = blobExtension(audioBlob);
  const storagePath = `${dossierId}/${documentId}/${party}-consentement.${ext}`;

  const sha256 = await sha256OfFile(audioBlob);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .upload(storagePath, audioBlob, {
      contentType: audioBlob.type || "audio/webm",
      upsert: true,
    });
  if (error) throw new Error(`uploadAudio(${party}) : ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKETS.AUDIO).getPublicUrl(storagePath);

  return {
    party,
    storagePath,
    sha256,
    publicUrl: data.publicUrl,
    sizeBytes: audioBlob.size,
  };
}

/**
 * Telecharge un audio depuis Storage (pour le lecteur audio du verifier).
 */
export async function downloadAudio(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .download(storagePath);
  if (error || !data) throw new Error(`downloadAudio : ${error?.message ?? "blob vide"}`);
  return data;
}

function blobExtension(blob: Blob): string {
  const type = blob.type.toLowerCase();
  if (type.includes("webm")) return "webm";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  if (type.includes("mp3") || type.includes("mpeg")) return "mp3";
  return "webm";
}
