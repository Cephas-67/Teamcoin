// Service · captures citoyen (audio + photo piece d'identite) au niveau
// dossier. Utilise par DossierForm au moment de la soumission, AVANT que
// le CQ ne cree un document.
//
// L'audio est stocke dans le bucket documents-audio (public) car il est
// lie a la preuve d'ancrage OTS. La photo de la piece d'identite va dans
// pieces-identite (PRIVE : donnees personnelles).
//
// Convention de path :
//   documents-audio      : <dossierId>/citoyen-<party>-consentement.<ext>
//   pieces-identite      : <dossierId>/<party>-piece.<ext>

import { supabase } from "../lib/supabase";
import { STORAGE_BUCKETS } from "../lib/types";

const PIECES_BUCKET = "pieces-identite";

export type Party = "vendeur" | "acheteur";

export type UploadedCitizenAudio = {
  path: string;
  sha256: string;
  publicUrl: string;
};

export type UploadedCitizenPiece = {
  path: string;
  sha256: string;
  mime: string;
};

// ---------- Helpers ---------------------------------------------------------

async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extFromMime(mime: string, fallback: string): string {
  const t = mime.toLowerCase();
  if (t.includes("webm")) return "webm";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("wav")) return "wav";
  if (t.includes("mp3") || t.includes("mpeg")) return "mp3";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("heic")) return "heic";
  if (t.includes("heif")) return "heif";
  if (t.includes("pdf")) return "pdf";
  return fallback;
}

// ---------- Audio de consentement ------------------------------------------

export async function uploadCitizenAudio(
  dossierId: string,
  party: Party,
  blob: Blob,
): Promise<UploadedCitizenAudio> {
  const ext = extFromMime(blob.type, "webm");
  const path = `${dossierId}/citoyen-${party}-consentement.${ext}`;
  const sha256 = await sha256Hex(blob);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .upload(path, blob, {
      contentType: blob.type || "audio/webm",
      upsert: true,
    });
  if (error) throw new Error(`uploadCitizenAudio(${party}) : ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKETS.AUDIO).getPublicUrl(path);
  return { path, sha256, publicUrl: data.publicUrl };
}

// ---------- Piece d'identite (photo ou PDF) --------------------------------

const ALLOWED_ID_MIME = [
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/heic", "image/heif",
];
const MAX_ID_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadCitizenPiece(
  dossierId: string,
  party: Party,
  file: File,
): Promise<UploadedCitizenPiece> {
  const mime = file.type || "application/octet-stream";
  const nameOk = /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name);
  if (!ALLOWED_ID_MIME.includes(mime) && !nameOk) {
    throw new Error("Format non accepte pour la piece d'identite (PDF, JPG, PNG, WEBP, HEIC).");
  }
  if (file.size <= 0) throw new Error("Fichier vide.");
  if (file.size > MAX_ID_SIZE) throw new Error("Fichier trop lourd (5 MB max).");

  const ext = extFromMime(mime, "jpg");
  const path = `${dossierId}/${party}-piece.${ext}`;
  const sha256 = await sha256Hex(file);

  const { error } = await supabase.storage
    .from(PIECES_BUCKET)
    .upload(path, file, { contentType: mime, upsert: true });
  if (error) throw new Error(`uploadCitizenPiece(${party}) : ${error.message}`);

  return { path, sha256, mime };
}
