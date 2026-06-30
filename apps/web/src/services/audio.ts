import { sha256OfFile } from "@gandehou/ledger";
import { supabase } from "../lib/supabase";
import { STORAGE_BUCKETS } from "../lib/types";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service audio · enregistrement vocal du consentement                     ║
// ║                                                                          ║
// ║ Cas d'usage Béninois : Maman Chantal illettrée enregistre 10s en Fon     ║
// ║ ("Je, Chantal, achète la parcelle ABC..."). L'audio est uploadé puis     ║
// ║ son hash combiné avec celui du PDF est ancré sur Bitcoin.                ║
// ║                                                                          ║
// ║ La vérification publique pourra rejouer l'audio + comparer le hash.      ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type UploadedAudio = {
  storagePath: string;
  sha256: string;
  publicUrl: string;
  sizeBytes: number;
};

/**
 * Uploade un enregistrement audio (Blob webm/ogg/wav) dans le bucket dédié,
 * calcule son SHA-256, et renvoie les infos à attacher au document.
 *
 * Convention de path : <dossierId>/<documentId>/consentement.<ext>
 */
export async function uploadAudio(
  dossierId: string,
  documentId: string,
  audioBlob: Blob,
): Promise<UploadedAudio> {
  const ext = blobExtension(audioBlob);
  const storagePath = `${dossierId}/${documentId}/consentement.${ext}`;

  const sha256 = await sha256OfFile(audioBlob);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .upload(storagePath, audioBlob, {
      contentType: audioBlob.type || "audio/webm",
      upsert: true,
    });
  if (error) throw new Error(`uploadAudio : ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKETS.AUDIO).getPublicUrl(storagePath);

  return {
    storagePath,
    sha256,
    publicUrl: data.publicUrl,
    sizeBytes: audioBlob.size,
  };
}

/**
 * Télécharge un audio depuis Storage (pour le lecteur audio du verifier).
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
