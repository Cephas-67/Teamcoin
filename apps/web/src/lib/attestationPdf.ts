/**
 * Générateur PDF · Attestation de Comparution et de Non-Litige de Voisinage
 *
 * Produit un PDF conforme au workflow KandoFoncier (étape 3) :
 *   · Filigrane rouge « DOCUMENT PROVISOIRE »
 *   · Métadonnées invisibles (KandoDossierID) pour la vérification par upload
 *   · QR code intégré pointant vers /verifier/:id (jumeau numérique)
 *   · SHA-256 du binaire renvoyé pour l'ancrage OTS ultérieur
 *
 * Ce module ne parle jamais au réseau. L'upload Supabase Storage est fait
 * par l'appelant (DossierReview) pour garder la génération testable.
 */

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { Dossier } from "./types";

// Clé de marquage · retrouvée par la page /verifier au dépôt d'un PDF.
const KANDO_META_KEY = "KandoDossierID";

export type AttestationInput = {
  dossier: Dossier;
  attestationNum: string;      // ex: ATT-CQ-XXXXXXXX
  cqSignerLabel?: string;      // email / phone / nom du CQ (facultatif)
  verifyUrl: string;           // URL absolue → /verifier/:id
};

export type AttestationResult = {
  blob: Blob;
  sha256: string;              // hash hex du binaire produit
  filename: string;
};

