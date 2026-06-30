#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ test-e2e.mjs · test end-to-end du backend Gandehou                       ║
// ║                                                                          ║
// ║ Lance toute la chaîne :                                                  ║
// ║   1. Crée un dossier test en base                                        ║
// ║   2. Génère un PDF minimal (bytes en mémoire)                            ║
// ║   3. Calcule son SHA-256                                                 ║
// ║   4. Uploade dans documents-provisoires                                  ║
// ║   5. Insère la ligne documents                                           ║
// ║   6. Appelle l'Edge Function anchor-document                             ║
// ║   7. Vérifie que ots_status est passé à pending                          ║
// ║   8. Vérifie que le .ots est dans le bucket ots-proofs                   ║
// ║   9. Appelle upgrade-ots (devrait être stillPending au premier coup)     ║
// ║  10. Appelle verify-proof (vérification crypto réelle)                   ║
// ║  11. Simule une falsification (upload PDF altéré) → mismatch attendu     ║
// ║  12. Test rejet de dossier + audit trail trigger                         ║
// ║                                                                          ║
// ║ Usage :                                                                  ║
// ║   node supabase/test-e2e.mjs                                             ║
// ║                                                                          ║
// ║ Variables d'environnement requises :                                     ║
// ║   SUPABASE_URL                                                           ║
// ║   SUPABASE_SERVICE_ROLE_KEY  (bypasse RLS et policies storage)           ║
// ║                                                                          ║
// ║ Ou : crée un fichier supabase/.env.local avec les 2 lignes :             ║
// ║   SUPABASE_URL=https://uhfyofjxolhpunpbdefq.supabase.co                  ║
// ║   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...                                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ─── 0. Couleurs console (rester lisible sur Windows PowerShell) ────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};
const ok = (msg) => console.log(`${c.green}✓${c.reset} ${msg}`);
const ko = (msg) => console.log(`${c.red}✗${c.reset} ${msg}`);
const info = (msg) => console.log(`${c.cyan}→${c.reset} ${msg}`);
const warn = (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`);
const step = (n, msg) => console.log(`\n${c.bold}${c.cyan}[${n}/17]${c.reset} ${c.bold}${msg}${c.reset}`);

// ─── 1. Chargement de l'env (process.env ou supabase/.env.local) ────────────
function loadEnv() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envFile = join(__dirname, ".env.local");
  if (existsSync(envFile)) {
    const lines = readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    info(`env chargé depuis ${envFile}`);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    ko("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.");
    console.log(`${c.gray}  Soit définis-les dans ton shell, soit crée supabase/.env.local${c.reset}`);
    console.log(`${c.gray}  Exemple .env.local :${c.reset}`);
    console.log(`${c.gray}    SUPABASE_URL=https://uhfyofjxolhpunpbdefq.supabase.co${c.reset}`);
    console.log(`${c.gray}    SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...${c.reset}`);
    process.exit(1);
  }
  return { url, key };
}

