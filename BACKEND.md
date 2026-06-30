# Backend Gandehou · guide d'intégration frontend

> Document à destination du développeur front. Tout ce que tu peux appeler
> depuis React, organisé par cas d'usage. **Tu n'as jamais à toucher au SQL,
> aux Edge Functions, ni à OpenTimestamps.**

---

## 📦 Imports — un seul point d'entrée

```ts
import {
  // Profils
  getCurrentOfficialProfile, listProfiles, createProfile,
  // Dossiers
  listDossiersAvecDernierDocument, getDossier, getDossierAvecDocuments,
  createDossier, updateDossier, changerStatut, rejeterDossier,
  // Documents
  listDocumentsForDossier, getLatestDocument, createDocument,
  createChainedDocument,
  // Storage
  uploadPdfProvisoire, uploadPdfDefinitif, downloadFile, getPublicUrl,
  STORAGE_BUCKETS,
  // Historique
  getHistory,
  // Règles ANDF
  evaluerReglesAndf, estBloque,
  // Ancrage Bitcoin (Edge Function)
  anchorDocument, triggerUpgradeNow,
  // Vérification publique (rapide, lookup en base)
  verifyFile, verifyByDocumentId,
  // Vérification cryptographique réelle (Edge Function verify-proof)
  verifyFileDeep, verifyDeepByDocumentId, verifyDeepBySha256,
  // Audio (enregistrement vocal du consentement)
  uploadAudio, downloadAudio,
  // Signature biométrique WebAuthn / Passkey
  captureSignature, isPasskeySupported,
  // Bundle PDF + audio + signature avec combined hash
  createDocumentBundle,
} from "@/services";

import type {
  Profile, Dossier, Document, StatusHistoryEntry,
  DossierInput, DossierStatut, Zone, OtsStatus,
} from "@/lib/types";
```

> Tous les services lèvent des erreurs typées en cas de problème. Wrap dans
> un `try/catch` ou utilise `react-query` pour gérer ça proprement.

---

## 🧭 Cas d'usage par page

### Page `/dashboard` (agent Mairie / chef quartier)

```tsx
import { listDossiersAvecDernierDocument } from "@/services";

const dossiers = await listDossiersAvecDernierDocument({
  commune: "Abomey-Calavi",   // filtre par commune pour agent mairie
  // ou creePar: profile.id,  // filtre par auteur pour chef quartier
  statut: "atteste_cq",       // optionnel
  limit: 50,
});

// Chaque entrée a un champ dernier_document avec sha256 + ots_status
dossiers.forEach((d) => {
  console.log(d.id, d.statut, d.dernier_document?.ots_status);
});
```

### Page `/dossier/nouveau` (stepper de saisie)

```tsx
import { createDossier, evaluerReglesAndf, estBloque } from "@/services";

// 1. Pendant la saisie, évalue les règles ANDF en live pour afficher alertes
const eval_ = evaluerReglesAndf(formData);
eval_.alertes.forEach((a) =>
  toast[a.niveau === "bloquant" ? "error" : "info"](a.message)
);

// 2. À la soumission
if (estBloque(eval_)) {
  toast.error("Dossier non conforme, voir alertes.");
  return;
}
const dossier = await createDossier(formData); // les flags ANDF sont calculés auto
navigate(`/dossier/${dossier.id}`);
```

### Page `/dossier/:id` (visualisation + génération PDF + ancrage)

```tsx
import {
  getDossierAvecDocuments, createDocument, uploadPdfProvisoire,
  anchorDocument, STORAGE_BUCKETS,
} from "@/services";
import { sha256OfFile } from "@gandehou/ledger";
import { generateOfficialPdf } from "@/lib/pdf";

// 1. Récupération
const dossier = await getDossierAvecDocuments(id);

// 2. Génération PDF côté client (rapide pour la démo)
const pdfBlob = await generateOfficialPdf(dossier, dossier.documents);

// 3. Hash + insert ligne documents (en pending OTS par défaut)
const sha256 = await sha256OfFile(pdfBlob);
const docTemp = await createDocument({
  dossier_id: dossier.id,
  type: "attestation_provisoire",
  storage_bucket: STORAGE_BUCKETS.PROVISOIRES,
  storage_path: `${dossier.id}/PLACEHOLDER.pdf`,
  sha256,
  hash_parent: null,
  qr_code_url: null,
  created_by: null,
});

// 4. Upload PDF dans le bucket avec le vrai documentId
await uploadPdfProvisoire(dossier.id, docTemp.id, pdfBlob);

// 5. Ancrage Bitcoin · l'Edge Function télécharge le PDF, recalcule le hash,
//    soumet à OpenTimestamps, met à jour la ligne en pending.
const result = await anchorDocument(docTemp.id);
if (!result.ok) toast.error(result.error);
else toast.success("Document ancré sur OpenTimestamps. Confirmation Bitcoin dans quelques heures.");
```

### Page `/dossier/:id` · validation Mairie → convention finale chaînée

