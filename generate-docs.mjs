#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ generate-docs.mjs · génère Gandehou-Documentation-Backend.pdf            ║
// ║                                                                          ║
// ║ Documentation complète du backend Gandehou, alignée sur le dossier de    ║
// ║ cadrage original (Bitcoin Mastermind 2026).                              ║
// ║                                                                          ║
// ║ Usage : node generate-docs.mjs                                           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "Gandehou-Documentation-Backend.pdf");

// ─── Charte Bénin ───────────────────────────────────────────────────────────
const COLORS = {
  green: rgb(0, 0.533, 0.314),     // #008850
  yellow: rgb(0.988, 0.823, 0.059), // #FCD20F
  red: rgb(0.914, 0.035, 0.16),     // #E90929
  paper: rgb(0.973, 0.969, 0.906),  // #F8F7E7
  ink: rgb(0.1, 0.1, 0.12),
  inkLight: rgb(0.45, 0.45, 0.5),
  rule: rgb(0.85, 0.85, 0.85),
  codeBg: rgb(0.96, 0.96, 0.94),
};

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const MAX_W = PAGE_W - 2 * MARGIN;

// ─── Builder PDF avec auto-pagination ───────────────────────────────────────
class PdfBuilder {
  constructor(pdf, fonts) {
    this.pdf = pdf;
    this.fonts = fonts;
    this.page = null;
    this.y = 0;
    this.pageNum = 0;
    this._newPage();
  }

  _newPage() {
    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.pageNum++;
    this.y = PAGE_H - MARGIN;
    // bande drapeau Bénin en pied de page
    const stripeY = 15;
    const stripeH = 4;
    const w = (PAGE_W - 2 * MARGIN) / 3;
    this.page.drawRectangle({ x: MARGIN, y: stripeY, width: w, height: stripeH, color: COLORS.green });
    this.page.drawRectangle({ x: MARGIN + w, y: stripeY, width: w, height: stripeH, color: COLORS.yellow });
    this.page.drawRectangle({ x: MARGIN + 2 * w, y: stripeY, width: w, height: stripeH, color: COLORS.red });
    this.page.drawText(`${this.pageNum}`, { x: PAGE_W - MARGIN - 10, y: 25, size: 8, font: this.fonts.helv, color: COLORS.inkLight });
    this.page.drawText("Gandehou - Documentation Backend", { x: MARGIN, y: 25, size: 8, font: this.fonts.helv, color: COLORS.inkLight });
  }

  _ensure(needed) {
    if (this.y - needed < MARGIN + 40) this._newPage();
  }

  // Nettoie les caractères non-WinAnsi (pdf-lib + StandardFonts)
  _sanitize(text) {
    return String(text)
      .replace(/—/g, " - ")
      .replace(/✓/g, "[ok]")
      .replace(/✗/g, "[X]")
      .replace(/⚠/g, "[!]")
      .replace(/🟢/g, "[V]")
      .replace(/🟡/g, "[J]")
      .replace(/🔴/g, "[R]")
      .replace(/→/g, "->")
      .replace(/←/g, "<-")
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"');
  }

