import { useEffect, useState } from "react";
import { getCurrentChef, getDemoSession, type Chef } from "../services/auth";
import { supabase } from "../lib/supabase";

// Source unique de vérité pour "qui est le Chef connecté ?".
// Merge la session Supabase (email) ET la session démo (téléphone, localStorage).
export function useChef() {
  const [chef, setChef] = useState<Chef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const c = await getCurrentChef();
      if (!cancelled) {
        setChef(c);
        setLoading(false);
      }
    };

    refresh();

    // Réagit aux events Supabase (login/logout email)
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());

    // Réagit aux events localStorage (login téléphone dans un autre onglet)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "kando-demo-session") refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { chef, loading };
}

// Synchrone · pour les composants qui n'ont pas besoin de réactivité.
export function readChefSync(): Chef | null {
  const demo = getDemoSession();
  if (demo) return { id: demo.chefId, source: "phone-demo", phone: demo.phone };
  // Session Supabase non-disponible en sync · on retourne null si pas de demo.
  return null;
}
