import { createClient } from "@supabase/supabase-js";

// ─── Client Supabase global ─────────────────────────────────────────────────
// Toutes les requêtes (DB, Auth, Storage) passent par ce client unique.
// Les types métier vivent dans lib/types.ts (source : supabase/schema.sql).

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

if (!supabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Gandehou] VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquants dans apps/web/.env. L'app fonctionnera en mode dégradé jusqu'à ce que tu les renseignes.",
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

// Réexport pratique des types (un seul import pour le code applicatif).
export type {
  Profile,
  ProfileRole,
  Dossier,
  DossierInput,
  DossierStatut,
  Document,
  DocumentInput,
  DocumentType,
  OtsStatus,
  StatusHistoryEntry,
  DossierAvecDocuments,
  DossierAvecDernierDocument,
  Zone,
  StorageBucket,
} from "./types";

export { STORAGE_BUCKETS } from "./types";