```tsx
import { createChainedDocument, uploadPdfDefinitif, anchorDocument, changerStatut, STORAGE_BUCKETS } from "@/services";
import { sha256OfFile } from "@gandehou/ledger";

async function validerEtNotariser(dossierId: string, pdfFinal: Blob) {
  // 1. Hash du PDF final
  const sha256 = await sha256OfFile(pdfFinal);

  // 2. Création du document chaîné · hash_parent rempli auto
  //    avec le sha256 du dernier document (l'attestation provisoire ancrée)
  const doc = await createChainedDocument({
    dossier_id: dossierId,
    type: "convention_finale",
    storage_bucket: STORAGE_BUCKETS.DEFINITIFS,
    storage_path: `${dossierId}/convention.pdf`,
    sha256,
    qr_code_url: null,
    created_by: null,
  });

  // 3. Upload + ancrage
  await uploadPdfDefinitif(dossierId, doc.id, pdfFinal);
  await anchorDocument(doc.id);

  // 4. Changement de statut (le trigger SQL logue automatiquement)
  await changerStatut(dossierId, "valide_mairie");
}
```

> ⚠ `createChainedDocument` **refuse** si l'attestation provisoire parent n'est pas encore ancrée (`ots_proof_path null`). C'est volontaire : chaîner sur un parent non-ancré crée une preuve faible. Attends que l'ancrage soit terminé (statut pending OK, ots_proof_path renseigné).

### Page `/dossier/:id` · rejet d'un dossier (action agent Mairie)

```tsx
import { rejeterDossier } from "@/services";

async function rejet(dossierId: string, motif: string) {
  await rejeterDossier(dossierId, {
    motif,
    acteurId: profile.id,
    acteurLabel: `${profile.role} · ${profile.commune}`,
  });
  // Le statut passe à 'litige' + une entrée d'historique avec le motif est créée.
  toast.success("Dossier rejeté · enregistré dans l'audit trail.");
}
```

### Page `/dossier/:id` · création AVEC audio + empreinte biométrique (bundle)

Cas d'usage Maman Chantal : l'agent foncier enregistre 10s en Fon + Chantal pose son doigt sur l'écran. Les 3 hashes (PDF, audio, pubkey biométrique) sont combinés en cascade et c'est le **combined hash** qui est ancré sur Bitcoin.

```tsx
import {
  uploadAudio, captureSignature, createDocumentBundle,
  uploadPdfProvisoire, anchorDocument, STORAGE_BUCKETS,
} from "@/services";
import { sha256OfFile } from "@gandehou/ledger";
import { AudioRecorder } from "@/components/AudioRecorder";
import { FingerprintCapture } from "@/components/FingerprintCapture";

const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [signature, setSignature] = useState<CapturedSignature | null>(null);

// 1. UI : composants déjà prêts
<AudioRecorder onRecorded={setAudioBlob} />
<FingerprintCapture signataireNom="Maman Chantal" onCaptured={setSignature} />

// 2. À la soumission
async function soumettre() {
  // PDF
  const pdfHash = await sha256OfFile(pdfBlob);
  const doc = await createDocumentBundle({
    dossier_id: dossierId,
    type: "attestation_provisoire",
    storage_bucket: STORAGE_BUCKETS.PROVISOIRES,
    storage_path: `${dossierId}/attestation.pdf`,
    pdf_sha256: pdfHash,
    audio: null,        // pré-rempli avant audio upload
    signature,
  });

  // Upload PDF
  await uploadPdfProvisoire(dossierId, doc.id, pdfBlob);

  // Upload audio (si présent) + lier au document
  if (audioBlob) {
    const audio = await uploadAudio(dossierId, doc.id, audioBlob);
    // recreate document avec audio cette fois (ou update)
    // Plus simple : faire l'upload audio AVANT createDocumentBundle
  }

  // Ancrage Bitcoin du combined hash
  await anchorDocument(doc.id);
}
```

**Logique du combined hash** (alignée entre client, Edge Function et test) :

```
acc = pdf_sha256
si audio     :  acc = SHA-256(acc + "::" + audio_sha256)
si signature :  acc = SHA-256(acc + "::" + signataire_pubkey_hash)
```

C'est CE `acc` final qui est stocké dans `documents.sha256` et qui est ancré sur Bitcoin. Si UN SEUL des 3 éléments est altéré (PDF, audio ou pubkey), la vérification crypto échoue.

### Page `/verifier` · vérification CRYPTO réelle (verify-proof)

Pour le badge instantané : `verifyFile(file)` (lookup en base, instantané).

Pour la **vraie validation crypto** (à appeler en arrière-plan ou sur bouton "Vérifier sur Bitcoin") :

```tsx
import { verifyFileDeep } from "@/services";

const deep = await verifyFileDeep(droppedFile);
// deep.verdict : "confirmed" | "pending" | "mismatch" | "invalid"
// deep.blockHeight, deep.bitcoinTimestamp si confirmed
// deep.expectedHash, deep.actualHash si mismatch (PDF altéré en Storage)
```

