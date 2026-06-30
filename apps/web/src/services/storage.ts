import { supabase } from "../lib/supabase";
import { STORAGE_BUCKETS, type StorageBucket } from "../lib/types";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service storage · upload PDF + preuves .ots dans les buckets Supabase    ║
// ║                                                                          ║
// ║ Buckets attendus (créés manuellement dans Supabase > Storage) :          ║
// ║   • documents-provisoires  (PDF attestations CQ)                         ║
// ║   • documents-definitifs   (PDF conventions Mairie)                      ║
// ║   • ots-proofs             (fichiers .ots OpenTimestamps)                ║
// ║                                                                          ║
// ║ Convention de chemin : <dossierId>/<documentId>.<ext>                    ║
// ║ → on peut lister tous les fichiers d'un dossier d'un seul coup.          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type UploadResult = {
  bucket: StorageBucket;
  path: string;
  publicUrl: string;
};

// Upload générique d'un Blob/File dans un bucket.
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: Blob,
  contentType?: string,
): Promise<UploadResult> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: contentType ?? file.type ?? "application/octet-stream",
  });
  if (error) throw new Error(`uploadFile(${bucket}/${path}): ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { bucket, path, publicUrl: data.publicUrl };
}

// ─── Helpers spécialisés ────────────────────────────────────────────────────

export function uploadPdfProvisoire(
  dossierId: string,
  documentId: string,
  pdf: Blob,
): Promise<UploadResult> {
  const path = `${dossierId}/${documentId}.pdf`;
  return uploadFile(STORAGE_BUCKETS.PROVISOIRES, path, pdf, "application/pdf");
}

export function uploadPdfDefinitif(
  dossierId: string,
  documentId: string,
  pdf: Blob,
): Promise<UploadResult> {
  const path = `${dossierId}/${documentId}.pdf`;
  return uploadFile(STORAGE_BUCKETS.DEFINITIFS, path, pdf, "application/pdf");
}

export function uploadOtsProof(
  dossierId: string,
  documentId: string,
  otsBytes: Uint8Array,
): Promise<UploadResult> {
  const path = `${dossierId}/${documentId}.ots`;
  // Cast pour TS strict : Uint8Array<ArrayBufferLike> -> ArrayBuffer attendu par BlobPart.
  const blob = new Blob([otsBytes as unknown as ArrayBuffer], { type: "application/octet-stream" });
  return uploadFile(STORAGE_BUCKETS.OTS_PROOFS, path, blob);
}

// ─── Téléchargement ─────────────────────────────────────────────────────────

export async function downloadFile(bucket: StorageBucket, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`downloadFile(${bucket}/${path}): ${error.message}`);
  return data;
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// ─── Suppression (utilitaire admin) ─────────────────────────────────────────

export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`deleteFile(${bucket}/${path}): ${error.message}`);
}
