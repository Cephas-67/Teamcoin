import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export type AuthUser = User;

// ─── Auth Email · Supabase (réel) ───────────────────────────────────────────
// Le role est passe dans data (metadata) et sera lu par le trigger SQL
// handle_new_user pour creer un profil avec le bon role au premier signup.
export type SignupRole = "chef_quartier" | "agent_mairie" | "admin";

export async function sendEmailOtp(email: string, role?: SignupRole): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: role ? { role } : undefined,
      emailRedirectTo: typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : undefined,
    },
  });
  if (error) throw new Error(error.message);
}

export async function verifyEmailOtp(email: string, token: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Utilisateur introuvable après vérification");
  return data.user;
}

// ─── Auth Téléphone · pure simulation (zéro Supabase) ───────────────────────
// Pour la démo : l'OTP 040305 valide n'importe quel numéro et stocke un
// "chef de démo" en localStorage. Aucun appel réseau, aucun email envoyé.

const DEMO_SESSION_KEY = "kando-demo-session";
const DEMO_CHEFS_KEY = "kando-demo-chefs";

export type DemoSession = {
  chefId: string;
  phone: string;
  since: number;
};

export function loginWithPhoneDemo(e164: string): DemoSession {
  // UUID stable par numéro · même phone → même chef_id à chaque login.
  const chefs = readChefMap();
  if (!chefs[e164]) {
    chefs[e164] = crypto.randomUUID();
    localStorage.setItem(DEMO_CHEFS_KEY, JSON.stringify(chefs));
  }
  const session: DemoSession = { chefId: chefs[e164], phone: e164, since: Date.now() };
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

function readChefMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DEMO_CHEFS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

// ─── Identité unifiée (utilisée par les pages) ──────────────────────────────
export type Chef = {
  id: string;
  source: "email" | "phone-demo";
  email?: string;
  phone?: string;
};

export async function getCurrentChef(): Promise<Chef | null> {
  const { data } = await supabase.auth.getUser();
  if (data.user) return { id: data.user.id, source: "email", email: data.user.email ?? undefined };
  const demo = getDemoSession();
  if (demo) return { id: demo.chefId, source: "phone-demo", phone: demo.phone };
  return null;
}

// ─── Session globale ────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  localStorage.removeItem(DEMO_SESSION_KEY);
  await supabase.auth.signOut();
}