C'est cette vérification qui télécharge le `.ots`, le valide contre les calendriers OpenTimestamps et confirme la hauteur de bloc Bitcoin **indépendamment de ta base**. Si demain ton serveur Gandehou est éteint, cette même vérification peut être faite par n'importe quel outil OpenTimestamps tiers.

### Page `/verifier` (publique, sans authentification)

```tsx
import { verifyFile, verifyByDocumentId } from "@/services";

// Mode A · drag-and-drop d'un PDF
const verdict = await verifyFile(droppedFile);

switch (verdict.verdict) {
  case "authentique":  // 🟢 vert
    return <BadgeVert message={verdict.message} dossier={verdict.dossier} />;
  case "en_attente":   // 🟡 jaune
    return <BadgeJaune message={verdict.message} />;
  case "falsifie":     // 🔴 rouge
    return <BadgeRouge reason={verdict.reason} />;
  case "introuvable":  // 🔴 rouge
    return <BadgeRouge reason={verdict.reason} />;
}

// Mode B · scan QR code → tu as un UUID document
const verdict = await verifyByDocumentId(uuidDuQrCode);
```

### Bouton "Vérifier maintenant" (démo · forcer l'upgrade OTS)

```tsx
import { triggerUpgradeNow } from "@/services";

const { stats } = await triggerUpgradeNow();
toast.success(`${stats.upgraded} doc(s) passés en confirmed sur ${stats.scanned} scannés.`);
```

---

## 🎨 Mapping statut OTS → couleur (charte Bénin)

| `ots_status` | Couleur Tailwind | Sémantique |
|---|---|---|
| `pending` | `bg-gandehou-yellow` | Soumis, en attente Bitcoin |
| `confirmed` | `bg-gandehou-green` | Ancré sur Bitcoin |
| `mismatch` | `bg-gandehou-red` | Modifié après ancrage |

| Verdict `verifyFile()` | Couleur |
|---|---|
| `authentique` | green |
| `en_attente` | yellow |
| `falsifie` | red |
| `introuvable` | red |

---

## ⚠ Conventions à respecter

1. **Toujours typer** : `Dossier`, `Document`, etc. depuis `@/lib/types`. Jamais `any`.
2. **Toujours uploader AVANT d'ancrer** : `uploadPdfProvisoire(...)` puis `anchorDocument(...)`. L'Edge Function télécharge depuis Storage pour recalculer le hash, elle ne fait pas confiance au navigateur.
3. **Ne JAMAIS appeler OpenTimestamps depuis le navigateur** : utilise `anchorDocument()` qui passe par l'Edge Function. Sinon clé de calendrier exposée + risque navigateur fermé mid-stamp.
4. **La page `/verifier` reste publique** : pas de login requis, RLS permet le SELECT sur `documents` et `dossiers` pour tout le monde.

---

## 🐛 Debug rapide

| Symptôme | À regarder |
|---|---|
| `Edge Function not found` | `supabase functions deploy anchor-document` exécuté ? |
| `Hash divergent` à l'ancrage | tu as modifié le PDF entre `createDocument` et `anchorDocument` |
| Verdict toujours `introuvable` | le PDF a-t-il bien été uploadé dans le bucket attendu ? |
| `ots_status` reste `pending` | normal pendant 10 min à 6h. Force avec `triggerUpgradeNow()` pour la démo |
| Erreur `RLS violation` | RLS pour le hackathon est `using(true)` partout, donc pas censé arriver. Vérifie les noms de colonnes |

---

## 📁 Architecture de référence

```
apps/web/src/
├── lib/
│   ├── supabase.ts    ← client + reexport types
│   └── types.ts       ← types miroirs de supabase/schema.sql
└── services/
    ├── index.ts       ← barrel (import unique : "@/services")
    ├── profiles.ts    ← CRUD profils
    ├── dossiers.ts    ← CRUD dossiers + filtres + listes enrichies
    ├── documents.ts   ← CRUD documents + recherche par sha256
    ├── storage.ts     ← upload/download buckets
    ├── history.ts     ← lecture audit trail
    ├── regles-andf.ts ← moteur juridique pur
    ├── anchor.ts      ← invocation Edge Function ancrage
    └── verify.ts      ← workflow vérification publique
```

```
packages/ledger/src/
├── hash.ts            ← sha256, sha256OfFile, combinedHash (Web Crypto)
├── opentimestamps.ts  ← wrapper @otskit/client (Node uniquement)
└── types.ts           ← types Acte/Personne/Parcelle (legacy)
```

```
supabase/
├── schema.sql                              ← schéma complet (B1)
├── migrations/pg_cron_upgrade_ots.sql      ← planification cron (B6)
└── functions/
    ├── _shared/                            ← code partagé Edge Functions
    │   ├── cors.ts
    │   ├── supabase-admin.ts
    │   └── ots.ts                          ← wrapper @otskit/client Deno
    ├── anchor-document/index.ts            ← POST { documentId } → pending
    ├── upgrade-ots/index.ts                ← cron pending → confirmed
    └── README.md                           ← guide déploiement
```

---

*Backend prêt. Si quelque chose te bloque côté front, dis-le, on l'ajoute.*
