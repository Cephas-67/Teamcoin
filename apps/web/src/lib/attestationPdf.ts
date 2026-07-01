/**
 * Generateur PDF · Attestation de Comparution et de Non-Litige de Voisinage
 *
 * Design cible :
 *   - Grand titre centre : ATTESTATION DE COMPARUTION ET DE NON LITIGE DE VOISINAGE
 *   - Logo Gandehou en en-tete (haut a gauche)
 *   - Motif du hero (bg.svg) en filigrane leger sur toute la page
 *   - Paragraphe formel "Je soussigne...", inspire des attestations administratives
 *   - QR code + URL de verification en pied de page
 *   - Metadonnees invisibles :
 *       - KandoDossierID:<uuid>          → utilise pour retrouver le dossier
 *       - SignatureCQ:<cqId>:<ts>:<hash> → prouve que CE CQ a signe a CETTE heure
 *
 * L'appelant (DossierReview) fait l'upload Storage + l'insertion documents.
 */

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { Dossier } from "./types";

import logoUrl from "@/public/logo.svg";
import motifUrl from "@/assets/images/bg.svg";

const KANDO_META_KEY = "KandoDossierID";

export type AttestationInput = {
  dossier: Dossier;
  attestationNum: string;
  cqSignerLabel?: string;   // nom / email / phone du CQ
  cqSignerId?: string;      // uuid du CQ, sert a construire SignatureCQ
  verifyUrl: string;
};

export type AttestationResult = {
  blob: Blob;
  sha256: string;
  filename: string;
  cqSignature: string;      // ce qui a ete injecte dans les metadonnees
};

