const TOKEN_KEY = "kando-token";
const USER_KEY = "kando-user";

export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout(redirectTo = "/connexion") {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (typeof window !== "undefined") {
    window.location.replace(redirectTo);
  }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Erreur réseau");
  return data as T;
}

export const authService = {
  sendOtpEmail: (email: string) =>
    call<{ message: string; otp_dev?: string }>("/auth/send-otp-email", { email }),

  verifyOtpEmail: (email: string, otp: string) =>
    call<{ token: string; user: AuthUser; isNewUser: boolean }>("/auth/verify-otp-email", {
      email,
      otp,
    }),
};
