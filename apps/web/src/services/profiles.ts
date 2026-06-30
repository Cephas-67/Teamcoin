import { supabase } from "../lib/supabase";
import type { Profile, ProfileRole } from "../lib/types";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service profiles · CRUD léger pour chef_quartier / agent_mairie / admin  ║
// ║ Les fonctions retournent toujours une donnée typée ou lèvent.            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const TABLE = "profiles";

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getProfile: ${error.message}`);
  return data as Profile | null;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("email", email).maybeSingle();
  if (error) throw new Error(`getProfileByEmail: ${error.message}`);
  return data as Profile | null;
}

export async function listProfiles(role?: ProfileRole): Promise<Profile[]> {
  let query = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (role) query = query.eq("role", role);
  const { data, error } = await query;
  if (error) throw new Error(`listProfiles: ${error.message}`);
  return (data ?? []) as Profile[];
}

export type CreateProfileInput = Omit<Profile, "id" | "created_at"> & {
  id?: string;     // si fourni, lie au compte Supabase Auth (auth.uid())
};

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const { data, error } = await supabase.from(TABLE).insert(input).select("*").single();
  if (error) throw new Error(`createProfile: ${error.message}`);
  return data as Profile;
}

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateProfile: ${error.message}`);
  return data as Profile;
}

// Récupère le profile lié à la session Supabase Auth en cours (officiels uniquement).
// Renvoie null si pas de session ou si l'utilisateur n'a pas encore de profil.
export async function getCurrentOfficialProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  return getProfile(auth.user.id);
}