  _wrap(text, font, size, maxW) {
    const clean = this._sanitize(text);
    const words = clean.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // ─── Blocs de contenu ─────────────────────────────────────────────────────

  title(text, sub) {
    this._ensure(120);
    this.page.drawText(this._sanitize(text), { x: MARGIN, y: this.y - 36, size: 36, font: this.fonts.helvBold, color: COLORS.green });
    this.y -= 50;
    if (sub) {
      const lines = this._wrap(sub, this.fonts.helv, 12, MAX_W);
      for (const l of lines) {
        this.page.drawText(l, { x: MARGIN, y: this.y, size: 12, font: this.fonts.helv, color: COLORS.inkLight });
        this.y -= 16;
      }
    }
    this.y -= 20;
  }

  h1(text) {
    this._ensure(60);
    this.page.drawText(this._sanitize(text), { x: MARGIN, y: this.y - 22, size: 20, font: this.fonts.helvBold, color: COLORS.green });
    this.y -= 30;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 1, color: COLORS.green });
    this.y -= 18;
  }

  h2(text) {
    this._ensure(40);
    this.y -= 8;
    this.page.drawText(this._sanitize(text), { x: MARGIN, y: this.y - 16, size: 14, font: this.fonts.helvBold, color: COLORS.ink });
    this.y -= 24;
  }

  p(text) {
    const lines = this._wrap(text, this.fonts.helv, 10.5, MAX_W);
    this._ensure(lines.length * 14 + 8);
    for (const l of lines) {
      this.page.drawText(l, { x: MARGIN, y: this.y, size: 10.5, font: this.fonts.helv, color: COLORS.ink });
      this.y -= 14;
    }
    this.y -= 6;
  }

  bullet(items) {
    for (const item of items) {
      const lines = this._wrap(item, this.fonts.helv, 10, MAX_W - 16);
      this._ensure(lines.length * 13 + 4);
      this.page.drawText(".", { x: MARGIN + 4, y: this.y + 3, size: 14, font: this.fonts.helvBold, color: COLORS.green });
      for (let i = 0; i < lines.length; i++) {
        this.page.drawText(lines[i], { x: MARGIN + 14, y: this.y, size: 10, font: this.fonts.helv, color: COLORS.ink });
        this.y -= 13;
      }
      this.y -= 2;
    }
    this.y -= 4;
  }

  code(text) {
    const lines = String(text).split("\n").map((l) => this._sanitize(l));
    const lineH = 11;
    const padding = 8;
    const blockH = lines.length * lineH + 2 * padding;
    this._ensure(blockH + 8);
    this.page.drawRectangle({ x: MARGIN, y: this.y - blockH, width: MAX_W, height: blockH, color: COLORS.codeBg, borderColor: COLORS.rule, borderWidth: 0.5 });
    let yy = this.y - padding - 7;
    for (const l of lines) {
      this.page.drawText(l.length > 90 ? l.slice(0, 87) + "..." : l, { x: MARGIN + padding, y: yy, size: 8.5, font: this.fonts.courier, color: COLORS.ink });
      yy -= lineH;
    }
    this.y -= blockH + 8;
  }

  table(headers, rows, widths) {
    const colCount = headers.length;
    const totalRel = widths.reduce((a, b) => a + b, 0);
    const colW = widths.map((w) => (MAX_W * w) / totalRel);
    const rowH = 18;
    const headerH = 22;
    this._ensure(headerH + rows.length * rowH + 8);

    // Header
    this.page.drawRectangle({ x: MARGIN, y: this.y - headerH, width: MAX_W, height: headerH, color: COLORS.green });
    let x = MARGIN + 6;
    for (let i = 0; i < colCount; i++) {
      this.page.drawText(this._sanitize(headers[i]), { x, y: this.y - 15, size: 9.5, font: this.fonts.helvBold, color: rgb(1, 1, 1) });
      x += colW[i];
    }
    this.y -= headerH;

    // Rows
    for (let r = 0; r < rows.length; r++) {
      this._ensure(rowH);
      if (r % 2 === 0) {
        this.page.drawRectangle({ x: MARGIN, y: this.y - rowH, width: MAX_W, height: rowH, color: rgb(0.97, 0.97, 0.95) });
      }
      x = MARGIN + 6;
      for (let i = 0; i < colCount; i++) {
        const cell = this._sanitize(rows[r][i] ?? "");
        const truncated = cell.length > 60 ? cell.slice(0, 57) + "..." : cell;
        this.page.drawText(truncated, { x, y: this.y - 12, size: 9, font: this.fonts.helv, color: COLORS.ink });
        x += colW[i];
      }
      this.y -= rowH;
    }
    this.y -= 8;
  }

  progressBar(label, percent, status) {
    this._ensure(24);
    const barW = 260;
    const barH = 10;
    const labelW = 220;

    // label
    this.page.drawText(this._sanitize(label), { x: MARGIN, y: this.y - 8, size: 9.5, font: this.fonts.helv, color: COLORS.ink });

    // bar background
    const barX = MARGIN + labelW;
    this.page.drawRectangle({ x: barX, y: this.y - 10, width: barW, height: barH, color: rgb(0.92, 0.92, 0.9) });

    // bar fill
    const fillColor = percent >= 100 ? COLORS.green : percent >= 50 ? COLORS.yellow : COLORS.red;
    this.page.drawRectangle({ x: barX, y: this.y - 10, width: (barW * percent) / 100, height: barH, color: fillColor });

    // pourcent
    this.page.drawText(`${percent}%`, { x: barX + barW + 10, y: this.y - 8, size: 9, font: this.fonts.helvBold, color: COLORS.ink });
    if (status) {
      this.page.drawText(this._sanitize(status), { x: barX + barW + 45, y: this.y - 8, size: 8.5, font: this.fonts.helv, color: COLORS.inkLight });
    }
    this.y -= 18;
  }

  hr() {
    this._ensure(10);
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 0.5, color: COLORS.rule });
    this.y -= 10;
  }

  callout(label, text, color = COLORS.green) {
    const lines = this._wrap(text, this.fonts.helv, 10, MAX_W - 16);
    const labelLines = label ? 1 : 0;
    const blockH = (lines.length + labelLines) * 14 + 16;
    this._ensure(blockH + 6);

    this.page.drawRectangle({ x: MARGIN, y: this.y - blockH, width: 3, height: blockH, color });
    this.page.drawRectangle({ x: MARGIN + 3, y: this.y - blockH, width: MAX_W - 3, height: blockH, color: rgb(0.99, 0.98, 0.93) });

    let yy = this.y - 16;
    if (label) {
      this.page.drawText(this._sanitize(label), { x: MARGIN + 14, y: yy, size: 9, font: this.fonts.helvBold, color });
      yy -= 14;
    }
    for (const l of lines) {
      this.page.drawText(l, { x: MARGIN + 14, y: yy, size: 10, font: this.fonts.helv, color: COLORS.ink });
      yy -= 14;
    }
    this.y -= blockH + 6;
  }

  space(n = 10) {
    this.y -= n;
  }
}

// ─── Génération ─────────────────────────────────────────────────────────────
const pdf = await PDFDocument.create();
pdf.setTitle("Gandehou - Documentation Backend");
pdf.setAuthor("Equipe Gandehou - Hackathon Bitcoin Mastermind 2026");
pdf.setSubject("Documentation complete du backend Gandehou");
pdf.setProducer("generate-docs.mjs");

const fonts = {
  helv: await pdf.embedFont(StandardFonts.Helvetica),
  helvBold: await pdf.embedFont(StandardFonts.HelveticaBold),
  helvOblique: await pdf.embedFont(StandardFonts.HelveticaOblique),
  courier: await pdf.embedFont(StandardFonts.Courier),
};

const b = new PdfBuilder(pdf, fonts);

// ═══════════════════════════════════════════════════════════════════════════
// PAGE DE GARDE
// ═══════════════════════════════════════════════════════════════════════════
b.page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: COLORS.green });
b.page.drawText("BITCOIN MASTERMIND 2026 . HACKATHON", { x: MARGIN, y: PAGE_H - 38, size: 11, font: fonts.helvBold, color: rgb(1, 1, 1) });

b.y = PAGE_H - 180;
b.page.drawText("GANDEHOU", { x: MARGIN, y: b.y, size: 56, font: fonts.helvBold, color: COLORS.green });
b.y -= 60;
b.page.drawText("Documentation Backend", { x: MARGIN, y: b.y, size: 20, font: fonts.helvBold, color: COLORS.ink });
b.y -= 30;

const subtitleLines = b._wrap(
  "Securisation des transactions foncieres au Benin par ancrage cryptographique sur Bitcoin. Documentation complete des livrables backend, mise en regard avec le dossier de cadrage original.",
  fonts.helv,
  12,
  MAX_W,
);
for (const l of subtitleLines) {
  b.page.drawText(l, { x: MARGIN, y: b.y, size: 12, font: fonts.helv, color: COLORS.inkLight });
  b.y -= 16;
}

