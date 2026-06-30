import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

if (!supabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[KandoFoncier] VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquants dans apps/web/.env — l'app fonctionnera en mode dégradé jusqu'à ce que tu les renseignes.",
  );
}

// Placeholder si env manquant : évite le crash au démarrage. Tout appel
// réseau échouera proprement et la bannière de setup s'affichera.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type Dossier = {
  id: string;
  chef_id: string;
  parcelle_ref: string;
  parcelle_quartier: string;
  parcelle_commune: string;
  parcelle_superficie: number | null;
  vendeur_nom: string;
  vendeur_phone: string;
  acheteur_nom: string;
  acheteur_phone: string;
  mode: "presentiel" | "distanciel";
  statut: "INIT" | "VENDEUR_OK" | "ACHETEUR_OK" | "SCELLE_COUTUMIER";
  document_hash: string | null;
  created_at: string;
};

export type Checkpoint = {
  id: number;
  dossier_id: string;
  etape: "CREATION" | "VENDEUR" | "ACHETEUR" | "COUTUMIER" | "NOTAIRE" | "ANDF";
  audio_hash: string | null;
  document_hash: string | null;
  current_hash: string;
  bitcoin_proof: string | null;
  signer_phone: string | null;
  created_at: string;
};
