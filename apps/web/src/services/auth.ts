import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export type AuthUser = User;

// Mot de passe synthétique pour l'auth téléphone (démo).
// On dérive l'email du numéro pour garder un user stable par téléphone.
const PHONE_DOMAIN = "kando.demo";
const PHONE_PASSWORD = "kando-phone-demo-2026";

function phoneToEmail(e164: string): string {
  return `${e164.replace("+", "")}@${PHONE_DOMAIN}`;
}

export async function signInWithPhoneDemo(e164: string): Promise<AuthUser> {
  const email = phoneToEmail(e164);
  // Tente la connexion · si l'user n'existe pas, on l'inscrit puis on retente.
  const tryIn = await supabase.auth.signInWithPassword({ email, password: PHONE_PASSWORD });
  if (tryIn.data.user) return tryIn.data.user;

  const signUp = await supabase.auth.signUp({
    email,
    password: PHONE_PASSWORD,
    options: { data: { phone: e164, auth_method: "phone-demo" } },
  });
  if (signUp.error) throw new Error(signUp.error.message);
  if (signUp.data.session?.user) return signUp.data.session.user;

  // Pas de session immédiate · re-tente le login (cas où email confirmation est OFF).
  const retry = await supabase.auth.signInWithPassword({ email, password: PHONE_PASSWORD });
  if (retry.error) throw new Error(retry.error.message);
  if (!retry.data.user) throw new Error("Connexion impossible · vérifie que 'Confirm email' est désactivé dans Supabase");
  return retry.data.user;
}

export async function sendEmailOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : undefined,
    },
  });
  if (error) throw new Error(error.message);
}

export async function verifyEmailOtp(email: string, token: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Utilisateur introuvable après vérification");
  return data.user;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}
