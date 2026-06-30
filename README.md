# Gandehou · Confiance Foncière ancrée sur Bitcoin

> Couche de preuve d'antériorité et d'intégrité pour les transactions foncières au Bénin. Chaque pièce du dossier (attestation citoyenne, bornage, acte notarié, Titre Foncier) est hachée et horodatée sur Bitcoin via OpenTimestamps, puis vérifiable publiquement par n'importe qui, gratuitement, sans compte.
>
> Hackathon Bitcoin Mastermind 2026 · Cotonou.

---

## 🎯 Positionnement (à lire avant le code)

Gandehou n'est **pas** un substitut au Notaire ni à l'ANDF, ni une preuve de l'origine du droit, ni un rempart contre la corruption en amont. Bitcoin ne prouve pas qu'un vendeur était bien propriétaire : il prouve que le document ancré n'a pas bougé depuis.

Ce que Gandehou apporte réellement :

1. **Antériorité + intégrité** : chaque document officiel ou pré-officiel est haché et horodaté dès sa création. Toute modification ultérieure devient détectable et prouvable publiquement.
2. **Vérification publique instantanée** : drag-and-drop d'un PDF ou scan QR, recalcul du hash, comparaison avec la preuve ancrée, verdict en quelques secondes.
3. **Chaînage de provenance** entre les étapes successives d'un dossier (le hash de l'étape N est inclus dans les métadonnées de l'étape N+1).
4. **Connecteur vers la réforme 2025-2026** : compatible avec le numéro unique parcellaire et le Certificat d'Enregistrement au Cadastre (CEC) introduits par le décret n°2025-176.

> Le rôle du Chef de Quartier n'a aucun statut légal dans le Code Foncier et Domanial. Gandehou le positionne comme une **couche sociale de pré-enregistrement anti-fraude** que la plateforme ajoute, jamais comme un maillon du circuit notarié officiel.

---

## 🧱 Architecture · monorepo

```
.
├── apps/
│   ├── web/                Frontend React 18 + Vite + TS + Tailwind
│   │   ├── src/
│   │   │   ├── pages/      Landing, Connexion, Dashboard, NouveauDossier, Dossier, Verificateur
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/                Backend Express + Node 20
│       └── src/            routes /notarize, /verify, /explorer
│
├── packages/
│   └── ledger/             Logique cryptographique partagée
│       ├── hash.ts             SHA-256 isomorphe
│       ├── opentimestamps.ts   Création + upgrade de preuve OTS
│       ├── signature.ts        Passkey / WebAuthn
│       └── types.ts            Dossier, Document, Preuve
│
├── supabase/               Schéma SQL, RLS, edge functions
├── skills_MD/              Mémoire vivante (AMELIORATIONS.md, GSAP, UI-UX)
├── CLAUDE.md               Charte projet + mémoire mentor
└── README.md
```

**Logique** : `packages/ledger` est isomorphe (navigateur + Node + Edge Function Deno), donc le même code calcule un hash côté client, côté serveur et côté script de vérification publique.

---

## ⚙️ Stack

### Frontend (`apps/web`)
- Vite 8, React 18, TypeScript 5
- Tailwind 3 avec charte Bénin (voir plus bas)
- shadcn-ui (Radix), framer-motion, lenis
- react-hook-form + zod (stepper de saisie)
- react-router-dom 6
- qrcode.react (génération QR) + html5-qrcode (scan)
- pdf-lib ou react-pdf (génération PDF avec filigrane)
- Web Crypto API (SHA-256 natif)

### Backend
- **Supabase** : Postgres, Auth (officiels par email, citoyens par OTP téléphone natif), Storage (buckets séparés provisoire / définitif), Row Level Security par rôle
- **Edge Functions (Deno)** : appel OpenTimestamps, upgrade de la preuve via `pg_cron`
- Express pour les routes ne pouvant pas vivre dans une Edge Function

