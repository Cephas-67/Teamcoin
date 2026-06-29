export type Acte = {
  id: string;
  parcelle: Parcelle;
  acheteur: Personne;
  vendeur: Personne;
  documentHash: string;
  audioHash: string;
  combinedHash: string;
  signature: string;
  otsProof?: string;
  createdAt: number;
};

export type Parcelle = {
  reference: string;
  ville: string;
  lat?: number;
  lng?: number;
  superficie?: number;
};

export type Personne = {
  nom: string;
  cip?: string;
  publicKey?: string;
};

export type VerificationResult =
  | { status: "valid"; acte: Acte }
  | { status: "invalid"; reason: string }
  | { status: "not_found" };
