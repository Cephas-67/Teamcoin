// Client Supabase côté Edge Function · utilise la service_role key
// pour bypasser RLS. Ne JAMAIS exposer cette clé côté navigateur.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export function getAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis (Project Settings > Edge Functions > Secrets).",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