### Shared (`packages/ledger`)
- TypeScript pur, zéro dépendance lourde
- `javascript-opentimestamps` côté serveur (jamais côté navigateur)

---

## 🎨 Charte visuelle · drapeau Bénin

Sémantique des couleurs ancrée dans le verdict de vérification.

| Token Tailwind | Hex | Usage |
|---|---|---|
| `gandehou-green` | `#008850` | Statut authentique, actions principales |
| `gandehou-yellow` | `#FCD20F` | Provisoire, en attente d'ancrage Bitcoin |
| `gandehou-red` | `#E90929` | Falsifié, hash divergent, litige |
| `gandehou-paper` | `#F8F7E7` | Fond principal |

Police : `Work Sans` (display + body). Icônes : `lucide-react` (ShieldCheck, FileWarning, ShieldAlert, QrCode, Landmark, Bitcoin).

> Règle absolue : pas de couleur hardcodée hors `tailwind.config.ts`. Toujours passer par les tokens.

---

## 🔄 Flux applicatif · 4 grands parcours

1. **Saisie citoyenne** (session OTP, sans compte) : stepper identité, parcelle, voisinage, origine du droit.
2. **Dossier** : visualisation du document provisoire, hash SHA-256 affiché, statut OTS (`pending` / `confirmed` / `mismatch`), QR code de vérification.
3. **Validation Mairie** (compte officiel Supabase Auth) : tableau de bord, action "Approuver et notariser" qui chaîne le hash provisoire dans le document final puis lance un second ancrage.
4. **Vérificateur public** : drag-and-drop ou scan QR, recalcul du hash, verdict trois états.

### Statuts d'un document

| Statut interne | Affichage | Signification |
|---|---|---|
| `pending` | Bandeau jaune "En attente Bitcoin" | Preuve OTS soumise, pas encore dans un bloc miné |
| `confirmed` | Badge vert "Ancré sur Bitcoin" | Preuve incluse dans une transaction Bitcoin confirmée |
| `mismatch` | Bandeau rouge "Modifié après ancrage" | Le hash recalculé ne correspond plus à la preuve |

Honnêteté pédagogique : un bloc Bitcoin met en moyenne ~10 minutes à être miné, l'agrégation OpenTimestamps peut prendre plusieurs heures. Le `pending` est immédiatement utile (preuve de soumission), c'est la confirmation qui demande de la patience.

---

## 🚀 Démarrage

### 1. Supabase

```text
1. Créer un projet sur https://supabase.com
2. SQL Editor : coller supabase/schema.sql, exécuter
3. Activer Phone Auth (provider de test ou Twilio en prod)
4. Settings > API : copier Project URL et service_role secret
5. cp apps/api/.env.example apps/api/.env
6. Renseigner SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
```

### 2. Lancer

```bash
npm install
npm run dev               # web + api en parallèle
# ou
npm run dev:web           # http://localhost:5173
npm run dev:api           # http://localhost:3001
```

---

## 🛣️ Routes

### Frontend
| Route | Rôle |
|---|---|
| `/` | Landing, pitch, cadrage juridique |
| `/connexion` | Auth officiels (email) ou citoyens (OTP téléphone) |
| `/dashboard` | Vue par rôle (citoyen, agent local, agent Mairie) |
| `/dossier/nouveau` | Stepper de saisie avec validation zod et règles ANDF |
| `/dossier/:id` | Document provisoire, hash, QR, statut OTS |
| `/verifier` | Vérification publique sans authentification |
| `/verifier/:id` | Jumeau numérique pour comparaison visuelle |

### API et Edge Functions
| Endpoint | Méthode | Rôle |
|---|---|---|
| `/api/dossiers` | POST | Création + génération PDF provisoire |
| `edge://anchor-document` | trigger | Hash + soumission OpenTimestamps |
| `edge://upgrade-ots` | cron | Tentative de passage `pending` → `confirmed` |
| `/api/verify` | POST | Recalcul du hash + comparaison |

---