export async function generateAttestationPdf(
  input: AttestationInput,
): Promise<AttestationResult> {
  const { dossier, attestationNum, cqSignerLabel, cqSignerId, verifyUrl } = input;

  const pdf = await PDFDocument.create();

  // ── Metadonnees invisibles ─────────────────────────────────────────────
  const nowIso = new Date().toISOString();
  const cqSignature = await buildCqSignature(cqSignerId ?? "anonymous", nowIso, dossier.id);

  pdf.setTitle(`Attestation de Comparution · ${attestationNum}`);
  pdf.setAuthor("Gandehou · KandoFoncier");
  pdf.setSubject(`${KANDO_META_KEY}:${dossier.id}`);
  pdf.setKeywords([
    `${KANDO_META_KEY}:${dossier.id}`,
    `AttestationNum:${attestationNum}`,
    `SignatureCQ:${cqSignerId ?? "anonymous"}:${nowIso}:${cqSignature}`,
  ]);
  pdf.setProducer("KandoFoncier");
  pdf.setCreator("Gandehou Web");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());

  const page = pdf.addPage([595, 842]); // A4 portrait
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helvItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;

  // ── Motif de fond (filigrane) ─────────────────────────────────────────
  try {
    const motifPng = await svgToPngBytes(motifUrl, 800, 800);
    if (motifPng) {
      const motif = await pdf.embedPng(motifPng);
      // 3 copies tuiles douces, opacite tres faible
      page.drawImage(motif, {
        x: -50, y: pageHeight - 400, width: 400, height: 400, opacity: 0.06,
      });
      page.drawImage(motif, {
        x: pageWidth - 350, y: 200, width: 400, height: 400, opacity: 0.06,
      });
      page.drawImage(motif, {
        x: 100, y: -100, width: 400, height: 400, opacity: 0.05,
      });
    }
  } catch { /* motif optionnel · on continue sans */ }

  let y = pageHeight - 40;

  // ── En-tete · logo + nom marque ───────────────────────────────────────
  try {
    const logoPng = await svgToPngBytes(logoUrl, 200, 60);
    if (logoPng) {
      const logo = await pdf.embedPng(logoPng);
      const logoDims = logo.scale(0.35);
      page.drawImage(logo, {
        x: margin, y: y - logoDims.height,
        width: logoDims.width, height: logoDims.height,
      });
    }
  } catch { /* logo optionnel */ }

  page.drawText("Gandehou · KandoFoncier", {
    x: pageWidth - margin - 145, y: y - 12,
    size: 10, font: helv, color: rgb(0.11, 0.73, 0.33),
  });
  page.drawText("Preuve d'antériorité foncière", {
    x: pageWidth - margin - 145, y: y - 26,
    size: 8, font: helvItalic, color: rgb(0.4, 0.4, 0.4),
  });

  y -= 90;

  // ── Grand titre ────────────────────────────────────────────────────────
  const title1 = "ATTESTATION DE COMPARUTION";
  const title2 = "ET DE NON-LITIGE DE VOISINAGE";
  const titleSize = 18;
  const t1w = helvBold.widthOfTextAtSize(title1, titleSize);
  const t2w = helvBold.widthOfTextAtSize(title2, titleSize);
  page.drawText(title1, { x: (pageWidth - t1w) / 2, y, size: titleSize, font: helvBold });
  y -= 22;
  page.drawText(title2, { x: (pageWidth - t2w) / 2, y, size: titleSize, font: helvBold });
  y -= 8;

  // Ligne decorative sous le titre
  page.drawLine({
    start: { x: pageWidth / 2 - 60, y: y - 4 },
    end: { x: pageWidth / 2 + 60, y: y - 4 },
    thickness: 1.5,
    color: rgb(0.11, 0.73, 0.33),
  });
  y -= 24;

  // N° attestation
  const attSubtitle = `N° ${attestationNum} · émise le ${new Date().toLocaleDateString("fr-FR")}`;
  const attSubW = helv.widthOfTextAtSize(attSubtitle, 10);
  page.drawText(attSubtitle, {
    x: (pageWidth - attSubW) / 2, y,
    size: 10, font: helv, color: rgb(0.4, 0.4, 0.4),
  });
  y -= 34;

  // ── Paragraphe "Je soussigne..." ──────────────────────────────────────
  const signer = cqSignerLabel ?? "le Chef de Quartier";
  const location = [dossier.quartier, dossier.arrondissement, dossier.commune].filter(Boolean).join(", ");
  const now = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const paragraph =
    `Je soussigné(e), ${signer}, agissant en qualité de Chef de Quartier ` +
    `de ${location || "la localité"}, atteste par la présente que Monsieur/Madame ` +
    `${dossier.vendeur_nom} (vendeur) et Monsieur/Madame ${dossier.acheteur_nom} ` +
    `(acheteur) ont comparu en personne devant moi en date du ${now} pour la ` +
    `reconnaissance de la parcelle décrite ci-après, et qu'à ce jour aucun litige ` +
    `de voisinage n'a été porté à ma connaissance concernant cette parcelle.`;

  y = drawWrapped(page, helv, margin, y, pageWidth - margin * 2, 10.5, paragraph, 1.5);
  y -= 20;

  // ── Bloc details · Parcelle ───────────────────────────────────────────
  drawSection(page, helvBold, "Description de la parcelle", margin, y); y -= 22;
  if (location) { drawField(page, helv, helvBold, "Localisation", location, margin, y); y -= 18; }
  if (dossier.departement) { drawField(page, helv, helvBold, "Département", dossier.departement, margin, y); y -= 18; }
  if (dossier.zone) { drawField(page, helv, helvBold, "Zone", dossier.zone, margin, y); y -= 18; }
  if (dossier.superficie_m2) {
    drawField(page, helv, helvBold, "Superficie", `${dossier.superficie_m2.toLocaleString("fr-FR")} m²`, margin, y);
    y -= 18;
  }
  if (dossier.origine_droit) {
    drawField(page, helv, helvBold, "Origine du droit", dossier.origine_droit.replace(/_/g, " "), margin, y);
    y -= 18;
  }
  if (dossier.origine_reference) {
    drawField(page, helv, helvBold, "Référence", dossier.origine_reference, margin, y);
    y -= 18;
  }
  y -= 8;

  // ── Voisinage declare ─────────────────────────────────────────────────
  drawSection(page, helvBold, "Voisinage déclaré", margin, y); y -= 22;
  for (const [dir, val] of [
    ["Nord", dossier.voisin_nord],
    ["Sud", dossier.voisin_sud],
    ["Est", dossier.voisin_est],
    ["Ouest", dossier.voisin_ouest],
  ] as const) {
    drawField(page, helv, helvBold, dir, val ?? "—", margin, y);
    y -= 18;
  }
  y -= 8;

  // ── Parties ───────────────────────────────────────────────────────────
  drawSection(page, helvBold, "Parties", margin, y); y -= 22;
  // Support des deux noms de colonne (avant/apres migration bipartite)
  const vendeurId = dossier.vendeur_id_value ?? (dossier as unknown as { vendeur_cip?: string | null }).vendeur_cip ?? null;
  const acheteurId = dossier.acheteur_id_value ?? (dossier as unknown as { acheteur_cip?: string | null }).acheteur_cip ?? null;
  drawField(
    page, helv, helvBold, "Vendeur",
    joinNonEmpty([dossier.vendeur_nom, vendeurId, dossier.vendeur_phone], " · "),
    margin, y,
  ); y -= 18;
  drawField(
    page, helv, helvBold, "Acheteur",
    joinNonEmpty([dossier.acheteur_nom, dossier.acheteur_nationalite, acheteurId, dossier.acheteur_phone], " · "),
    margin, y,
  ); y -= 30;

  // ── Formule de cloture ───────────────────────────────────────────────
  page.drawText(
    "En foi de quoi, la présente attestation est délivrée pour servir et valoir ce que de droit.",
    { x: margin, y, size: 9, font: helvItalic, color: rgb(0.3, 0.3, 0.3) },
  );

  // ── Pied de page · QR + verification + disclaimer ────────────────────
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });
  const qrBytes = dataUrlToBytes(qrDataUrl);
  const qrPng = await pdf.embedPng(qrBytes);

  const qrSize = 100;
  page.drawImage(qrPng, { x: margin, y: 60, width: qrSize, height: qrSize });

  page.drawText("Vérifier ce document en ligne :", {
    x: margin + qrSize + 20, y: 148, size: 10, font: helvBold,
  });
  page.drawText(verifyUrl, {
    x: margin + qrSize + 20, y: 132, size: 8, font: helv, color: rgb(0.11, 0.73, 0.33),
  });
  page.drawText("Scannez le QR ou saisissez l'adresse ci-dessus.", {
    x: margin + qrSize + 20, y: 118, size: 8, font: helvItalic, color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText(`Identifiant : ${dossier.id.slice(0, 8).toUpperCase()}`, {
    x: margin + qrSize + 20, y: 98, size: 8, font: helv, color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText("Document provisoire · sans valeur de titre de propriété.", {
    x: margin + qrSize + 20, y: 78, size: 8, font: helvBold, color: rgb(0.85, 0.15, 0.15),
  });
  page.drawText("Validation obligatoire en Mairie ou chez le Notaire.", {
    x: margin + qrSize + 20, y: 65, size: 7.5, font: helv, color: rgb(0.45, 0.45, 0.45),
  });

  // Signature CQ visible (rappel)
  page.drawText(`Signé électroniquement par ${signer} le ${new Date().toLocaleString("fr-FR")}.`, {
    x: margin, y: 40, size: 7, font: helvItalic, color: rgb(0.5, 0.5, 0.5),
  });

  const bytes = await pdf.save();
  const sha256 = await sha256Hex(bytes);
  const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
  return { blob, sha256, filename: `attestation-${attestationNum}.pdf`, cqSignature };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Construit une signature identifiante pour prouver qu'UN CQ donne a signe
 * a un moment donne. Pas de secret partage cote client — c'est un finger-
 * print SHA-256(cqId || ts || dossierId), verifiable par recalcul en aval.
 * (WebAuthn/Passkey remplacera ceci en prod.)
 */
async function buildCqSignature(cqId: string, tsIso: string, dossierId: string): Promise<string> {
  const data = new TextEncoder().encode(`${cqId}::${tsIso}::${dossierId}`);
  const abData = new ArrayBuffer(data.byteLength);
  new Uint8Array(abData).set(data);
  const digest = await crypto.subtle.digest("SHA-256", abData);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convertit une SVG (URL Vite) en PNG bytes via un canvas offscreen.
 * Renvoie null si le rendu echoue (offline, CORS, browser sans canvas).
 */
async function svgToPngBytes(url: string, width: number, height: number): Promise<Uint8Array | null> {
  try {
    const svgText = await (await fetch(url)).text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const svgObjectUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg load"));
      img.src = svgObjectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(svgObjectUrl);

    const dataUrl = canvas.toDataURL("image/png");
    return dataUrlToBytes(dataUrl);
  } catch {
    return null;
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function joinNonEmpty(parts: Array<string | null | undefined>, sep: string): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join(sep);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type AnyPage = ReturnType<PDFDocument["addPage"]>;
type AnyFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function drawSection(page: AnyPage, font: AnyFont, label: string, x: number, y: number) {
  page.drawText(label, { x, y, size: 11, font, color: rgb(0.11, 0.73, 0.33) });
  page.drawLine({
    start: { x, y: y - 4 },
    end: { x: x + 495, y: y - 4 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
}

function drawField(
  page: AnyPage,
  font: AnyFont,
  fontBold: AnyFont,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  page.drawText(label, { x, y, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
  page.drawText(value, { x: x + 130, y, size: 10, font: fontBold });
}

/**
 * Ecrit un paragraphe justifie a gauche avec retour a la ligne automatique.
 * Renvoie le y final (apres le dernier trait).
 */
function drawWrapped(
  page: AnyPage,
  font: AnyFont,
  x: number,
  yStart: number,
  maxWidth: number,
  size: number,
  text: string,
  lineHeight: number = 1.4,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let y = yStart;
  const step = size * lineHeight;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      page.drawText(line, { x, y, size, font });
      y -= step;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) { page.drawText(line, { x, y, size, font }); y -= step; }
  return y;
}
