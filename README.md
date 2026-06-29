# KandoFoncier · Confiance Foncière

> Notarisation inclusive (audio + biométrie) ancrée de manière éternelle dans la blockchain Bitcoin via OpenTimestamps. Projet hackathon, 24h.

---

## 🎯 Pitch

Éliminer les litiges domaniaux au Bénin (doubles ventes, falsifications) en combinant :

1. **Intention** : enregistrement audio/vidéo du consentement dans la langue locale (Fon, Yoruba, Adja).
2. **Action** : empreinte biométrique sur smartphone (Passkey / WebAuthn) qui signe l'acte.
3. **Vérité universelle** : hash SHA-256 du couple (contrat + audio) ancré sur Bitcoin via OpenTimestamps (frais réseau : 0 FCFA).

Inclusif (40% de la population béninoise est illettrée), incorruptible (Bitcoin), survivant (preuve décodable même si nos serveurs s'éteignent).

---

## 🧱 Architecture · Monorepo

```
.
├── apps/
│   ├── web/                Frontend React + Vite + TS + Tailwind
│   │   ├── src/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                Backend Express.js + Node
│       ├── src/
│       │   ├── routes/     /notarize, /verify, /explorer
│       │   ├── middleware/
│       │   └── server.ts
│       └── package.json
│
├── packages/
│   └── ledger/             Logique notarisation partagée
│       ├── src/
│       │   ├── hash.ts            SHA-256 (contrat + audio)
│       │   ├── opentimestamps.ts  Ancrage Bitcoin via OTS
│       │   ├── signature.ts       Signatures Passkey / WebAuthn
│       │   └── types.ts           Acte, Parcelle, Preuve
│       └── package.json
│
├── package.json            Workspaces npm (orchestration globale)
└── README.md
```

**Pourquoi cette structure** :
- `packages/ledger` centralise la logique cryptographique → réutilisée par le front (vérification publique) ET le back (ancrage).
- `apps/web` reste léger : UI + appels API.
- `apps/api` gère le stockage SQLite et l'appel à OpenTimestamps.

---

## ⚙️ Stack technique

### Frontend (`apps/web`)
- Vite 8 · React 18 · TypeScript 5
- Tailwind 3 + shadcn/ui (Radix)
- framer-motion · lenis · gsap
- react-hook-form + zod
- react-router-dom 6
- MediaRecorder API (audio natif navigateur)
- Web Crypto API (SHA-256 natif)

### Backend (`apps/api`)
- Express.js + Node 20
- **Supabase Postgres** (`@supabase/supabase-js`) → ledger des actes
- multer (upload fichiers)
- OpenTimestamps (simulation MVP, à brancher pour la prod)
- Zod (validation des payloads)
- dotenv

### Shared (`packages/ledger`)
- TypeScript pur, isomorphe (Node + navigateur)
- Aucune dépendance lourde

---

## 🚀 Démarrage

### 1. Supabase

```text
1. Créer un projet sur https://supabase.com
2. SQL Editor → coller le contenu de supabase/schema.sql → Run
3. Settings → API → copier `Project URL` et `service_role secret`
4. cp apps/api/.env.example apps/api/.env
5. Renseigner SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
```

### 2. Lancer le projet
```bash
# Installation globale (workspaces)
npm install

# Lancer les deux serveurs en parallèle (recommandé)
npm run dev

# Ou séparément :
npm run dev:web        # frontend → http://localhost:5173
npm run dev:api        # API      → http://localhost:3001
```

---

## 🛣️ Routes principales

### Frontend
| Route | Rôle |
|---|---|
| `/` | Landing : pitch + use-case Maman Chantal |
| `/notariser` | Upload PDF + enregistrement audio + signature biométrique |
| `/verifier` | Re-scan d'un document → comparaison hash → ✅ ou alerte rouge |
| `/explorer` | Liste publique des actes notarisés (lecture seule) |

### API
| Endpoint | Méthode | Rôle |
|---|---|---|
| `/api/notarize` | POST | Reçoit PDF + audio + signature → hash → ancrage OTS → stocke |
| `/api/verify` | POST | Reçoit fichier → recalcule hash → compare ledger |
| `/api/actes` | GET | Liste publique des actes |
| `/api/actes/:id` | GET | Détail d'un acte + preuve OTS |

---

## 🇧🇯 Use case · Maman Chantal

Vendeuse de poisson à Dantokpa, illettrée, achète une parcelle à Abomey-Calavi.

1. L'agent foncier ouvre **KandoFoncier**, téléverse la convention.
2. Chantal enregistre 10 secondes en **Fon** : « Je, Chantal, achète la parcelle… ».
3. Empreinte sur l'écran → clé cryptographique locale signe → hash combiné ancré sur Bitcoin.
4. **Deux ans plus tard**, le vendeur tente une double vente avec un document falsifié → scan public → **Alerte Rouge** → la vidéo originale témoigne devant le tribunal.

---

## 🧠 Pourquoi Bitcoin (et pas SQL seul ?)

- **Incorruptibilité temporelle** : aucun admin malveillant ne peut altérer un hash ancré il y a 30 ans.
- **Survie indépendante** : si nos serveurs meurent, n'importe quel outil open-source connecté à Bitcoin décode la preuve.
- **Zéro coût réseau** : OpenTimestamps regroupe des milliers de hashes dans un arbre de Merkle, une seule transaction Bitcoin par batch.

---

## 📅 Statut

Hackathon · deadline 24h · MVP démonstrable end-to-end (notarisation réelle + simulation de fraude bloquée en live).
