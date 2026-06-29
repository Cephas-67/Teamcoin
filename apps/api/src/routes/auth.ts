import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { supabase } from "../db.js";
import { generateOtp, saveOtp, consumeOtp } from "../lib/otpStore.js";
import { sendOtpEmail } from "../lib/mailer.js";
import { sign, verify } from "../lib/jwt.js";

export const authRouter = Router();

const emailSchema = z.string().email();
const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

const DEV = process.env.NODE_ENV !== "production";

authRouter.post("/send-otp-email", async (req, res) => {
  const parsed = emailSchema.safeParse(req.body?.email);
  if (!parsed.success) return res.status(400).json({ message: "Email invalide" });

  const email = parsed.data.toLowerCase();
  const otp = generateOtp();
  saveOtp(email, otp);

  // Dev : on retourne l'OTP dans la réponse pour pouvoir tester sans email
  if (DEV) {
    console.log(`[DEV OTP] ${email} → ${otp}`);
    return res.json({ message: "Code OTP généré (mode dev)", otp_dev: otp });
  }

  const result = await sendOtpEmail(email, otp);
  if (!result.ok) {
    if (result.reason === "resend-not-configured") {
      console.log(`[FALLBACK OTP] ${email} → ${otp}`);
      return res.json({ message: "Code OTP généré (fallback)", otp_dev: otp });
    }
    return res.status(502).json({
      message: "Impossible d'envoyer le code par email. Réessayez dans un instant.",
    });
  }
  res.json({ message: "Code OTP envoyé par email" });
});

authRouter.post("/verify-otp-email", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Email et code à 6 chiffres requis" });
  }
  const email = parsed.data.email.toLowerCase();
  const status = consumeOtp(email, parsed.data.otp);
  if (status === "not_found") return res.status(400).json({ message: "Aucun code demandé pour cet email" });
  if (status === "expired") return res.status(400).json({ message: "Code expiré" });
  if (status === "wrong") return res.status(400).json({ message: "Code incorrect" });

  let user;
  let isNewUser = false;
  const { data: existing, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json({ message: error.message });
  }

  if (existing) {
    user = existing;
  } else {
    isNewUser = true;
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert({ id, email, created_at })
      .select()
      .single();
    if (insertError) return res.status(500).json({ message: insertError.message });
    user = inserted;
  }

  const token = sign({ id: user.id, email: user.email });
  res.json({ message: "Connexion réussie", token, isNewUser, user });
});

authRouter.get("/me", async (req, res) => {
  const auth = req.header("authorization");
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "Token manquant" });
  try {
    const payload = verify(auth.slice(7));
    res.json({ user: payload });
  } catch {
    res.status(401).json({ message: "Token invalide" });
  }
});