## 🧩 Modèle de données (extrait)

Voir `supabase/schema.sql`. Tables principales :

- `profiles` : rôle (`chef_quartier`, `agent_mairie`, `admin`)
- `dossiers` : 1 transaction = 1 dossier, statut (`brouillon`, `atteste_cq`, `valide_mairie`)
- `documents` : type, `sha256`, `hash_parent` (chaînage), `ots_status`, `ots_proof_path`
- `dossier_status_history` : piste d'audit complète
- `otp_sessions` : sessions éphémères citoyennes

---

## 📚 Cadre juridique de référence

| Texte | Apport |
|---|---|
| Loi n°2013-01 du 14/08/2013 | Code Foncier et Domanial fondateur |
| Loi n°2017-15 du 10/08/2017 | Titre Foncier "définitif et inattaquable" (art. 146) |
| 14 août 2023 | Fin de la période transitoire, notaire obligatoire pour toute vente |
| Décret n°2025-176 du 09/04/2025 | Numéro unique parcellaire, Certificat d'Enregistrement au Cadastre (CEC), commune réactivée |
| Loi n°2025-05 du 11/03/2025 | Loi-cadre construction et habitation, permis de construire généralisé |

Source de vérité : `andf.bj`, `sgg.gouv.bj`, FAOLEX. Consulté le 30 juin 2026.

---

## ⏱️ Plan 48h (hackathon)

| Bloc | Heures | Livrable |
|---|---|---|
| 1 | 0 à 8 | Scaffold, Supabase, RLS, auth, layout |
| 2 | 8 à 20 | Stepper de saisie, génération PDF, **premier appel OTS testé tôt** |
| 3 | 20 à 30 | Tableau Mairie, chaînage de hash, second ancrage |
| 4 | 30 à 40 | Vérificateur public, verdict 3 états, cron OTS |
| 5 | 40 à 48 | Jeu de données démo (dont 1 cas falsifié), polish, répétition |

> Risque principal : OpenTimestamps dépend de serveurs externes de calendrier. À tester dès le bloc 2, jamais à laisser pour la fin.

---

## 🇧🇯 Use case · Maman Chantal

Vendeuse de poisson à Dantokpa, illettrée, achète une parcelle à Abomey-Calavi.

1. L'agent local ouvre Gandehou, remplit le stepper avec elle.
2. Génération d'une **attestation provisoire** PDF avec filigrane, QR code, hash SHA-256.
3. Soumission immédiate à OpenTimestamps, statut `pending`, bandeau jaune.
4. Quelques heures plus tard, statut `confirmed`, badge vert "Ancré sur Bitcoin".
5. Deux ans après, un faussaire présente un PDF altéré du même dossier. Scan QR sur la page publique : **bandeau rouge** instantané, preuve recevable devant le tribunal.

---

## 🔒 Sécurité

- Aucun secret en clair, `.env` exclu du repo
- Validation `zod` côté client + RLS côté Postgres
- `target="_blank"` toujours associé à `rel="noopener noreferrer"`
- HTTPS obligatoire en production
- Les hashes ne sont jamais calculés côté client pour les ancrages, uniquement dans les Edge Functions

---

## 🧠 Pourquoi Bitcoin

- **Incorruptibilité temporelle** : aucun admin malveillant ne peut altérer un hash ancré il y a 30 ans.
- **Survie indépendante** : si les serveurs Gandehou s'éteignent, n'importe quel outil open source connecté à Bitcoin décode la preuve.
- **Zéro coût réseau** : OpenTimestamps agrège des milliers de hashes dans un arbre de Merkle, une seule transaction Bitcoin par batch.

---

## 📅 Statut

Hackathon Bitcoin Mastermind 2026 · MVP démonstrable end-to-end (ancrage Bitcoin réel, pas simulé · simulation de fraude bloquée en live).

Voir aussi `CLAUDE.md` (charte projet) et `skills_MD/AMELIORATIONS.md` (leçons accumulées).
