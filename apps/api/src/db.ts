import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans apps/api/.env",
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export type ActeRow = {
  id: string;
  parcelle_ref: string;
  parcelle_ville: string;
  acheteur_nom: string;
  vendeur_nom: string;
  document_hash: string;
  audio_hash: string;
  combined_hash: string;
  signature: string;
  ots_proof: string | null;
  created_at: string;
};
