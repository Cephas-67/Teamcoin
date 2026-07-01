import { supabase } from "../lib/supabase";
import { combinedHashCascade } from "@gandehou/ledger";
import type {
  Document,
  DocumentInput,
  DocumentType,
  OtsStatus,
} from "../lib/types";
import type { Party, UploadedAudio } from "./audio";
import type { CapturedSignature } from "./signature";

// ==========================================================================
// Service documents (bipartite)
//
// Chaque document = 1 ligne en base + 1 fichier dans Storage.
//
// Cascade canonique bipartite (ordre FIGE) :
//   acc = pdf_sha256
//   +  vendeur_audio_sha256   (si present)
//   +  vendeur_pubkey_hash    (si present)
//   +  acheteur_audio_sha256  (si present)
//   +  acheteur_pubkey_hash   (si present)
//
// C'est CE acc final qui est stocke dans documents.sha256 et qui est
// ancre sur Bitcoin. Ordre FIGE = doit rester aligne sur
// supabase/functions/anchor-document/index.ts::computeCascade.
// ==========================================================================

const TABLE = "documents";

// -------- Lecture -----------------------------------------------------------

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getDocument: ${error.message}`);
  return data as Document | null;
}

export async function listDocumentsForDossier(dossierId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listDocumentsForDossier: ${error.message}`);
  return (data ?? []) as Document[];
}

export async function findDocumentBySha256(sha256: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("sha256", sha256)
    .maybeSingle();
  if (error) throw new Error(`findDocumentBySha256: ${error.message}`);
  return data as Document | null;
}

export async function getLatestDocument(
  dossierId: string,
  type?: DocumentType,
): Promise<Document | null> {
  let q = supabase
    .from(TABLE)
    .select("*")
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (type) q = q.eq("type", type);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(`getLatestDocument: ${error.message}`);
  return data as Document | null;
}

// -------- Ecriture ----------------------------------------------------------

export async function createDocument(input: DocumentInput): Promise<Document> {
  const { data, error } = await supabase.from(TABLE).insert(input).select("*").single();
  if (error) throw new Error(`createDocument: ${error.message}`);
  return data as Document;
}

// -------- Bundle bipartite (PDF + audio v/a + signatures v/a) ---------------

export type PartyCapture = {
  audio?: UploadedAudio | null;
  signature?: CapturedSignature | null;
};

export type CreateDocumentBundleInput = {
  dossier_id: string;
  type: DocumentType;
  storage_bucket: string;
  storage_path: string;
  pdf_sha256: string;
  hash_parent?: string | null;
  qr_code_url?: string | null;
  created_by?: string | null;

  vendeur?: PartyCapture | null;
  acheteur?: PartyCapture | null;
};

/**
 * Cree un document en cascadant les hashs des 2 parties dans l'ordre canonique.
 * Le hash resultant est ce qui sera ancre sur Bitcoin par anchor-document.
 */
export async function createDocumentBundle(
  input: CreateDocumentBundleInput,
): Promise<Document> {
  const v = input.vendeur ?? null;
  const a = input.acheteur ?? null;

  const combinedSha256 = await combinedHashCascade({
    pdf: input.pdf_sha256,
    vendeurAudio: v?.audio?.sha256 ?? null,
    vendeurSig: v?.signature?.publicKeyHash ?? null,
    acheteurAudio: a?.audio?.sha256 ?? null,
    acheteurSig: a?.signature?.publicKeyHash ?? null,
  });

  const payload = {
    dossier_id: input.dossier_id,
    type: input.type,
    storage_bucket: input.storage_bucket,
    storage_path: input.storage_path,
    sha256: combinedSha256,
    pdf_sha256: input.pdf_sha256,
    hash_parent: input.hash_parent ?? null,
    qr_code_url: input.qr_code_url ?? null,
    created_by: input.created_by ?? null,

    vendeur_audio_path: v?.audio?.storagePath ?? null,
    vendeur_audio_sha256: v?.audio?.sha256 ?? null,
    vendeur_pubkey_hash: v?.signature?.publicKeyHash ?? null,
    vendeur_credential_id: v?.signature?.credentialId ?? null,
    vendeur_pubkey_jwk: (v?.signature as unknown as { publicKeyJwk?: unknown })?.publicKeyJwk ?? null,
    vendeur_signataire_nom: v?.signature?.signataireNom ?? null,

    acheteur_audio_path: a?.audio?.storagePath ?? null,
    acheteur_audio_sha256: a?.audio?.sha256 ?? null,
    acheteur_pubkey_hash: a?.signature?.publicKeyHash ?? null,
    acheteur_credential_id: a?.signature?.credentialId ?? null,
    acheteur_pubkey_jwk: (a?.signature as unknown as { publicKeyJwk?: unknown })?.publicKeyJwk ?? null,
    acheteur_signataire_nom: a?.signature?.signataireNom ?? null,
  };

  return createDocument(payload as unknown as DocumentInput);
}

// -------- Chainage vers le document precedent -------------------------------

export type CreateChainedDocumentInput = Omit<DocumentInput, "hash_parent">;

export async function createChainedDocument(
  input: CreateChainedDocumentInput,
): Promise<Document> {
  const parent = await getLatestDocument(input.dossier_id);

  if (parent && !parent.ots_proof_path) {
    throw new Error(
      `Impossible de chainer sur un document parent non ancre (document ${parent.id}, status=${parent.ots_status}). ` +
      `Attends que l'ancrage Bitcoin soit termine avant de generer la suite.`,
    );
  }

  return createDocument({
    ...input,
    hash_parent: parent?.sha256 ?? null,
  });
}

// -------- Update statut OTS -------------------------------------------------

export type UpdateOtsStatusInput = {
  status: OtsStatus;
  otsProofPath?: string;
  blockHeight?: number;
};

export async function updateOtsStatus(
  documentId: string,
  patch: UpdateOtsStatusInput,
): Promise<Document> {
  const update: Partial<Document> = {
    ots_status: patch.status,
  };
  if (patch.otsProofPath) update.ots_proof_path = patch.otsProofPath;
  if (patch.blockHeight !== undefined) update.ots_block_height = patch.blockHeight;
  if (patch.status === "confirmed") update.ots_confirmed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(update)
    .eq("id", documentId)
    .select("*")
    .single();
  if (error) throw new Error(`updateOtsStatus: ${error.message}`);
  return data as Document;
}

export async function listPendingOts(limit = 50): Promise<Document[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("ots_status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`listPendingOts: ${error.message}`);
  return (data ?? []) as Document[];
}
