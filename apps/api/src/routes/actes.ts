import { Router } from "express";
import { supabase } from "../db.js";

export const actesRouter = Router();

actesRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("actes")
    .select("id, parcelle_ref, parcelle_ville, acheteur_nom, vendeur_nom, combined_hash, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

actesRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("actes")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Acte introuvable" });
  res.json(data);
});
