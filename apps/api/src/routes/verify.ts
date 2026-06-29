import { Router } from "express";
import multer from "multer";
import { sha256, combinedHash } from "@kando/ledger";
import { supabase } from "../db.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export const verifyRouter = Router();

verifyRouter.post(
  "/",
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]>;
    const document = files?.document?.[0];
    const audio = files?.audio?.[0];

    if (!document || !audio) {
      return res.status(400).json({ error: "document et audio requis" });
    }

    const documentHash = await sha256(document.buffer);
    const audioHash = await sha256(audio.buffer);
    const combined = await combinedHash(documentHash, audioHash);

    const { data: acte, error } = await supabase
      .from("actes")
      .select("*")
      .eq("combined_hash", combined)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!acte) {
      return res.json({
        status: "invalid",
        reason: "Aucun acte trouvé avec ce hash. Document modifié ou jamais notarisé.",
        computedHash: combined,
      });
    }

    res.json({ status: "valid", acte, computedHash: combined });
  },
);
