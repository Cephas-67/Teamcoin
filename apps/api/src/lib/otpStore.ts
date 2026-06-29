// Stockage OTP en mémoire (suffisant pour le hackathon).
// En prod : remplacer par une table Supabase `otp_codes` avec TTL.

type Entry = { otp: string; expiresAt: number };

const store = new Map<string, Entry>();
const TTL_MS = 10 * 60 * 1000;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveOtp(email: string, otp: string) {
  store.set(email.toLowerCase(), { otp, expiresAt: Date.now() + TTL_MS });
}

export function consumeOtp(email: string, otp: string): "ok" | "expired" | "wrong" | "not_found" {
  const key = email.toLowerCase();
  const entry = store.get(key);
  if (!entry) return "not_found";
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return "expired";
  }
  if (entry.otp !== otp) return "wrong";
  store.delete(key);
  return "ok";
}
