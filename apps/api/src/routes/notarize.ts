import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { sha256, combinedHash } from "@kando/ledger";
import { supabase } from "../db.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const metaSchema = z.object({
  parcelleRef: z.string().min(1),
  parcelleVille: z.string().min(1),
  acheteurNom: z.string().min(1),
  vendeurNom: z.string().min(1),
  signature: z.string().min(8),
});

export const notarizeRouter = Router();

notarizeRouter.post(
  "/",
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const document = files?.document?.[0];
      const audio = files?.audio?.[0];

      if (!document || !audio) {
        return res.status(400).json({ error: "document et audio requis" });
      }

      const meta = metaSchema.parse(JSON.parse(req.body.meta ?? "{}"));

      const documentHash = await sha256(document.buffer);
      const audioHash = await sha256(audio.buffer);
      const combined = await combinedHash(documentHash, audioHash);

      const { data: existing } = await supabase
        .from("actes")
        .select("id")
        .eq("combined_hash", combined)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: "Acte déjà notarisé", id: existing.id });
      }

      const id = randomUUID();
      const createdAt = new Date().toISOString();

      const { error } = await supabase.from("actes").insert({
        id,
        parcelle_ref: meta.parcelleRef,
        parcelle_ville: meta.parcelleVille,
        acheteur_nom: meta.acheteurNom,
        vendeur_nom: meta.vendeurNom,
        document_hash: documentHash,
        audio_hash: audioHash,
        combined_hash: combined,
        signature: meta.signature,
        ots_proof: null,
        created_at: createdAt,
      });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({
        id,
        documentHash,
        audioHash,
        combinedHash: combined,
        otsStatus: "pending",
        createdAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      res.status(400).json({ error: message });
    }
  },
);
