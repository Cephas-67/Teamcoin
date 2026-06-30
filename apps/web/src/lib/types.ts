// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Gandehou · types TypeScript miroirs du schéma Supabase                   ║
// ║ Source de vérité : supabase/schema.sql                                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─── Enums (alignés sur les CHECK constraints SQL) ──────────────────────────

export type ProfileRole = "chef_quartier" | "agent_mairie" | "admin";

export type DossierStatut =
  | "brouillon"        // créé par le chef, pas encore attesté
  | "atteste_cq"       // attestation provisoire signée par le CQ, ancrée OTS
  | "valide_mairie"    // convention finale validée par la Mairie, second ancrage
  | "litige";          // marqué litigieux (démo : badge rouge)

export type Zone = "urbaine" | "rurale";

export type DocumentType = "attestation_provisoire" | "convention_finale";

export type OtsStatus =
  | "pending"      // preuve soumise, pas encore minée
  | "confirmed"    // ancrée dans un bloc Bitcoin confirmé
  | "mismatch";    // hash recalculé != hash ancré

// ─── profiles ───────────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  commune: string | null;
  arrondissement: string | null;
  quartier: string | null;
  created_at: string;
};

// ─── dossiers ───────────────────────────────────────────────────────────────

export type Dossier = {
  id: string;
  statut: DossierStatut;

  vendeur_nom: string;
  vendeur_cip: string | null;
  vendeur_phone: string | null;

  acheteur_nom: string;
  acheteur_cip: string | null;
  acheteur_phone: string | null;
  acheteur_nationalite: string | null;

  departement: string | null;
  commune: string;
  arrondissement: string | null;
  quartier: string;
  zone: Zone;

  parcelle_ref: string | null;
  superficie_m2: number | null;
  voisin_nord: string | null;
  voisin_sud: string | null;
  voisin_est: string | null;
  voisin_ouest: string | null;

  origine_droit: string | null;
  origine_reference: string | null;

  projet_mise_valeur: string | null;

  cree_par: string | null;

  flag_etranger_zone_rurale: boolean;
  flag_superficie_seuil: boolean;

  created_at: string;
  updated_at: string;
};

// Payload de création (champs auto-gérés exclus)
export type DossierInput = Omit<
  Dossier,
  "id" | "statut" | "created_at" | "updated_at" | "flag_etranger_zone_rurale" | "flag_superficie_seuil"
> & {
  statut?: DossierStatut;
};

// ─── documents ──────────────────────────────────────────────────────────────

export type Document = {
  id: string;
  dossier_id: string;
  type: DocumentType;

  storage_bucket: string;
  storage_path: string;

  // sha256 = hash ANCRÉ sur Bitcoin.
  // - Si pas d'audio : sha256 == pdf_sha256
  // - Si audio       : sha256 == combinedHash(pdf_sha256, audio_sha256)
  sha256: string;
  pdf_sha256: string | null;
  hash_parent: string | null;

  // Audio attaché (optionnel) · enregistrement vocal du consentement
  audio_storage_path: string | null;
  audio_sha256: string | null;

  // Signature biométrique WebAuthn / Passkey (optionnel)
  signataire_pubkey_hash: string | null;
  signataire_credential_id: string | null;
  signataire_pubkey_jwk: Record<string, unknown> | null;
  signataire_nom: string | null;

  // Ancrage Bitcoin
  ots_status: OtsStatus;
  ots_proof_path: string | null;
  ots_block_height: number | null;
  ots_confirmed_at: string | null;

  qr_code_url: string | null;

  created_by: string | null;
  created_at: string;
};

export type DocumentInput = Omit<
  Document,
  "id" | "ots_status" | "ots_proof_path" | "ots_block_height" | "ots_confirmed_at" | "created_at"
>;

// ─── dossier_status_history ─────────────────────────────────────────────────

export type StatusHistoryEntry = {
  id: number;
  dossier_id: string;
  ancien_statut: DossierStatut | null;
  nouveau_statut: DossierStatut;
  acteur: string | null;
  acteur_label: string | null;
  commentaire: string | null;
  changed_at: string;
};

// ─── Vues composées (lecture seule, jointures côté app) ─────────────────────

// Dossier + ses documents (pour la page /dossier/:id)
export type DossierAvecDocuments = Dossier & {
  documents: Document[];
};

// Dossier + dernier document (pour les listes du dashboard)
export type DossierAvecDernierDocument = Dossier & {
  dernier_document: Document | null;
};

// ─── Buckets Supabase Storage ───────────────────────────────────────────────
// Constantes pour éviter les fautes de frappe disséminées dans le code

export const STORAGE_BUCKETS = {
  PROVISOIRES: "documents-provisoires",
  DEFINITIFS: "documents-definitifs",
  OTS_PROOFS: "ots-proofs",
  AUDIO: "documents-audio",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