export async function generateAttestationPdf(
  input: AttestationInput,
): Promise<AttestationResult> {
  const { dossier, attestationNum, cqSignerLabel, verifyUrl } = input;

  const pdf = await PDFDocument.create();

  // ── Métadonnées invisibles (source de vérité pour la vérification) ──────
  pdf.setTitle(`Attestation de Comparution · ${attestationNum}`);
  pdf.setAuthor("Gandehou · KandoFoncier");
  pdf.setSubject(`${KANDO_META_KEY}:${dossier.id}`);
  pdf.setKeywords([KANDO_META_KEY, dossier.id, attestationNum]);
  pdf.setProducer("KandoFoncier");
  pdf.setCreator("Gandehou Web");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());

  // QR embed
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });
  const qrPng = await pdf.embedPng(qrDataUrl);

  const page = pdf.addPage([595, 842]); // A4 portrait
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageWidth = 595;

  // ── Filigrane rouge diagonal ─────────────────────────────────────────────
  page.drawText("DOCUMENT PROVISOIRE", {
    x: 40,
    y: 320,
    size: 58,
    font: helvBold,
    color: rgb(0.85, 0.15, 0.15),
    opacity: 0.14,
    rotate: degrees(35),
  });

  let y = 800;

  // ── En-tête ─────────────────────────────────────────────────────────────
  page.drawText("KandoFoncier · Gandehou", {
    x: margin, y, size: 18, font: helvBold, color: rgb(0.11, 0.73, 0.33),
  });
  y -= 22;
  page.drawText("Attestation de Comparution et de Non-Litige de Voisinage", {
    x: margin, y, size: 12, font: helvBold,
  });
  y -= 16;
  page.drawText(
    `N° ${attestationNum} · émise le ${new Date().toLocaleDateString("fr-FR")}`,
    { x: margin, y, size: 9, font: helv, color: rgb(0.4, 0.4, 0.4) },
  );
  y -= 32;

  // ── Parcelle ────────────────────────────────────────────────────────────
  drawSection(page, helvBold, "Parcelle", margin, y); y -= 22;
  const loc = [dossier.quartier, dossier.arrondissement, dossier.commune, dossier.departement]
    .filter(Boolean).join(" · ");
  if (loc) { drawField(page, helv, helvBold, "Localisation", loc, margin, y); y -= 18; }
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
  y -= 10;

  // ── Voisinage déclaré (le cœur du non-litige) ───────────────────────────
  drawSection(page, helvBold, "Voisinage déclaré", margin, y); y -= 22;
  const voisins: Array<[string, string | null]> = [
    ["Nord", dossier.voisin_nord],
    ["Sud", dossier.voisin_sud],
    ["Est", dossier.voisin_est],
    ["Ouest", dossier.voisin_ouest],
  ];
  for (const [dir, val] of voisins) {
    drawField(page, helv, helvBold, dir, val ?? "—", margin, y);
    y -= 18;
  }
  y -= 10;

  // ── Parties ─────────────────────────────────────────────────────────────
  drawSection(page, helvBold, "Parties", margin, y); y -= 22;
  drawField(
    page, helv, helvBold, "Vendeur",
    joinNonEmpty([dossier.vendeur_nom, dossier.vendeur_cip, dossier.vendeur_phone], " · "),
    margin, y,
  ); y -= 18;
  drawField(
    page, helv, helvBold, "Acheteur",
    joinNonEmpty(
      [dossier.acheteur_nom, dossier.acheteur_nationalite, dossier.acheteur_cip, dossier.acheteur_phone],
      " · ",
    ),
    margin, y,
  ); y -= 30;

  // ── Attestation du CQ ───────────────────────────────────────────────────
  drawSection(page, helvBold, "Attestation du Chef de Quartier", margin, y); y -= 22;
  drawWrapped(
    page, helv, margin, y, pageWidth - margin * 2, 10,
    `Nous soussigné${cqSignerLabel ? ` (${cqSignerLabel})` : ""}, Chef de Quartier, attestons de la comparution des parties sus-nommées et de l'absence de litige de voisinage connu à la date d'émission.`,
  );
  y -= 46;
  page.drawText(
    `Signé électroniquement (OTP MTN/Moov) le ${new Date().toLocaleString("fr-FR")}.`,
    { x: margin, y, size: 9, font: helv, color: rgb(0.4, 0.4, 0.4) },
  );

  // ── Pied de page · QR + URL + disclaimer ────────────────────────────────
  const qrSize = 110;
  page.drawImage(qrPng, { x: margin, y: 70, width: qrSize, height: qrSize });
  page.drawText("Vérifier ce document :", {
    x: margin + qrSize + 20, y: 165, size: 10, font: helvBold,
  });
  page.drawText(verifyUrl, {
    x: margin + qrSize + 20, y: 148, size: 8, font: helv, color: rgb(0.11, 0.73, 0.33),
  });
  page.drawText(`Identifiant dossier : ${dossier.id}`, {
    x: margin + qrSize + 20, y: 120, size: 8, font: helv, color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText("Document provisoire · sans valeur de titre de propriété.", {
    x: margin + qrSize + 20, y: 92, size: 8, font: helvBold, color: rgb(0.85, 0.15, 0.15),
  });
  page.drawText("Validation obligatoire en Mairie ou chez le Notaire.", {
    x: margin + qrSize + 20, y: 78, size: 8, font: helv, color: rgb(0.45, 0.45, 0.45),
  });

  const bytes = await pdf.save();
  const sha256 = await sha256Hex(bytes);
  const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
  return { blob, sha256, filename: `attestation-${attestationNum}.pdf` };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function joinNonEmpty(parts: Array<string | null | undefined>, sep: string): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join(sep);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Copie dans un ArrayBuffer neuf pour éviter le conflit de type entre
  // SharedArrayBuffer et ArrayBuffer avec les libs TS récentes.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// pdf-lib expose des types opaques ; on garde ces helpers volontairement souples.
type AnyPage = ReturnType<PDFDocument["addPage"]>;
type AnyFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function drawSection(page: AnyPage, font: AnyFont, label: string, x: number, y: number) {
  page.drawText(label, { x, y, size: 12, font, color: rgb(0.11, 0.73, 0.33) });
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
  page.drawText(value, { x: x + 110, y, size: 10, font: fontBold });
}

// Découpe naïve en mots pour tenir dans une largeur donnée.
function drawWrapped(
  page: AnyPage,
  font: AnyFont,
  x: number,
  yStart: number,
  maxWidth: number,
  size: number,
  text: string,
) {
  const words = text.split(/\s+/);
  let line = "";
  let y = yStart;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      page.drawText(line, { x, y, size, font });
      y -= size + 4;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) page.drawText(line, { x, y, size, font });
}
