import { sha256OfFile } from "@gandehou/ledger";
import { supabase } from "../lib/supabase";
import { findDocumentBySha256, getDocument } from "./documents";
import { getDossier } from "./dossiers";
import type { Document, Dossier } from "../lib/types";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service verify · workflow de vérification publique (page /verifier)      ║
// ║                                                                          ║
// ║ Deux niveaux de vérification :                                           ║
// ║                                                                          ║
// ║   • verifyFast()   → simple lookup hash en base (instantané)             ║
// ║   • verifyDeep()   → appelle l'Edge Function verify-proof qui télécharge ║
// ║                      la .ots et vérifie cryptographiquement la preuve    ║
// ║                      contre les calendriers OpenTimestamps + Bitcoin     ║
// ║                                                                          ║
// ║ Le verdict UI à 3 états (charte Bénin) :                                 ║
// ║   • 🟢 confirmed → hash trouvé, ots_status confirmed, preuve crypto OK   ║
// ║   • 🟡 pending   → hash trouvé, en attente d'agrégation Bitcoin          ║
// ║   • 🔴 mismatch  → preuve invalide OU hash non trouvé OU document altéré ║
// ║                                                                          ║
// ║ Reco UX : appeler verifyFast pour l'instantané (badge), puis verifyDeep  ║
// ║ en arrière-plan pour confirmer cryptographiquement. Si verifyDeep dit    ║
// ║ "mismatch", rebasculer le badge en rouge.                                ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type VerifyVerdict =
  | { verdict: "authentique"; document: Document; dossier: Dossier | null; message: string }
  | { verdict: "en_attente"; document: Document; dossier: Dossier | null; message: string }
  | { verdict: "falsifie"; reason: string; sha256?: string }
  | { verdict: "introuvable"; reason: string };

// ─── Mode rapide · simple lookup hash en base ───────────────────────────────

export async function verifyFile(file: File | Blob): Promise<VerifyVerdict> {
  const sha256 = await sha256OfFile(file);
  return verifyBySha256(sha256);
}

export async function verifyBySha256(sha256: string): Promise<VerifyVerdict> {
  const doc = await findDocumentBySha256(sha256);

  if (!doc) {
    return {
      verdict: "introuvable",
      reason:
        "Aucun document Gandehou ne correspond à ce hash. Le fichier n'a jamais été ancré, ou il a été modifié après ancrage.",
    };
  }

  return verdictDepuisDocument(doc);
}

export async function verifyByDocumentId(documentId: string): Promise<VerifyVerdict> {
  const doc = await getDocument(documentId);
  if (!doc) {
    return { verdict: "introuvable", reason: `Document ${documentId} introuvable.` };
  }
  return verdictDepuisDocument(doc);
}

// ─── Mode profond · vérification crypto via Edge Function ───────────────────

export type DeepVerifyResult = {
  ok: boolean;
  documentId?: string;
  dossierId?: string;
  hash?: string;
  verdict: "confirmed" | "pending" | "mismatch" | "invalid";
  reason?: string;
  blockHeight?: number;
  bitcoinTimestamp?: number;
  expectedHash?: string;
  actualHash?: string;
};

/**
 * Vérification cryptographique réelle · télécharge la .ots et la vérifie
 * contre Bitcoin via les calendriers OpenTimestamps. Plus lent (~3-10s) mais
 * indépendant de la base : c'est ce qui prouve qu'un verdict vert est légitime.
 */
export async function verifyDeepByDocumentId(documentId: string): Promise<DeepVerifyResult> {
  const { data, error } = await supabase.functions.invoke<DeepVerifyResult>(
    "verify-proof",
    { body: { documentId } },
  );
  if (error) return { ok: false, verdict: "invalid", reason: error.message };
  if (!data) return { ok: false, verdict: "invalid", reason: "Réponse vide" };
  return data;
}

export async function verifyDeepBySha256(sha256: string): Promise<DeepVerifyResult> {
  const { data, error } = await supabase.functions.invoke<DeepVerifyResult>(
    "verify-proof",
    { body: { sha256 } },
  );
  if (error) return { ok: false, verdict: "invalid", reason: error.message };
  if (!data) return { ok: false, verdict: "invalid", reason: "Réponse vide" };
  return data;
}

export async function verifyFileDeep(file: File | Blob): Promise<DeepVerifyResult> {
  const sha256 = await sha256OfFile(file);
  return verifyDeepBySha256(sha256);
}

// ─── Logique commune · document → verdict UI ────────────────────────────────

async function verdictDepuisDocument(doc: Document): Promise<VerifyVerdict> {
  const dossier = await getDossier(doc.dossier_id);

  switch (doc.ots_status) {
    case "confirmed":
      return {
        verdict: "authentique",
        document: doc,
        dossier,
        message: doc.ots_block_height
          ? `Ancré sur Bitcoin au bloc #${doc.ots_block_height}.`
          : "Ancré sur Bitcoin (hauteur de bloc indisponible).",
      };

    case "pending":
      return {
        verdict: "en_attente",
        document: doc,
        dossier,
        message:
          "Document soumis au calendrier OpenTimestamps, en attente de confirmation Bitcoin (quelques heures).",
      };

    case "mismatch":
      return {
        verdict: "falsifie",
        sha256: doc.sha256,
        reason:
          "Le hash en base ne correspond plus à la preuve ancrée. Document altéré après ancrage.",
      };

    default:
      return {
        verdict: "introuvable",
        reason: `Statut OTS inconnu : ${doc.ots_status}`,
      };
  }
}
