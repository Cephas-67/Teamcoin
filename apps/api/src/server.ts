import express from "express";
import cors from "cors";
import { actesRouter } from "./routes/actes.js";
import { notarizeRouter } from "./routes/notarize.js";
import { verifyRouter } from "./routes/verify.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "kandofoncier-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/notarize", notarizeRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/actes", actesRouter);

app.listen(PORT, () => {
  console.log(`[api] KandoFoncier API → http://localhost:${PORT}`);
});