b.y = 200;
b.page.drawLine({ start: { x: MARGIN, y: b.y }, end: { x: PAGE_W - MARGIN, y: b.y }, thickness: 1, color: COLORS.green });
b.y -= 20;
b.page.drawText("Reference projet :", { x: MARGIN, y: b.y, size: 10, font: fonts.helvBold, color: COLORS.ink });
b.page.drawText("uhfyofjxolhpunpbdefq.supabase.co", { x: MARGIN + 110, y: b.y, size: 10, font: fonts.courier, color: COLORS.ink });
b.y -= 16;
b.page.drawText("Date :", { x: MARGIN, y: b.y, size: 10, font: fonts.helvBold, color: COLORS.ink });
b.page.drawText("Cotonou . 1er juillet 2026", { x: MARGIN + 110, y: b.y, size: 10, font: fonts.helv, color: COLORS.ink });
b.y -= 16;
b.page.drawText("Source de cadrage :", { x: MARGIN, y: b.y, size: 10, font: fonts.helvBold, color: COLORS.ink });
b.page.drawText("Gandehou_Dossier_Foncier_Bitcoin_Benin_2026.pdf", { x: MARGIN + 110, y: b.y, size: 10, font: fonts.helv, color: COLORS.ink });

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 - RÉSUMÉ EXÉCUTIF
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("1. Resume executif");
b.p(
  "Gandehou est une couche de preuve d'anteriorite et d'integrite pour les transactions foncieres au Benin. Chaque document (attestation provisoire, convention finale, piece annexe) est hache en SHA-256 puis horodate sur Bitcoin via le protocole OpenTimestamps. La verification est publique, gratuite, sans creation de compte, et survivante (n'importe quel outil OpenTimestamps tiers peut decoder une preuve, meme si nos serveurs disparaissent)."
);
b.p(
  "Le backend de Gandehou est aujourd'hui operationnel sur l'infrastructure Supabase (Postgres, Auth, Storage, Edge Functions Deno). L'ancrage Bitcoin a ete teste end-to-end avec une preuve reellement soumise aux calendriers OpenTimestamps publics. La detection de falsification fonctionne et a ete validee par un scenario de PDF altere apres ancrage."
);

b.h2("Ce qui est livre");
b.bullet([
  "Schema SQL Postgres : 5 tables + 7 colonnes audio/biometrie + 2 index + 2 triggers d'audit",
  "11 services TypeScript typees couvrant tout le cycle de vie d'un dossier foncier",
  "Moteur de regles ANDF aligne sur le Code Foncier et Domanial (CFD)",
  "Wrapper OpenTimestamps isomorphe (Node et Deno) sur @otskit/client (zero-dependance)",
  "3 Edge Functions deployees : anchor-document, upgrade-ots, verify-proof",
  "Bundle PDF + audio + signature biometrique : combined hash en cascade ancre sur Bitcoin",
  "Capture biometrique WebAuthn reelle (Touch ID, Face ID, Windows Hello, Android Bio)",
  "Enregistrement vocal du consentement (MediaRecorder + bucket dedie + hash + ancrage)",
  "Cron pg_cron de mise a jour automatique des preuves toutes les 30 minutes",
  "4 buckets Storage (provisoires, definitifs, ots-proofs, documents-audio)",
  "Test end-to-end automatise en 17 etapes, dont 2 scenarios de falsification verifies",
  "Documentation d'integration BACKEND.md pour le developpeur frontend",
]);

b.h2("Ce qui n'est PAS livre (et c'est volontaire)");
b.p(
  "Conformement au dossier de cadrage (sections 6 et 7.2 : 'Ce que Gandehou ne doit pas pretendre etre'), nous ne pretendons pas remplacer le Notaire ni l'ANDF. Notre couche se positionne en complement de confiance du circuit legal existant, pas en substitut."
);
b.bullet([
  "Auth par OTP SMS reelle : simulee en localStorage (provider tiers type Twilio non integre, conformement au choix hackathon)",
  "Integration directe au numero unique parcellaire et au CEC : documentee comme roadmap post-hackathon (section 7.3 du cadrage)",
  "RLS strictes par role : volontairement permissives (using(true)) pour la demonstration; a durcir en V1 production",
  "Generation PDF cote serveur : conserve cote client via pdf-lib (suffisant pour le hackathon)",
  "Validation cryptographique de la signature WebAuthn cote serveur : non faite (la public key est stockee, la signature future serait verifiee dans une Edge Function dediee V1.1)",
  "Transcription speech-to-text de l'audio : roadmap V1.1 (Whisper local ou API cloud)",
]);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 - GRAPHIQUE D'AVANCEMENT
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("2. Graphique d'avancement");
b.p("Avancement par composant, mesure par rapport au perimetre defini dans le dossier de cadrage original.");
b.space(8);

b.h2("Couche persistance (Supabase Postgres)");
b.progressBar("Schema SQL (5 tables, triggers, RLS)", 100, "complet");
b.progressBar("Index et contraintes metier", 100, "complet");
b.progressBar("Triggers d'audit automatique", 100, "complet");
b.progressBar("RLS strictes par role", 25, "permissif hackathon");

b.space(6);
b.h2("Couche services applicatifs (TypeScript)");
b.progressBar("CRUD profils, dossiers, documents", 100, "complet");
b.progressBar("Storage (3 buckets, helpers spec.)", 100, "complet");
b.progressBar("Audit trail lecture", 100, "complet");
b.progressBar("Moteur regles ANDF", 90, "4 regles cles");
b.progressBar("Chainage de hash auto", 100, "complet");
b.progressBar("Action rejet dossier", 100, "complet");

b.space(6);
b.h2("Coeur Bitcoin demontrable");
b.progressBar("Module OpenTimestamps isomorphe", 100, "complet");
b.progressBar("Edge Function anchor-document", 100, "bundle ancre");
b.progressBar("Edge Function upgrade-ots + cron", 100, "deploye + teste");
b.progressBar("Edge Function verify-proof", 100, "bundle verifie");
b.progressBar("Combined hash en cascade (PDF+audio+sig)", 100, "validee e2e");
b.progressBar("Detection falsification PDF", 100, "validee e2e");
b.progressBar("Detection falsification audio", 100, "validee e2e");

b.space(6);
b.h2("Inclusivite et accessibilite");
b.progressBar("Enregistrement vocal du consentement", 100, "MediaRecorder + bucket dedie");
b.progressBar("Signature biometrique WebAuthn reelle", 100, "Touch ID / Face ID / Hello");
b.progressBar("Service audio (upload + download + hash)", 100, "complet");
b.progressBar("Service signature (capture Passkey)", 100, "complet");

b.space(6);
b.h2("Outillage et documentation");
b.progressBar("Test e2e automatise (17 etapes)", 100, "complet");
b.progressBar("Documentation BACKEND.md", 100, "complet");
b.progressBar("Documentation deploiement", 100, "complet");
b.progressBar("PDF de documentation backend", 100, "ce document");

b.space(10);
b.callout("BILAN GLOBAL", "Backend hackathon : 100% livre, avec bonus inclusivite (audio + biometrie). Backend production V1 : ~75% (manque RLS strictes, validation serveur des regles ANDF, validation crypto de la signature WebAuthn, transcription audio, upload pieces justificatives, notifications email).", COLORS.green);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 - CONFORMITÉ AU DOSSIER DE CADRAGE
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("3. Conformite au dossier de cadrage");
b.p("Exigence par exigence du dossier de cadrage original, mise en regard de ce qui a ete effectivement livre.");

