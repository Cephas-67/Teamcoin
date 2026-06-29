import { Resend } from "resend";
import "dotenv/config";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Sans domaine vérifié sur Resend, on envoie depuis l'adresse de test
// onboarding@resend.dev. Resend ne livre alors qu'à l'email du compte
// développeur (sécurité anti-spam). Pour la prod : vérifier un domaine
// dans Resend → MAIL_FROM = "KandoFoncier <auth@kandofoncier.bj>"
const MAIL_FROM = process.env.MAIL_FROM ?? "KandoFoncier <onboarding@resend.dev>";

export async function sendOtpEmail(to: string, otp: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!resend) {
    return { ok: false, reason: "resend-not-configured" };
  }
  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: [to],
    subject: "Votre code KandoFoncier",
    text: `Votre code de connexion KandoFoncier est : ${otp}\n\nCe code expire dans 10 minutes.\nSi vous n'avez pas demandé ce code, ignorez ce message.`,
    html: htmlTemplate(otp),
  });
  if (error) {
    console.error("[Resend]", error);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

function htmlTemplate(otp: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
      <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px;">
        <span style="display: inline-block; width: 10px; height: 10px; background: #1DB954; border-radius: 2px;"></span>
        <strong style="font-size: 18px; letter-spacing: -0.04em;">KandoFoncier</strong>
      </div>
      <h1 style="font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 12px;">Votre code de connexion</h1>
      <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Entrez ce code à 6 chiffres dans l'application pour vous connecter à votre compte KandoFoncier.
      </p>
      <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 20px;">
        <div style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #0a0a0a;">
          ${otp}
        </div>
      </div>
      <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0;">
        Ce code expire dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez ce message.
      </p>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0 16px;">
      <p style="color: #a1a1aa; font-size: 11px; margin: 0;">
        KandoFoncier · Notarisation foncière inclusive · Bénin
      </p>
    </div>
  `;
}
