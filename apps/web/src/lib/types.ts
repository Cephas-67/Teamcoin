// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Gandehou · types TypeScript miroirs du schéma Supabase                   ║
// ║ Source de vérité : supabase/schema.sql + migrations                       ║
// ║                                                                          ║
// ║ Bipartite : chaque transaction implique vendeur ET acheteur, chacun      ║
// ║ avec son identifiant (CIP béninois OU passeport), son audio de           ║
// ║ consentement, et sa signature biométrique WebAuthn.                      ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─── Enums (alignés sur les CHECK constraints SQL) ──────────────────────────

export type ProfileRole = "chef_quartier" | "agent_mairie" | "admin";

export type DossierStatut =
  | "brouillon"        // créé, données saisies, pas encore ancré
  | "atteste_cq"       // attestation provisoire signée par le CQ, ancrée OTS
  | "valide_mairie"    // convention finale validée par la Mairie, second ancrage
  | "litige";          // marqué litigieux (badge rouge)

export type Zone = "urbaine" | "rurale";

export type DocumentType = "attestation_provisoire" | "convention_finale";

export type OtsStatus =
  | "pending"      // preuve soumise, pas encore minée
  | "confirmed"    // ancrée dans un bloc Bitcoin confirmé
  | "mismatch";    // hash recalculé != hash ancré

// Type d'identifiant (CFD béninois : CIP pour nationaux, passeport pour étrangers)
export type IdType = "cip" | "passeport";

export type Partie = "vendeur" | "acheteur";

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

  // Vendeur
  vendeur_nom: string;
  vendeur_id_type: IdType | null;
  vendeur_id_value: string | null;   // ex-vendeur_cip (CIP ou n° passeport)
  vendeur_phone: string | null;

  // Acheteur
  acheteur_nom: string;
  acheteur_id_type: IdType | null;
  acheteur_id_value: string | null;  // ex-acheteur_cip (CIP ou n° passeport)
  acheteur_phone: string | null;
  acheteur_nationalite: string | null;  // "beninoise" ou "etrangere" (dérivé de id_type par défaut)

  // Localisation
  departement: string | null;
  commune: string;
  arrondissement: string | null;
  quartier: string;
  zone: Zone;

  // Parcelle
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

  // Drapeaux calculés par le moteur ANDF
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

// ─── documents · schéma bipartite ───────────────────────────────────────────

export type Document = {
  id: string;
  dossier_id: string;
  type: DocumentType;

  storage_bucket: string;
  storage_path: string;

  // sha256 = combined hash ANCRÉ sur Bitcoin.
  // Formule (cascade, ordre stable) :
  //   acc = pdf_sha256
  //   si vendeur_audio_sha256   -> acc = SHA-256(acc :: vendeur_audio_sha256)
  //   si acheteur_audio_sha256  -> acc = SHA-256(acc :: acheteur_audio_sha256)
  //   si vendeur_pubkey_hash    -> acc = SHA-256(acc :: vendeur_pubkey_hash)
  //   si acheteur_pubkey_hash   -> acc = SHA-256(acc :: acheteur_pubkey_hash)
  sha256: string;
  pdf_sha256: string | null;
  hash_parent: string | null;

  // Audio VENDEUR
  vendeur_audio_path: string | null;
  vendeur_audio_sha256: string | null;

  // Audio ACHETEUR
  acheteur_audio_path: string | null;
  acheteur_audio_sha256: string | null;

  // Signature biométrique VENDEUR (WebAuthn/Passkey)
  vendeur_pubkey_hash: string | null;
  vendeur_credential_id: string | null;
  vendeur_pubkey_jwk: Record<string, unknown> | null;
  vendeur_signataire_nom: string | null;

  // Signature biométrique ACHETEUR
  acheteur_pubkey_hash: string | null;
  acheteur_credential_id: string | null;
  acheteur_pubkey_jwk: Record<string, unknown> | null;
  acheteur_signataire_nom: string | null;

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

// ─── Vues composées ─────────────────────────────────────────────────────────

export type DossierAvecDocuments = Dossier & {
  documents: Document[];
};

export type DossierAvecDernierDocument = Dossier & {
  dernier_document: Document | null;
};

// ─── Buckets Supabase Storage ───────────────────────────────────────────────

export const STORAGE_BUCKETS = {
  PROVISOIRES: "documents-provisoires",
  DEFINITIFS: "documents-definitifs",
  OTS_PROOFS: "ots-proofs",
  AUDIO: "documents-audio",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// ─── Bundle input bipartite · pour createDocumentBundle et submitDossierComplete
// Une partie (vendeur OU acheteur) optionnellement munie de son audio + signature.

export type PartieContribution = {
  audio?: {
    blob: Blob;
    sha256: string;  // hash calculé côté client
  };
  signature?: {
    pubkeyHash: string;          // SHA-256(publicKey brute)
    credentialId: string;        // base64url
    publicKeyJwk?: Record<string, unknown>;
    signataireNom?: string;
  };
};

export type BipartiteBundle = {
  vendeur?: PartieContribution;
  acheteur?: PartieContribution;
};