b.h2("3.1 Fonctionnalites coeur (section 7.1 du dossier)");
b.table(
  ["Exigence dossier", "Statut", "Livrable"],
  [
    ["Saisie citoyenne (form. multi-etapes)", "OK", "Schema dossiers + service createDossier"],
    ["Generation PDF avec filigrane + QR", "OK", "lib/pdf.ts cote client (existant)"],
    ["Calcul SHA-256 a chaque etape", "OK", "packages/ledger/hash.ts"],
    ["Ancrage Bitcoin via OpenTimestamps", "OK", "Edge Function anchor-document"],
    ["Chainage des hashs entre etapes", "OK", "createChainedDocument avec hash_parent"],
    ["Page de verification publique", "OK", "Service verify.ts + verifyFileDeep"],
    ["Verdict visuel 3 etats (vert/jaune/rouge)", "OK", "ots_status: confirmed/pending/mismatch"],
    ["Tableau de bord par role", "OK", "Service listDossiersAvecDernierDocument"],
  ],
  [3, 1, 3.5],
);

b.h2("3.1bis Bonus inclusivite (au-dela du dossier de cadrage)");
b.p("Le dossier original ne mentionne ni audio ni biometrie. Ces fonctionnalites ont ete ajoutees pour adresser le contexte beninois reel (40% d'illettrisme, faible alphabetisation juridique). Elles renforcent considerablement la valeur du livrable pour le terrain.");
b.table(
  ["Fonctionnalite bonus", "Statut", "Livrable"],
  [
    ["Enregistrement vocal consentement", "OK", "MediaRecorder + uploadAudio + bucket dedie"],
    ["Capture biometrique WebAuthn reelle", "OK", "Touch ID/Face ID/Hello via navigator.credentials"],
    ["Bundle PDF + audio + signature", "OK", "createDocumentBundle + combined hash en cascade"],
    ["Detection alteration audio post-ancrage", "OK", "Edge Function verify-proof etendue"],
    ["Validation crypto signature WebAuthn", "Roadmap", "V1.1 (parsing clientDataJSON + ECDSA)"],
  ],
  [3, 1, 3.5],
);

b.h2("3.2 Architecture technique (section 8 du dossier)");
b.table(
  ["Exigence dossier", "Statut", "Livrable"],
  [
    ["Postgres pour dossiers, statuts, users", "OK", "supabase/schema.sql"],
    ["Supabase Auth (email + OTP)", "OK", "Email reel; phone simule (hackathon)"],
    ["Row Level Security par role", "Partiel", "RLS active, policies permissives"],
    ["Supabase Storage (provisoire/definitif)", "OK", "3 buckets + helpers storage.ts"],
    ["Edge Functions Deno", "OK", "3 fonctions deployees"],
    ["pg_cron upgrade preuves OTS", "OK", "Job gandehou-upgrade-ots toutes 30 min"],
    ["javascript-opentimestamps", "Substitue", "@otskit/client (lib moderne sans deps)"],
  ],
  [3, 1, 3.5],
);

b.h2("3.3 Modele de donnees (section 10 du dossier)");
b.p("Le schema livre suit exactement la section 10 du dossier, avec des extensions pour audio + biometrie.");
b.table(
  ["Table du dossier", "Statut", "Notes"],
  [
    ["profiles", "OK", "FK auth.users souple (chef demo)"],
    ["dossiers", "OK +", "Ajout flag_etranger_zone_rurale + flag_superficie_seuil"],
    ["documents (base)", "OK", "Ajout ots_block_height + ots_confirmed_at"],
    ["documents (audio)", "OK +", "audio_storage_path + audio_sha256"],
    ["documents (signature)", "OK +", "signataire_pubkey_hash + credential_id + jwk + nom"],
    ["documents (combined)", "OK +", "pdf_sha256 separe ; sha256 = combined ancre"],
    ["dossier_status_history", "OK", "Auto-remplie par trigger"],
    ["otp_sessions", "OK", "Conservee pour coherence (placeholder hackathon)"],
  ],
  [2.5, 1, 4],
);

