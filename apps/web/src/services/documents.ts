import { supabase } from "../lib/supabase";
import type {
  Document,
  DocumentInput,
  DocumentType,
  OtsStatus,
} from "../lib/types";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service documents · PDF générés + ancrage Bitcoin via OpenTimestamps     ║
// ║                                                                          ║
// ║ Chaque document = 1 ligne en base + 1 fichier dans Storage.              ║
// ║ Chaînage : le hash du document N+1 inclut le hash du document N via      ║
// ║ le champ hash_parent (preuve de provenance).                             ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const TABLE = "documents";

// ─── Lecture ────────────────────────────────────────────────────────────────

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

// Recherche par empreinte SHA-256 · cœur de la vérification publique.
// Renvoie le document qui possède exactement ce hash, ou null si introuvable.
export async function findDocumentBySha256(sha256: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("sha256", sha256)
    .maybeSingle();
  if (error) throw new Error(`findDocumentBySha256: ${error.message}`);
  return data as Document | null;
}

// Renvoie le dernier document d'un type pour un dossier (utile pour chaînage).
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

// ─── Écriture ───────────────────────────────────────────────────────────────

export async function createDocument(input: DocumentInput): Promise<Document> {
  const { data, error } = await supabase.from(TABLE).insert(input).select("*").single();
  if (error) throw new Error(`createDocument: ${error.message}`);
  return data as Document;
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Chaînage de hash · createChainedDocument                                 ║
// ║                                                                          ║
// ║ Insère un document en remplissant automatiquement hash_parent avec le    ║
// ║ sha256 du document précédent du dossier (n'importe quel type, le plus    ║
// ║ récent). Ça construit la chaîne de provenance que le dossier de cadrage  ║
// ║ appelle "preuve d'antériorité chaînée" (section 7.1).                    ║
// ║                                                                          ║
// ║ Refuse si le document précédent n'est pas encore ancré (ots_proof_path   ║
// ║ null) : chaîner sur un parent non-ancré crée une preuve faible.          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type CreateChainedDocumentInput = Omit<DocumentInput, "hash_parent">;

export async function createChainedDocument(
  input: CreateChainedDocumentInput,
): Promise<Document> {
  const parent = await getLatestDocument(input.dossier_id);

  if (parent && !parent.ots_proof_path) {
    throw new Error(
      `Impossible de chaîner sur un document parent non ancré (document ${parent.id}, status=${parent.ots_status}). ` +
      `Attends que l'ancrage Bitcoin soit terminé avant de générer la suite.`,
    );
  }

  return createDocument({
    ...input,
    hash_parent: parent?.sha256 ?? null,
  });
}

// Mise à jour du statut OTS · appelée par le cron upgrade-ots (palier B6)
// ou par l'Edge Function anchor-document après confirmation.
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

// Liste des documents en attente d'ancrage Bitcoin · utilisé par le cron.
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
