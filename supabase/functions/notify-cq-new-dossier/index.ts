// ============================================================================
// Edge Function · notify-cq-new-dossier
//
// Envoie un email au Chef de Quartier concerne quand un citoyen soumet un
// nouveau dossier. Best-effort : si l'envoi echoue (pas de RESEND_API_KEY,
// pas de CQ trouve), on log et on renvoie 200 pour ne pas casser le submit
// cote citoyen.
//
// Contrat :
//   POST { dossierId: string }
//   200  { ok: true, notified?: string, reason?: string }
//
// Variables d'environnement requises :
//   RESEND_API_KEY       (facultatif — sans, on log seulement)
//   NOTIFY_FROM_EMAIL    (defaut : "gandehou@resend.dev")
//   PUBLIC_APP_URL       (defaut : "https://teamcoin.vercel.app")
// ============================================================================

import { corsHeaders, corsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";

const RESEND_API = "https://api.resend.com/emails";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POST attendu" }, { status: 405 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dossierId: string | undefined = body?.dossierId;
    if (!dossierId) {
      return jsonResponse({ ok: false, error: "dossierId requis" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Charge le dossier
    const { data: dossier, error: dosErr } = await supabase
      .from("dossiers")
      .select("id, vendeur_nom, acheteur_nom, quartier, commune, arrondissement, departement, superficie_m2, created_at")
      .eq("id", dossierId)
      .maybeSingle();

    if (dosErr) throw new Error(`Lecture dossier : ${dosErr.message}`);
    if (!dossier) return jsonResponse({ ok: true, reason: "dossier introuvable" });

    // 2. Trouve le CQ du quartier (prend le premier, on garde simple)
    const { data: cq } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, quartier, commune")
      .eq("role", "chef_quartier")
      .eq("quartier", dossier.quartier)
      .maybeSingle();

    if (!cq?.email) {
      // Pas de CQ enregistre pour ce quartier · on ne bloque pas la soumission
      console.log(`[notify-cq] pas de CQ avec email pour quartier="${dossier.quartier}"`);
      return jsonResponse({ ok: true, reason: "aucun CQ email pour ce quartier" });
    }

    // 3. Construit l'email
    const appUrl = Deno.env.get("PUBLIC_APP_URL") ?? "https://teamcoin.vercel.app";
    const from = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "gandehou@resend.dev";
    const shortId = dossier.id.slice(0, 8).toUpperCase();
    const reviewUrl = `${appUrl}/cq/dossier/${dossier.id}`;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <h1 style="color:#1D9739;font-size:22px;margin:0 0 8px">Gandehou · Nouveau dossier a attester</h1>
        <p style="color:#555;margin:0 0 20px">Un citoyen vient de soumettre un dossier de transaction fonciere dans votre quartier.</p>

        <div style="border:1px solid #eee;border-radius:12px;padding:16px;background:#FAFAF7">
          <p style="margin:0 0 4px;font-size:12px;color:#888">Identifiant</p>
          <p style="margin:0 0 12px;font-family:ui-monospace,monospace;font-weight:700;color:#1D9739">${shortId}</p>

          <p style="margin:0 0 4px;font-size:12px;color:#888">Parties</p>
          <p style="margin:0 0 12px">${escapeHtml(dossier.vendeur_nom)} → ${escapeHtml(dossier.acheteur_nom)}</p>

          <p style="margin:0 0 4px;font-size:12px;color:#888">Parcelle</p>
          <p style="margin:0 0 12px">${escapeHtml(dossier.quartier ?? "")}, ${escapeHtml(dossier.commune ?? "")}${dossier.superficie_m2 ? ` · ${dossier.superficie_m2} m²` : ""}</p>
        </div>

        <a href="${reviewUrl}" style="display:inline-block;margin:24px 0;padding:12px 20px;background:#1D9739;color:#fff;border-radius:12px;text-decoration:none;font-weight:600">
          Ouvrir le dossier
        </a>

        <p style="color:#888;font-size:12px;line-height:1.5;margin-top:24px">
          Vous recevez ce message parce que vous etes enregistre comme Chef de Quartier sur Gandehou pour ${escapeHtml(dossier.quartier ?? "ce quartier")}.
        </p>
      </div>
    `;

    // 4. Envoi via Resend (si cle presente)
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.log(`[notify-cq] RESEND_API_KEY absent, aurait envoye a ${cq.email} pour dossier ${shortId}`);
      return jsonResponse({ ok: true, notified: cq.email, reason: "log only (pas de cle Resend)" });
    }

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: cq.email,
        subject: `Gandehou · Nouveau dossier ${shortId} a attester`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[notify-cq] Resend HTTP ${res.status} : ${text}`);
      return jsonResponse({ ok: true, reason: `envoi echoue (${res.status})` });
    }

    return jsonResponse({ ok: true, notified: cq.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notify-cq] erreur", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