b.h2("3.4 Statuts a afficher honnetement (section 9.2 du dossier)");
b.p("Le dossier impose explicitement de ne JAMAIS pretendre qu'un statut est confirmed s'il est pending.");
b.table(
  ["Statut interne", "Statut UI attendu", "Implementation"],
  [
    ["pending", "En attente Bitcoin (jaune)", "Defaut a l'insert + apres ancrage OTS"],
    ["confirmed", "Ancre sur Bitcoin (vert)", "Cron upgrade-ots OU verify-proof"],
    ["mismatch", "Modifie apres ancrage (rouge)", "verify-proof si hash divergent"],
  ],
  [1.5, 2, 4],
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 - DÉTAIL DES LIVRABLES PAR COUCHE
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("4. Detail des livrables par couche");

b.h2("4.1 Schema SQL (supabase/schema.sql)");
b.p("5 tables, 2 triggers, RLS activee partout. Source unique de verite, miroir des types TypeScript.");
b.code(
  `create table profiles (id, role, full_name, email, phone, commune, ...)
create table dossiers (id, statut, vendeur_*, acheteur_*, zone, ...)
create table documents (id, dossier_id, sha256, hash_parent, ots_status, ...)
create table dossier_status_history (id, ancien_statut, nouveau_statut, ...)
create table otp_sessions (id, telephone, code_hash, expires_at, ...)

trigger touch_updated_at        -> tient dossiers.updated_at a jour
trigger log_status_change       -> historise tous les changements de statut`,
);

b.h2("4.2 Services TypeScript (apps/web/src/services/)");
b.table(
  ["Fichier", "Role"],
  [
    ["profiles.ts", "CRUD profils + getCurrentOfficialProfile"],
    ["dossiers.ts", "CRUD + filtres par role + changerStatut + rejeterDossier"],
    ["documents.ts", "CRUD + createChainedDocument + createDocumentBundle"],
    ["storage.ts", "Upload PDF + .ots dans 4 buckets, helpers specialises"],
    ["history.ts", "Lecture audit trail + annotation manuelle"],
    ["regles-andf.ts", "Moteur juridique pur (4 regles CFD)"],
    ["anchor.ts", "Invocation Edge Function anchor-document + upgrade"],
    ["verify.ts", "Verdict 3 etats + verification crypto deep"],
    ["audio.ts", "Upload + download enregistrement vocal + hash"],
    ["signature.ts", "Capture WebAuthn reelle (Touch ID/Face ID/Hello)"],
    ["index.ts", "Barrel d'imports unique"],
  ],
  [2, 5],
);

b.h2("4.3 Module OpenTimestamps (packages/ledger/)");
b.p("Wrapper isomorphe sur @otskit/client, library moderne zero-dependance. Exporte 3 fonctions pures :");
b.bullet([
  "stampHash(sha256Hex) : Promise<StampResult>  -- cree une preuve pending",
  "upgradeProof(proofBytes) : Promise<UpgradeResult>  -- tente le passage pending vers confirmed",
  "verifyProof(proofBytes, hash) : Promise<VerifyResult>  -- verdict typee fail-closed",
]);
b.callout(
  "Pourquoi @otskit/client",
  "La bibliotheque javascript-opentimestamps citee dans le dossier original n'est plus maintenue depuis 2019 (deps web3 0.18, keccak 1.4 inccompilables sur Windows recent). Substitution par @otskit/client (2026, zero-dep, TypeScript strict). L'API publique de notre wrapper reste identique : aucun impact sur le code applicatif.",
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 - EDGE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("5. Edge Functions Supabase");
b.p("3 fonctions Deno deployees sur le projet uhfyofjxolhpunpbdefq. Endpoint base : https://uhfyofjxolhpunpbdefq.functions.supabase.co/");

b.h2("5.1 anchor-document");
b.p("Ancre un bundle PDF + audio + signature sur Bitcoin. Etapes internes :");
b.bullet([
  "Lit la ligne documents (incluant audio_storage_path, audio_sha256, signataire_pubkey_hash)",
  "Idempotence : si ots_proof_path deja renseigne, renvoie l'etat sans re-ancrer",
  "Telecharge le PDF depuis Storage et recalcule son SHA-256",
  "Si audio attache : telecharge depuis documents-audio + recalcule + verifie hash",
  "Recalcule le COMBINED HASH = pdf_sha256 [+ audio_sha256] [+ signataire_pubkey_hash]",
  "Verifie que le combined recalcule == documents.sha256 (sinon refuse)",
  "Appelle OpenTimestamps stamp() sur le combined : contacte les calendriers publics",
  "Uploade la preuve .ots dans le bucket ots-proofs",
  "Met a jour documents.ots_proof_path + ots_status = 'pending'",
]);
b.code(
  `POST /anchor-document
Body: { documentId: string }
Response 200: { ok: true, status: "pending", hash, proofPath, message }
Response 404: { ok: false, error: "Document XXX introuvable" }
Response 409: { ok: false, error: "Hash divergent...", dbHash, fileHash }`,
);

b.h2("5.2 upgrade-ots");
b.p("Tache batch planifiee toutes les 30 minutes par pg_cron. Pour chaque document pending :");
b.bullet([
  "Telecharge la preuve .ots actuelle",
  "Appelle OpenTimestamps upgrade() : tentative de confirmation Bitcoin",
  "Si confirmed : reuploade la preuve enrichie + met a jour ots_status + ots_block_height",
  "Si still pending : pas d'action, sera retente au prochain cycle",
  "Isolation par document : un echec n'interrompt pas les autres",
]);
b.code(
  `POST /upgrade-ots
Body: {} (declenche par pg_cron, mais appelable manuellement)
Response: { ok: true, stats: { scanned, upgraded, stillPending, errors[] } }`,
);

b.h2("5.3 verify-proof");
b.p("Verification cryptographique reelle du bundle complet. Difference critique avec services/verify.ts :");
b.bullet([
  "services/verify.ts (cote client) : compare juste un hash en base (instantane)",
  "verify-proof (cote serveur) : telecharge .ots, recalcule le combined hash, valide contre Bitcoin",
  "Si audio attache : recalcule aussi le hash de l'audio actuel + verifie",
  "Recompose le combined hash (PDF + audio + signature) et vrifie via OpenTimestamps",
  "Si UNE seule alteration detectee (PDF, audio ou signature) : verdict mismatch",
  "Effet de bord : ots_status='mismatch' propage en base pour les futurs lookups rapides",
]);
b.code(
  `POST /verify-proof
Body: { documentId } ou { sha256 }
Response 200: { ok: true, verdict: "confirmed"|"pending"|"mismatch"|"invalid", ... }
Confirmed: { blockHeight, bitcoinTimestamp }
Mismatch:  { expectedHash, actualHash, reason }`,
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6 - WORKFLOW MÉTIER COMPLET
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("6. Workflow metier complet");
b.p("Cycle de vie d'une transaction fonciere dans Gandehou, du depot par le chef de quartier jusqu'a la validation finale par la Mairie.");

b.h2("Etape 1 - Saisie citoyenne (statut: brouillon)");
b.bullet([
  "Le chef de quartier remplit un stepper avec les donnees du dossier",
  "Le moteur ANDF evalue les regles en temps reel (alertes UI)",
  "Si bloquant (ex: etranger en zone rurale) : soumission refusee",
  "createDossier() insere la ligne + calcule les flags ANDF automatiquement",
  "Le trigger SQL log_status_change historise la creation",
]);

b.h2("Etape 2 - Generation de l'attestation provisoire (statut: atteste_cq)");
b.bullet([
  "PDF genere cote client via lib/pdf.ts (filigrane, QR code, donnees du dossier)",
  "Hash SHA-256 du PDF calcule via Web Crypto API",
  "Optionnel : enregistrement vocal du consentement (Fon, Yoruba, Adja...) via AudioRecorder",
  "Optionnel : capture biometrique reelle (Touch ID/Face ID) via FingerprintCapture/WebAuthn",
  "uploadAudio() pousse l'audio dans le bucket documents-audio si present",
  "captureSignature() retourne pubkey + credentialId + JWK si biometrie capturee",
  "createDocumentBundle() insere la ligne avec sha256 = combined(pdf, audio, sig)",
  "uploadPdfProvisoire() pousse le PDF dans Storage",
  "anchorDocument() appelle l'Edge Function anchor-document avec le combined hash",
  "ots_status passe a 'pending' + .ots cree dans ots-proofs",
  "changerStatut(id, 'atteste_cq')",
]);

b.h2("Etape 3 - Validation Mairie (statut: valide_mairie)");
b.bullet([
  "L'agent Mairie consulte le dashboard filtre sur sa commune",
  "Il peut soit valider, soit rejeter (rejeterDossier avec motif)",
  "Si validation : nouveau PDF (convention finale) genere",
  "createChainedDocument() : hash_parent rempli avec le sha256 de l'attestation provisoire",
  "Refus si parent non encore ancre (garde-fou crypto)",
  "Upload + ancrage de la convention finale",
  "changerStatut(id, 'valide_mairie')",
]);

b.h2("Etape 4 - Verification publique (sans authentification)");
b.bullet([
  "Mode A : drag-and-drop du PDF -> sha256OfFile() -> verifyBySha256()",
  "Mode B : scan QR code -> verifyByDocumentId()",
  "Verdict instantane (lookup en base)",
  "En arriere-plan : verifyFileDeep() appelle verify-proof pour validation crypto reelle",
  "Si verify-proof detecte mismatch : ots_status='mismatch' propage en base pour les futurs lookups",
]);

b.h2("Etape 5 - Cycle de fond (cron toutes les 30 min)");
b.bullet([
  "pg_cron appelle upgrade-ots automatiquement",
  "Toutes les preuves en pending sont scannees",
  "Celles qui ont une attestation Bitcoin disponible passent a confirmed",
  "Mise a jour de ots_block_height + ots_confirmed_at",
]);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7 - TEST END-TO-END
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("7. Test end-to-end automatise");
b.p("Le fichier supabase/test-e2e.mjs valide la chaine complete sur l'infrastructure reelle Supabase + OpenTimestamps. 17 etapes, idempotent, produit une sortie coloree.");

b.h2("Procedure");
b.code(
  `# 1. Variables d'env dans supabase/.env.local
SUPABASE_URL=https://uhfyofjxolhpunpbdefq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 2. Lancement
node supabase/test-e2e.mjs`,
);

b.h2("Les 17 etapes");
b.table(
  ["#", "Etape", "Validation"],
  [
    ["1", "Creation dossier test en base", "INSERT + UUID retourne"],
    ["2", "Generation PDF en memoire", "Bytes valides"],
    ["3", "Calcul SHA-256", "64 chars hex"],
    ["4", "Upload bucket documents-provisoires", "Pas d'erreur Storage"],
    ["5", "Insert ligne documents", "Defaut ots_status=pending"],
    ["6", "Appel anchor-document", "proofPath retourne, 5-30s reel"],
    ["7", "Verification ots_status en base", "pending + ots_proof_path"],
    ["8", "Presence du .ots dans ots-proofs", "Download OK"],
    ["9", "Appel upgrade-ots", "stillPending=N (normal)"],
    ["10", "verify-proof (verification crypto)", "verdict=pending attendu"],
    ["11", "Falsification PDF (upload altere)", "verdict=mismatch DETECTE"],
    ["12", "Rejet dossier + audit trail", "litige + 2 entrees history"],
    ["13", "Dossier bundle (PDF+audio+signature)", "INSERT + UUID"],
    ["14", "Upload PDF + audio + insert combined", "Combined hash calcule"],
    ["15", "Ancrage Bitcoin du bundle", "anchorResp.hash == combined attendu"],
    ["16", "verify-proof bundle (hasAudio+hasSig)", "verdict=pending, flags ok"],
    ["17", "Falsification AUDIO (upload altere)", "verdict=mismatch DETECTE"],
  ],
  [0.5, 3.5, 3],
);

b.callout(
  "SCENARIOS KILLER DU PITCH",
  "Etape 11 : un PDF different uploade a la place de l'original -> verdict mismatch instantane. Etape 17 (encore plus fort) : un audio different uploade a la place de l'enregistrement de consentement original -> verdict mismatch egalement. Le systeme protege les 3 elements du bundle independamment, et UN SEUL byte altere sur l'un des 3 suffit a invalider la preuve Bitcoin.",
  COLORS.red,
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8 - INFRASTRUCTURE DE DÉPLOIEMENT
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("8. Infrastructure de deploiement");

b.h2("Etat actuel");
b.table(
  ["Composant", "Etat", "Reference"],
  [
    ["Projet Supabase", "Actif", "uhfyofjxolhpunpbdefq"],
    ["Schema SQL Gandehou execute", "OK", "5 tables + 2 triggers"],
    ["Migration audio + signature", "OK", "7 colonnes ajoutees + 2 index"],
    ["Extension pg_cron", "Activee", "Database > Extensions"],
    ["Extension pg_net", "Activee", "Database > Extensions"],
    ["Edge Function anchor-document", "Deployee", "Bundle combined hash"],
    ["Edge Function upgrade-ots", "Deployee", "Live + testee"],
    ["Edge Function verify-proof", "Deployee", "Bundle verifie"],
    ["Bucket documents-provisoires", "Cree", "Public read"],
    ["Bucket documents-definitifs", "Cree", "Public read"],
    ["Bucket ots-proofs", "Cree", "Public read"],
    ["Bucket documents-audio", "Cree", "Public read"],
    ["Cron gandehou-upgrade-ots", "Active", "*/30 * * * *"],
  ],
  [3, 1.5, 3],
);

b.h2("Commandes de redeploiement");
b.code(
  `# Si modification d'une Edge Function
supabase functions deploy anchor-document
supabase functions deploy upgrade-ots
supabase functions deploy verify-proof

# Si modification du schema SQL
# (manuel via Dashboard > SQL Editor)`,
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9 - LIMITES ASSUMÉES ET ROADMAP
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("9. Limites assumees et roadmap V1 production");
b.p("Conformement a la philosophie du dossier de cadrage (section 6 : 'Ce que Gandehou doit pretendre etre'), nous documentons honnetement les limites du livrable hackathon et le chemin vers la V1 production.");

b.h2("9.1 Limites volontaires du hackathon");
b.bullet([
  "Auth citoyens en localStorage : aucun provider SMS reel (mentionne explicitement dans le dossier section 7.2)",
  "RLS permissives (using(true)) : les policies sont activees mais pas restrictives par role",
  "Validation des regles ANDF cote client : un acheteur malveillant peut techniquement bypass",
  "PDF generes cote client : pas de garantie d'integrite contenu vs trick navigateur",
  "Validation crypto de la signature WebAuthn cote serveur : pubkey stockee mais signature future non verifiee",
  "Transcription speech-to-text de l'audio : non faite (recherche full-text impossible sans transcript)",
  "Challenge WebAuthn genere cote client : devrait venir d'une Edge Function en prod (anti-replay)",
  "Pas d'upload des pieces justificatives (CIP, ADC, plan topographique)",
  "Pas de notifications email aux parties au changement de statut",
]);

b.h2("9.2 Roadmap V1 production (post-hackathon)");
b.table(
  ["Chantier V1", "Effort estime", "Criticite"],
  [
    ["RLS strictes par role (chef, mairie, admin, anon)", "1 jour", "CRITIQUE"],
    ["Edge Function submit-dossier (validation serveur)", "1 jour", "CRITIQUE"],
    ["Edge Function verify-webauthn-signature", "1 jour", "Haute"],
    ["Challenge WebAuthn cote serveur (anti-replay)", "0.5 jour", "Haute"],
    ["Transcription audio (Whisper local ou cloud)", "1 jour", "Haute"],
    ["Upload des pieces justificatives en base", "2 jours", "Haute"],
    ["Notifications email Supabase Auth", "0.5 jour", "Haute"],
    ["Provider SMS pour OTP citoyens (Twilio/MTN)", "1 jour", "Haute"],
    ["Generation PDF cote serveur (Edge Function)", "1 jour", "Moyenne"],
    ["Pagination et recherche full-text", "0.5 jour", "Moyenne"],
    ["Soft delete + archivage", "0.5 jour", "Basse"],
    ["Stats agregees anti-fraude (section 7.3 dossier)", "2 jours", "Roadmap+"],
    ["Integration CEC et numero unique parcellaire", "1 semaine", "Roadmap+"],
  ],
  [3.5, 1.5, 2],
);

b.h2("9.3 Conformite reglementaire visee");
b.p("Le schema et les services anticipent l'alignement avec :");
b.bullet([
  "Loi 2017-15 (Code Foncier et Domanial consolide)",
  "Decret 2025-176 du 9 avril 2025 (numero unique parcellaire, CEC)",
  "Loi 2025-05 du 11 mars 2025 (loi-cadre construction et habitation)",
  "Reforme PPMEC en cours (Projet de Preparation a la Mise a l'Echelle du Cadastre)",
]);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10 - CONTEXTE BÉNINOIS
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("10. Pourquoi Gandehou au Benin");

b.h2("10.1 Le probleme reel");
b.p(
  "Au Benin, l'insecurite fonciere est l'un des sujets les plus douloureux du quotidien. Les conflits autour de la terre representent une part majeure des affaires civiles devant les tribunaux. Les causes sont connues : multiplicite des actes de presomption (Attestation de Detention Coutumiere, certificat administratif, permis d'habiter, anciennes conventions de vente sous seing prive), absence d'un cadastre national exhaustif, et surtout pratique persistante des doubles ventes ou un meme terrain est cede successivement a plusieurs acheteurs de bonne foi."
);
b.p(
  "Pour une famille moyenne, l'achat d'une parcelle represente souvent l'investissement d'une vie. Une falsification ou une contestation peut signifier la perte totale de cet investissement, des annees de procedure judiciaire, et dans les cas extremes une demolition forcee de la construction. Le Conseil des Ministres du 4 mars 2026 a d'ailleurs declare 22 perimetres d'utilite publique sur le fondement de l'article 529 CFD, precisement parce que des decisions de justice mettaient en peril des constructions massives a Cotonou, Abomey-Calavi, Klouekanmey, Bopa, Zogbodomey et Lalo."
);

b.h2("10.2 Ce que la reforme 2013-2017 a fait");
b.p(
  "La Loi n. 2013-01 du 14 aout 2013 a institue le Code Foncier et Domanial et cree l'Agence Nationale du Domaine et du Foncier (ANDF), qui devient le guichet unique. La Loi n. 2017-15 a prolonge la periode transitoire jusqu'au 14 aout 2023, date depuis laquelle le recours au Notaire et le Titre Foncier deliivre par l'ANDF sont les seules voies legales de formalisation d'une vente."
);
b.p(
  "Cette modernisation est juridiquement solide mais cree un goulot d'etranglement reel : la confirmation prealable des droits (etape obligatoire pour les terrains non encore titres, soit la majorite du foncier rural et peri-urbain) est longue, couteuse, et hors de portee economique pour beaucoup de menages. Le decret n. 2025-176 du 9 avril 2025 a tente de fluidifier en reintroduisant les communes via le Certificat d'Enregistrement au Cadastre (CEC), avec l'appui du consortium PPMEC (Ministere de l'Economie et des Finances, VNG International, Kadaster International)."
);

b.h2("10.3 Ou Gandehou s'insere");
b.p(
  "Gandehou ne pretend pas remplacer le Notaire ni l'ANDF. Notre couche se positionne en complement de confiance, applicable a CHAQUE etape deja existante du circuit legal : attestation de detention coutumiere, dossier de bornage par geometre agree, acte notarie, Titre Foncier, et demain le CEC. Chaque document officiel ou pre-officiel est hashe et horodate sur Bitcoin des sa creation. Toute modification ulterieure devient detectable et prouvable publiquement, gratuitement, par n'importe qui (banque, acheteur, notaire, agent ANDF)."
);
b.p(
  "Concretement : un acheteur qui detient un PDF de son acte peut le glisser-deposer sur la page publique de Gandehou. En quelques secondes, il sait si le document a ete altere depuis son ancrage initial. Un notaire peut faire la meme verification avant de contre-signer une transaction sur un terrain a historique complexe. Une banque peut verifier en lot des centaines d'actes avant d'octroyer des prets hypothecaires."
);

b.h2("10.4 Pourquoi Bitcoin et pas une base SQL classique");
b.bullet([
  "Incorruptibilite temporelle : aucun administrateur, meme malveillant, ne peut alterer un hash ancre il y a 30 ans",
  "Survie independante : si les serveurs Gandehou s'eteignent, n'importe quel outil OpenTimestamps tiers continue de decoder la preuve",
  "Cout reseau zero : l'agregation Merkle d'OpenTimestamps permet d'ancrer des milliers de hashs dans une seule transaction Bitcoin (frais reseau partages, gratuit en pratique)",
  "Argument souverainete : le Benin n'a pas besoin de faire confiance a un fournisseur cloud etranger ; la preuve vit sur un reseau monetaire decentralise mondial",
]);

b.h2("10.5 Cible utilisateurs et inclusivite");
b.p(
  "Gandehou est concu pour une population mixte : citoyens souvent illettres ou faiblement scolarises (40% de la population beninoise selon les statistiques nationales), agents fonciers communaux, notaires, banques, et a terme l'ANDF elle-meme via integration directe. L'interface s'appuie sur des codes visuels universels (vert/jaune/rouge inspires du drapeau national) et le QR code permet une verification meme sans saisie clavier."
);
b.p(
  "Pour franchir la barriere de l'illettrisme, Gandehou propose deux innovations inclusives ancrees ensemble dans Bitcoin via un combined hash en cascade : (1) un enregistrement vocal du consentement dans la langue locale (Fon, Yoruba, Adja, Bariba), capture via l'API MediaRecorder du navigateur et stocke en bucket dedie ; (2) une signature biometrique reelle (empreinte digitale, Face ID, Windows Hello) capturee via l'API WebAuthn standard, qui prouve cryptographiquement que l'utilisateur etait physiquement present sans jamais stocker la donnee biometrique elle-meme. Les trois (PDF + audio + biometrie) sont combines mathematiquement en une seule preuve Bitcoin, et l'alteration d'un seul des trois rend la preuve invalide."
);

b.h2("10.6 Scenario de reference : Maman Chantal");
b.p(
  "Maman Chantal, vendeuse de poisson a Dantokpa, illettree, achete une parcelle a Abomey-Calavi. L'agent foncier ouvre Gandehou. Etapes en 5 minutes :"
);
b.bullet([
  "L'agent saisit les donnees avec Chantal (nom vendeur, parcelle, voisinage)",
  "Chantal enregistre 10 secondes en Fon : 'Je, Chantal Hounkpevi, achete la parcelle ABC...'",
  "L'audio est uploade dans le bucket documents-audio + hash SHA-256 calcule",
  "Chantal pose son doigt sur l'ecran du smartphone : Touch ID/Face ID capture une Passkey",
  "Les 3 hashes (PDF + audio + pubkey biometrique) sont combines en cascade",
  "Le combined hash est ancre sur Bitcoin via OpenTimestamps (sous 3 secondes)",
  "Chantal repart avec un PDF contenant un QR code unique et une copie audio sur son telephone",
]);
b.p(
  "Deux ans plus tard, le vendeur initial tente une seconde vente du meme terrain avec un document altere. Le second acheteur scanne le QR : alerte rouge instantanee. Mieux : Chantal peut faire ecouter au tribunal son enregistrement vocal de consentement original, prouve crypto-graphiquement comme datant de la vente initiale (et non rejoue/falsifie posterieurement). La preuve sur Bitcoin est recevable devant le tribunal independamment de la disponibilite des serveurs Gandehou : meme si nous fermons demain, n'importe quel outil OpenTimestamps tiers peut decoder la preuve."
);

b.h2("10.7 Modele economique et viabilite");
b.p(
  "Gandehou est concu pour etre gratuit pour le citoyen final (verification publique sans compte). Le modele de revenus repose sur trois piliers : (1) API premium pour les banques et notaires qui font de la verification en masse, (2) partenariat institutionnel avec l'ANDF et les communes pour integration au circuit officiel (financement public via PPMEC ou bailleurs), (3) services additionnels (notifications WhatsApp, signatures biometriques avancees, archivage longue duree)."
);

b.h2("10.8 Ce qui rend ce projet specifiquement beninois");
b.bullet([
  "Cadrage juridique strict : le projet cite explicitement les articles du CFD et le decret 2025-176",
  "Codes visuels du drapeau national (vert/jaune/rouge), conviction esthetique africaine",
  "Adaptation a la realite informelle : le Chef de Quartier (qui n'a aucun statut legal dans le CFD) est positionne comme couche sociale de pre-enregistrement, sans pretendre se substituer au circuit officiel",
  "Anticipation de la reforme PPMEC en cours : compatibilite documentee avec le futur numero unique parcellaire",
  "Scenarios construits sur des localites reelles : Cotonou, Abomey-Calavi, Cocotomey, Dantokpa",
]);

// ═══════════════════════════════════════════════════════════════════════════
// CONCLUSION
// ═══════════════════════════════════════════════════════════════════════════
b._newPage();
b.h1("Conclusion");
b.p(
  "Gandehou est aujourd'hui un POC backend fonctionnel, deploye en production sur Supabase, avec un ancrage Bitcoin reellement teste de bout en bout, une detection de falsification verifee, et un alignement juridique serieux sur le Code Foncier et Domanial beninois ainsi que sur la reforme 2025-2026 en cours (decret 2025-176)."
);
b.p(
  "L'ecart entre un POC hackathon (etat actuel) et une V1 production (cible 3-6 mois) est documente explicitement dans la section 9 ci-dessus. Les briques critiques (ancrage Bitcoin reel, schema SQL, services typees, vrification cryptographique, audit trail automatique) sont en place et utilisables des aujourd'hui. Les briques restantes (RLS strictes, validation serveur exhaustive, pieces justificatives, notifications) sont identifiees, priorisees, et accessibles en effort raisonnable."
);
b.p(
  "Notre conviction : Gandehou n'est pas un gadget blockchain plaque sur un probleme generique. C'est une reponse honnete et techniquement precise a un probleme reel, documente par l'ANDF elle-meme comme un defi majeur de la reforme en cours. Bitcoin et OpenTimestamps sont ici utilises non pour leur cote spectaculaire, mais parce qu'ils sont l'outil le plus pertinent pour la partie 'preuve d'integrite' du probleme : preuve gratuite, publique, decentralisee, et capable de survivre a la disparition de son operateur."
);

b.space(20);
b.callout(
  "POUR LE JURY BITCOIN MASTERMIND 2026",
  "Nous demontrons une chaine end-to-end reelle : un PDF cree, hashe en SHA-256, soumis au calendrier OpenTimestamps, agrege dans un bloc Bitcoin, et verifiable cryptographiquement par n'importe qui sans dependre de notre infrastructure. La falsification est detectee en temps reel. Le cadre juridique beninois est respecte. La roadmap vers la production est concrete et chiffree.",
  COLORS.green,
);

b.space(20);
b.p("Cotonou, le 30 juin 2026. Equipe Gandehou.");

// ─── Sauvegarde ─────────────────────────────────────────────────────────────
const bytes = await pdf.save();
writeFileSync(OUT, bytes);

console.log("");
console.log("[ok] PDF genere :", OUT);
console.log("     Pages       :", b.pageNum);
console.log("     Taille      :", (bytes.length / 1024).toFixed(1), "KB");
console.log("");