// ─── Génère un PDF minimaliste valide (~700 octets) ─────────────────────────
function generateTestPdf() {
  const now = new Date().toISOString();
  const content = `BT /F1 12 Tf 50 750 Td (Gandehou · test e2e · ${now}) Tj ET`;
  const body = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${content.length}>>stream
${content}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000095 00000 n
0000000186 00000 n
0000000${(248 + content.length).toString().padStart(3, "0")} 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
${298 + content.length}
%%EOF`;
  return new Uint8Array(Buffer.from(body, "utf-8"));
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Combined hash · doit rester aligné sur computeCombinedHash() des Edge Functions
// et sur combinedHash() de packages/ledger/hash.ts.
function computeCombinedHash(pdfHash, audioHash, sigHash) {
  let acc = pdfHash.toLowerCase();
  for (const h of [audioHash, sigHash]) {
    if (!h) continue;
    acc = createHash("sha256").update(`${acc}::${h.toLowerCase()}`).digest("hex");
  }
  return acc;
}

// Faux fichier audio (bytes random + header WEBM minimal pour la forme)
function generateFakeAudio() {
  const bytes = new Uint8Array(2048);
  bytes[0] = 0x1a; bytes[1] = 0x45; bytes[2] = 0xdf; bytes[3] = 0xa3; // EBML magic
  for (let i = 4; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`${c.bold}${c.cyan}\n━━━ Gandehou · test end-to-end ━━━${c.reset}\n`);

  const { url, key } = loadEnv();
  ok(`Connecté à ${url}`);
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let dossierId = null;
  let documentId = null;
  let storagePath = null;
  let proofPath = null;

  try {
    // ─── Étape 1 · création du dossier ─────────────────────────────────────
    step(1, "Création d'un dossier test en base");
    const { data: dossier, error: dErr } = await supabase
      .from("dossiers")
      .insert({
        vendeur_nom: "Test Vendeur E2E",
        acheteur_nom: "Test Acheteur E2E",
        acheteur_nationalite: "beninoise",
        commune: "Abomey-Calavi",
        quartier: "Cocotomey",
        zone: "urbaine",
        parcelle_ref: `E2E-${Date.now()}`,
      })
      .select("id")
      .single();
    if (dErr) throw new Error(`insert dossier : ${dErr.message}`);
    dossierId = dossier.id;
    ok(`Dossier créé · ${dossierId}`);

    // ─── Étape 2 · génération du PDF ───────────────────────────────────────
    step(2, "Génération d'un PDF test en mémoire");
    const pdfBytes = generateTestPdf();
    ok(`PDF généré · ${pdfBytes.byteLength} octets`);

    // ─── Étape 3 · calcul SHA-256 ──────────────────────────────────────────
    step(3, "Calcul SHA-256 du PDF");
    const hash = sha256(pdfBytes);
    ok(`SHA-256 · ${hash}`);

    // ─── Étape 4 · upload dans documents-provisoires ───────────────────────
    step(4, "Upload du PDF dans documents-provisoires");
    storagePath = `${dossierId}/test-e2e.pdf`;
    const { error: upErr } = await supabase.storage
      .from("documents-provisoires")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(`upload storage : ${upErr.message}`);
    ok(`Upload OK · documents-provisoires/${storagePath}`);

    // ─── Étape 5 · insert ligne documents ──────────────────────────────────
    step(5, "Insertion de la ligne documents");
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .insert({
        dossier_id: dossierId,
        type: "attestation_provisoire",
        storage_bucket: "documents-provisoires",
        storage_path: storagePath,
        sha256: hash,
      })
      .select("id, ots_status")
      .single();
    if (docErr) throw new Error(`insert document : ${docErr.message}`);
    documentId = doc.id;
    ok(`Document créé · ${documentId} (ots_status: ${doc.ots_status})`);

    // ─── Étape 6 · appel anchor-document ───────────────────────────────────
    step(6, "Appel Edge Function anchor-document");
    info("Cette étape contacte les calendriers OpenTimestamps · 5 à 30 secondes...");
    const t0 = Date.now();
    const { data: anchorResp, error: anchorErr } = await supabase.functions.invoke(
      "anchor-document",
      { body: { documentId } },
    );
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (anchorErr) throw new Error(`anchor-document : ${anchorErr.message}`);
    if (!anchorResp?.ok) throw new Error(`anchor-document KO : ${JSON.stringify(anchorResp)}`);
    proofPath = anchorResp.proofPath;
    ok(`Ancrage en ${dt}s · status=${anchorResp.status}${anchorResp.alreadyAnchored ? " (alreadyAnchored)" : ""}`);
    if (!proofPath) {
      throw new Error(
        `proofPath manquant dans la réponse anchor-document. Réponse complète : ${JSON.stringify(anchorResp)}`,
      );
    }
    ok(`Preuve · ${proofPath}`);

    // ─── Étape 7 · vérification ots_status en base ─────────────────────────
    step(7, "Vérification ots_status en base");
    await sleep(500);
    const { data: docCheck, error: checkErr } = await supabase
      .from("documents")
      .select("ots_status, ots_proof_path")
      .eq("id", documentId)
      .single();
    if (checkErr) throw new Error(`reread document : ${checkErr.message}`);
    if (docCheck.ots_status !== "pending") {
      throw new Error(`ots_status attendu 'pending', reçu '${docCheck.ots_status}'`);
    }
    ok(`ots_status = ${docCheck.ots_status} · ots_proof_path = ${docCheck.ots_proof_path}`);

    // ─── Étape 8 · vérification présence du .ots ───────────────────────────
    step(8, "Vérification présence du fichier .ots dans ots-proofs");
    const { data: blob, error: dlErr } = await supabase.storage
      .from("ots-proofs")
      .download(proofPath);
    if (dlErr || !blob) throw new Error(`download .ots : ${dlErr?.message ?? "blob vide"}`);
    ok(`Fichier .ots récupéré · ${blob.size} octets`);

    // ─── Étape 9 · appel upgrade-ots ───────────────────────────────────────
    step(9, "Appel Edge Function upgrade-ots (premier passage)");
    info("La preuve vient d'être créée · elle restera en pending (normal).");
    const { data: upgradeResp, error: upgErr } = await supabase.functions.invoke(
      "upgrade-ots",
      { body: {} },
    );
    if (upgErr) throw new Error(`upgrade-ots : ${upgErr.message}`);
    ok(`upgrade-ots OK · scanned=${upgradeResp.stats.scanned} upgraded=${upgradeResp.stats.upgraded} stillPending=${upgradeResp.stats.stillPending}`);
    if (upgradeResp.stats.errors.length > 0) {
      warn(`Erreurs upgrade : ${JSON.stringify(upgradeResp.stats.errors, null, 2)}`);
    }

    // ─── Étape 10 · vérification cryptographique via verify-proof ──────────
    step(10, "Vérification crypto via Edge Function verify-proof");
    info("Télécharge la .ots et la vérifie contre les calendriers OpenTimestamps...");
    const t1 = Date.now();
    const { data: verifyResp, error: verifyErr } = await supabase.functions.invoke(
      "verify-proof",
      { body: { documentId } },
    );
    const dtVerify = ((Date.now() - t1) / 1000).toFixed(1);
    if (verifyErr) throw new Error(`verify-proof : ${verifyErr.message}`);
    if (!verifyResp?.ok) throw new Error(`verify-proof KO : ${JSON.stringify(verifyResp)}`);
    ok(`Vérification en ${dtVerify}s · verdict=${verifyResp.verdict}`);
    if (verifyResp.verdict === "pending") {
      ok(`Pending attendu juste après l'ancrage : ${verifyResp.reason}`);
    } else if (verifyResp.verdict === "confirmed") {
      ok(`Déjà confirmé · bloc Bitcoin #${verifyResp.blockHeight}`);
    } else {
      warn(`Verdict inattendu : ${verifyResp.verdict} · ${verifyResp.reason ?? ""}`);
    }

    // ─── Étape 11 · scénario falsification (mismatch) ──────────────────────
    step(11, "Simulation de falsification (upload d'un PDF altéré)");
    info("On uploade un PDF différent à la même clé Storage → mismatch attendu");
    const pdfFalsifie = generateTestPdf();  // nouveau timestamp = nouveau contenu = nouveau hash
    await sleep(100);
    const pdfFalsifie2 = generateTestPdf();  // s'assurer que c'est différent
    const pdfAlternatif = pdfFalsifie2.byteLength !== pdfBytes.byteLength ? pdfFalsifie2 : pdfFalsifie;
    const { error: upErr2 } = await supabase.storage
      .from("documents-provisoires")
      .upload(storagePath, pdfAlternatif, { contentType: "application/pdf", upsert: true });
    if (upErr2) throw new Error(`upload falsifié : ${upErr2.message}`);
    ok(`PDF altéré uploadé à la place de l'original`);

    const { data: verifyAfter, error: verifyAfterErr } = await supabase.functions.invoke(
      "verify-proof",
      { body: { documentId } },
    );
    if (verifyAfterErr) throw new Error(`verify-proof post-falsif : ${verifyAfterErr.message}`);
    if (verifyAfter?.verdict !== "mismatch") {
      throw new Error(`Verdict attendu 'mismatch', reçu '${verifyAfter?.verdict}'. Le détecteur de falsification ne marche pas.`);
    }
    ok(`Falsification détectée · verdict=mismatch ✓`);

    // Vérifier que la BD a bien été marquée mismatch par l'Edge Function
    const { data: docFinal } = await supabase
      .from("documents")
      .select("ots_status")
      .eq("id", documentId)
      .single();
    if (docFinal?.ots_status !== "mismatch") {
      throw new Error(`ots_status devrait être 'mismatch' en base, reçu '${docFinal?.ots_status}'`);
    }
    ok(`ots_status propagé en base · ${docFinal.ots_status}`);

    // ─── Étape 12 · scénario rejet de dossier ──────────────────────────────
    step(12, "Test du rejet de dossier (passage en litige)");
    const { data: rejete, error: rejErr } = await supabase
      .from("dossiers")
      .update({ statut: "litige" })
      .eq("id", dossierId)
      .select("statut")
      .single();
    if (rejErr) throw new Error(`rejet dossier : ${rejErr.message}`);
    ok(`Dossier passé en ${rejete.statut}`);

    const { data: history } = await supabase
      .from("dossier_status_history")
      .select("ancien_statut, nouveau_statut, changed_at")
      .eq("dossier_id", dossierId)
      .order("changed_at", { ascending: true });
    ok(`Historique automatique · ${history?.length ?? 0} entrée(s) tracée(s) par trigger`);

    // ═══════════════════════════════════════════════════════════════════════
    // BUNDLE PDF + AUDIO + SIGNATURE BIOMÉTRIQUE
    // ═══════════════════════════════════════════════════════════════════════

    step(13, "Création d'un dossier bundle (PDF + audio + signature)");
    const { data: dossier2, error: d2Err } = await supabase
      .from("dossiers")
      .insert({
        vendeur_nom: "Test Bundle Vendeur",
        acheteur_nom: "Maman Chantal (Bundle)",
        acheteur_nationalite: "beninoise",
        commune: "Abomey-Calavi",
        quartier: "Cocotomey",
        zone: "urbaine",
        parcelle_ref: `BUNDLE-${Date.now()}`,
      })
      .select("id")
      .single();
    if (d2Err) throw new Error(`insert dossier bundle : ${d2Err.message}`);
    const bundleDossierId = dossier2.id;
    ok(`Dossier bundle · ${bundleDossierId}`);

    step(14, "Génération PDF + audio + fausse signature, upload");
    const bundlePdf = generateTestPdf();
    const bundleAudio = generateFakeAudio();
    const fakeSig = sha256(Buffer.from(`fake-pubkey-${Date.now()}`));
    const pdfHashBundle = sha256(bundlePdf);
    const audioHashBundle = sha256(bundleAudio);
    const combinedBundle = computeCombinedHash(pdfHashBundle, audioHashBundle, fakeSig);
    ok(`PDF hash    · ${pdfHashBundle.slice(0, 16)}...`);
    ok(`Audio hash  · ${audioHashBundle.slice(0, 16)}...`);
    ok(`Sig hash    · ${fakeSig.slice(0, 16)}...`);
    ok(`Combined    · ${combinedBundle.slice(0, 16)}...`);

    const bundlePdfPath = `${bundleDossierId}/bundle.pdf`;
    const bundleAudioPath = `${bundleDossierId}/bundle/consentement.webm`;

    const { error: pdfUpErr } = await supabase.storage
      .from("documents-provisoires")
      .upload(bundlePdfPath, bundlePdf, { contentType: "application/pdf", upsert: true });
    if (pdfUpErr) throw new Error(`upload PDF bundle : ${pdfUpErr.message}`);

    const { error: audioUpErr } = await supabase.storage
      .from("documents-audio")
      .upload(bundleAudioPath, bundleAudio, { contentType: "audio/webm", upsert: true });
    if (audioUpErr) {
      throw new Error(
        `upload audio bundle : ${audioUpErr.message}\n` +
        `  ↑ Avez-vous créé le bucket "documents-audio" en public read dans Supabase Dashboard ?`,
      );
    }
    ok(`PDF + audio uploadés`);

    const { data: docBundle, error: docBErr } = await supabase
      .from("documents")
      .insert({
        dossier_id: bundleDossierId,
        type: "attestation_provisoire",
        storage_bucket: "documents-provisoires",
        storage_path: bundlePdfPath,
        sha256: combinedBundle,           // ← le hash ANCRÉ = combined
        pdf_sha256: pdfHashBundle,
        audio_storage_path: bundleAudioPath,
        audio_sha256: audioHashBundle,
        signataire_pubkey_hash: fakeSig,
        signataire_credential_id: "fake-credential-id-test",
        signataire_pubkey_jwk: { kty: "EC", crv: "P-256", x: "fake", y: "fake" },
        signataire_nom: "Maman Chantal Bundle",
      })
      .select("id")
      .single();
    if (docBErr) throw new Error(`insert document bundle : ${docBErr.message}`);
    const bundleDocId = docBundle.id;
    ok(`Document bundle créé · ${bundleDocId}`);

    step(15, "Ancrage Bitcoin du bundle (PDF + audio + signature)");
    const { data: anchorBundle, error: aBErr } = await supabase.functions.invoke(
      "anchor-document",
      { body: { documentId: bundleDocId } },
    );
    if (aBErr) throw new Error(`anchor bundle : ${aBErr.message}`);
    if (!anchorBundle?.ok) throw new Error(`anchor bundle KO : ${JSON.stringify(anchorBundle)}`);
    if (anchorBundle.hash !== combinedBundle) {
      throw new Error(
        `Combined hash divergent. Attendu ${combinedBundle}, ancré ${anchorBundle.hash}`,
      );
    }
    ok(`Bundle ancré sur Bitcoin · combined=${anchorBundle.hash.slice(0, 16)}...`);
    ok(`Preuve · ${anchorBundle.proofPath}`);

    step(16, "Vérification crypto du bundle (verify-proof avec audio)");
    const { data: verifyBundle, error: vBErr } = await supabase.functions.invoke(
      "verify-proof",
      { body: { documentId: bundleDocId } },
    );
    if (vBErr) throw new Error(`verify bundle : ${vBErr.message}`);
    if (!verifyBundle?.ok) throw new Error(`verify bundle KO : ${JSON.stringify(verifyBundle)}`);
    ok(`Verdict bundle · ${verifyBundle.verdict} (hasAudio=${verifyBundle.hasAudio}, hasSignature=${verifyBundle.hasSignature})`);

    step(17, "Falsification du bundle (altération de l'audio)");
    const audioAltere = generateFakeAudio();  // nouveaux bytes
    const { error: altErr } = await supabase.storage
      .from("documents-audio")
      .upload(bundleAudioPath, audioAltere, { contentType: "audio/webm", upsert: true });
    if (altErr) throw new Error(`upload audio altéré : ${altErr.message}`);
    ok(`Audio altéré uploadé à la place de l'original`);

    const { data: verifyAltere } = await supabase.functions.invoke(
      "verify-proof",
      { body: { documentId: bundleDocId } },
    );
    if (verifyAltere?.verdict !== "mismatch") {
      throw new Error(
        `Verdict attendu 'mismatch' après altération audio, reçu '${verifyAltere?.verdict}'`,
      );
    }
    ok(`Falsification audio détectée · verdict=mismatch`);
    ok(`Reason : ${verifyAltere.reason}`);

    // ─── Résumé ─────────────────────────────────────────────────────────────
    console.log(`\n${c.bold}${c.green}━━━ Test end-to-end RÉUSSI ━━━${c.reset}\n`);
    console.log(`${c.gray}Dossier test :  ${dossierId}${c.reset}`);
    console.log(`${c.gray}Document test : ${documentId}${c.reset}`);
    console.log(`${c.gray}Preuve OTS :    ${proofPath}${c.reset}`);
    console.log(`${c.gray}Hash ancré :    ${hash}${c.reset}`);
    console.log(`\n${c.cyan}Prochaine étape :${c.reset}`);
    console.log(`  Attends 30 min à 6h, relance le test, et tu verras le statut passer à 'confirmed'.`);
    console.log(`  Ou attends que le cron tourne automatiquement (toutes les 30 min).`);
    console.log(`\n${c.gray}Pour nettoyer ces données de test plus tard :${c.reset}`);
    console.log(`${c.gray}  delete from dossiers where id = '${dossierId}';${c.reset}`);
    console.log(`${c.gray}  (le document et l'historique se suppriment en cascade)${c.reset}\n`);

  } catch (err) {
    console.log(`\n${c.bold}${c.red}━━━ ÉCHEC ━━━${c.reset}\n`);
    ko(err.message);
    console.log(`\n${c.gray}Contexte au moment de l'erreur :${c.reset}`);
    if (dossierId) console.log(`${c.gray}  dossierId  = ${dossierId}${c.reset}`);
    if (documentId) console.log(`${c.gray}  documentId = ${documentId}${c.reset}`);
    if (storagePath) console.log(`${c.gray}  storagePath = ${storagePath}${c.reset}`);
    if (proofPath) console.log(`${c.gray}  proofPath  = ${proofPath}${c.reset}`);
    console.log("");
    process.exit(1);
  }
}

main();
