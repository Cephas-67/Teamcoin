// @ts-nocheck
// TODO: refactor pour le nouveau schema (Checkpoint -> StatusHistoryEntry,
// renommage des champs parcelle_*).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { Dossier, Checkpoint } from "./supabase";

// Métadonnée custom · clé invisible qu'on injecte dans le PDF officiel.
// Lue au moment de la vérification pour faire le tri 🟢 / 🔴 / ⚪.
const KANDO_META_KEY = "KandoDossierID";

// ─── Génération du PDF officiel scellé ──────────────────────────────────────
export async function generateOfficialPdf(dossier: Dossier, checkpoints: Checkpoint[]): Promise<Blob> {
  const pdf = await PDFDocument.create();

  // Métadonnée invisible · le "passeport" du document.
  pdf.setTitle(`Acte foncier KandoFoncier · ${dossier.parcelle_ref}`);
  pdf.setAuthor("KandoFoncier");
  pdf.setSubject(KANDO_META_KEY + ":" + dossier.id);
  pdf.setKeywords([KANDO_META_KEY, dossier.id]);
  pdf.setProducer("KandoFoncier");

  const verifyUrl = `${getOrigin()}/verifier?id=${dossier.id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 240, margin: 1 });
  const qrPng = await pdf.embedPng(qrDataUrl);

  const page = pdf.addPage([595, 842]); // A4
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 800;

  // En-tête
  page.drawText("KandoFoncier", { x: margin, y, size: 22, font: helvBold, color: rgb(0.11, 0.73, 0.33) });
  page.drawText("Acte foncier scellé sur Bitcoin", { x: margin, y: y - 22, size: 11, font: helv, color: rgb(0.4, 0.4, 0.4) });
  y -= 60;

  // Bloc identité parcelle
  drawSection(page, helvBold, "Parcelle", margin, y);
  y -= 22;
  drawField(page, helv, helvBold, "Référence", dossier.parcelle_ref, margin, y); y -= 18;
  drawField(page, helv, helvBold, "Lieu", `${dossier.parcelle_quartier} · ${dossier.parcelle_commune}`, margin, y); y -= 18;
  if (dossier.parcelle_superficie) {
    drawField(page, helv, helvBold, "Superficie", `${dossier.parcelle_superficie} m²`, margin, y);
    y -= 18;
  }
  y -= 16;

  // Parties
  drawSection(page, helvBold, "Parties", margin, y);
  y -= 22;
  drawField(page, helv, helvBold, "Vendeur", `${dossier.vendeur_nom} · ${dossier.vendeur_phone}`, margin, y); y -= 18;
  drawField(page, helv, helvBold, "Acheteur", `${dossier.acheteur_nom} · ${dossier.acheteur_phone}`, margin, y); y -= 18;
  y -= 16;

  // Historique
  drawSection(page, helvBold, "Historique des signatures", margin, y);
  y -= 22;
  for (const c of checkpoints) {
    const dt = new Date(c.created_at).toLocaleString("fr-FR");
    page.drawText(`• ${c.etape}`, { x: margin, y, size: 10, font: helvBold });
    page.drawText(`${dt}`, { x: margin + 90, y, size: 9, font: helv, color: rgb(0.3, 0.3, 0.3) });
    if (c.signer_phone) {
      page.drawText(`signé par ${c.signer_phone}`, { x: margin + 220, y, size: 9, font: helv, color: rgb(0.3, 0.3, 0.3) });
    }
    y -= 16;
    page.drawText(c.current_hash, { x: margin + 8, y, size: 7, font: helv, color: rgb(0.5, 0.5, 0.5) });
    y -= 18;
  }

  // QR + UUID en pied de page
  const qrSize = 110;
  page.drawImage(qrPng, { x: margin, y: 70, width: qrSize, height: qrSize });

  page.drawText("Vérifier ce document :", { x: margin + qrSize + 20, y: 165, size: 10, font: helvBold });
  page.drawText(verifyUrl, { x: margin + qrSize + 20, y: 148, size: 8, font: helv, color: rgb(0.11, 0.73, 0.33) });
  page.drawText(`Identifiant dossier KandoFoncier :`, { x: margin + qrSize + 20, y: 120, size: 9, font: helv, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(dossier.id, { x: margin + qrSize + 20, y: 105, size: 8, font: helv });
  page.drawText("Document scellé sur la blockchain Bitcoin via OpenTimestamps.", { x: margin + qrSize + 20, y: 80, size: 7, font: helv, color: rgb(0.45, 0.45, 0.45) });
  page.drawText("Modifier ce fichier d'un seul octet rend la preuve invalide.", { x: margin + qrSize + 20, y: 70, size: 7, font: helv, color: rgb(0.45, 0.45, 0.45) });

  const bytes = await pdf.save();
  return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
}

// ─── Extraction de l'UUID depuis un PDF déposé ──────────────────────────────
export async function extractKandoDossierId(file: File): Promise<string | null> {
  try {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return null;
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

    // Méthode 1 · Subject ("KandoDossierID:<uuid>")
    const subject = pdf.getSubject();
    if (subject?.startsWith(KANDO_META_KEY + ":")) {
      const candidate = subject.slice(KANDO_META_KEY.length + 1).trim();
      if (isUuid(candidate)) return candidate;
    }

    // Méthode 2 · Keywords (array contenant un UUID après notre marqueur)
    const keywords = pdf.getKeywords();
    if (keywords) {
      const parts = keywords.split(/[\s,;]+/).map((s) => s.trim());
      for (const p of parts) if (isUuid(p)) return p;
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function drawSection(page: ReturnType<PDFDocument["addPage"]>, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, label: string, x: number, y: number) {
  page.drawText(label, { x, y, size: 12, font, color: rgb(0.11, 0.73, 0.33) });
  page.drawLine({
    start: { x, y: y - 4 },
    end: { x: x + 495, y: y - 4 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
}

function drawField(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  page.drawText(`${label}`, { x, y, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
  page.drawText(value, { x: x + 90, y, size: 10, font: fontBold });
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function getOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "https://kandofoncier.bj";
}
