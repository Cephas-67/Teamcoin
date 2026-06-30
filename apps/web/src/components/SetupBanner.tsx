import { AlertTriangle } from "lucide-react";
import { supabaseConfigured } from "../lib/supabase";

export function SetupBanner() {
  if (supabaseConfigured) return null;
  return (
    <div className="bg-warn/15 border-b border-warn/30 px-4 py-3 text-sm">
      <div className="container flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" />
        <div className="text-warn/90">
          <strong className="text-warn">Configuration Supabase manquante.</strong>{" "}
          Renseigne <code className="font-mono text-xs bg-warn/20 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> et{" "}
          <code className="font-mono text-xs bg-warn/20 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> dans{" "}
          <code className="font-mono text-xs bg-warn/20 px-1.5 py-0.5 rounded">apps/web/.env</code> puis redémarre{" "}
          <code className="font-mono text-xs bg-warn/20 px-1.5 py-0.5 rounded">npm run dev</code>.
        </div>
      </div>
    </div>
  );
}
