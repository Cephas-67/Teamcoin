---
name: sleek-design-mobile-apps
description: Design d'applications mobiles via l'API REST sleek.design — création de projets, génération de screens via prompt langage naturel, screenshots HD, récupération du code HTML pour implémentation native (React Native, SwiftUI…). À déclencher pour "design mobile app", "create app screens", "build mobile UI", ou pour interagir avec un projet Sleek existant.
source: https://github.com/sleekdotdesign/agent-skills (skills/design-mobile-apps/SKILL.md)
required-env: SLEEK_API_KEY
allowed-hosts: https://sleek.design
---

# Sleek Design Mobile Apps — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Nécessite `SLEEK_API_KEY` (plan Pro ou supérieur sur sleek.design).

---

## 🎯 Quand l'activer

- "Design mobile app", "create app screens", "build mobile UI"
- "Add a pricing section / settings screen / onboarding flow"
- "List my Sleek projects", "delete project"
- "Take a screenshot of that screen"
- Implémentation native après design Sleek (React Native, SwiftUI, Flutter)

---

## ⚙️ Setup

```bash
export SLEEK_API_KEY="sk_..."
```

Créer des clés sur **https://sleek.design/dashboard/api-keys** (la valeur complète est montrée **une seule fois** à la création).

### Auth + base

| Champ | Valeur |
|---|---|
| **Base URL** | `https://sleek.design` |
| **Auth header** | `Authorization: Bearer $SLEEK_API_KEY` (sur chaque `/api/v1/*`) |
| **Content-Type** | `application/json` |
| **CORS** | Activé sur tous les `/api/v1/*` |
| **Plan requis** | Pro ou supérieur |

### Scopes des clés

| Scope | Débloque |
|---|---|
| `projects:read` | List / get projects |
| `projects:write` | Create / delete projects |
| `components:read` | List components in a project |
| `chats:read` | Get chat run status |
| `chats:write` | Send chat messages |
| `screenshots` | Render component screenshots |

> 💡 **Principe** : créer une clé avec **uniquement** les scopes nécessaires.

---

## 🔒 Sécurité & confidentialité

- **Single host** : toutes les requêtes vont à `https://sleek.design` uniquement
- **HTTPS only**, clé jamais transmise ailleurs que dans le header `Authorization`
- **Image URLs** dans les chat messages : ces URLs sont **fetchées par les serveurs Sleek** → éviter du contenu sensible
- Préférer clés courte durée / révocables

---

## 📋 Endpoints

| Method | Path | Scope | Rôle |
|---|---|---|---|
| `GET` | `/api/v1/projects` | `projects:read` | List projects |
| `POST` | `/api/v1/projects` | `projects:write` | Create project |
| `GET` | `/api/v1/projects/:id` | `projects:read` | Get project |
| `DELETE` | `/api/v1/projects/:id` | `projects:write` | Delete project |
| `GET` | `/api/v1/projects/:id/components` | `components:read` | List components |
| `GET` | `/api/v1/projects/:id/components/:cmpId` | `components:read` | Get component |
| `POST` | `/api/v1/projects/:id/chat/messages` | `chats:write` | Send chat message |
| `GET` | `/api/v1/projects/:id/chat/runs/:runId` | `chats:read` | Poll run status |
| `POST` | `/api/v1/screenshots` | `screenshots` | Render screenshot |

---

## 💬 Send chat message (core action)

```http
POST /api/v1/projects/:projectId/chat/messages?wait=false
Authorization: Bearer $SLEEK_API_KEY
Content-Type: application/json
idempotency-key: <optional>

{
  "message": { "text": "Add a pricing section with three tiers" },
  "imageUrls": ["https://example.com/ref.png"],
  "target": { "screenId": "scr_abc" }
}
```

| Champ | Required | Notes |
|---|---|---|
| `message.text` | ✅ | 1+ char, trimmed |
| `imageUrls` | ❌ | HTTPS only, contexte visuel |
| `target.screenId` | ❌ | Édite un screen précis (utiliser `screenId`, PAS `componentId`) |
| `?wait=true/false` | ❌ | Sync (default false) |
| `idempotency-key` header | ❌ | Replay-safe re-sends |

### Réponses

**Async (default, `wait=false`)** → `202 Accepted` :
```json
{ "data": { "runId": "run_111", "status": "queued", "statusUrl": "..." } }
```

**Sync (`wait=true`)** → bloque 300s max, retourne `200` si completed, `202` si timeout :
```json
{
  "data": {
    "runId": "run_111",
    "status": "completed",
    "result": {
      "assistantText": "I added a pricing section...",
      "operations": [
        { "type": "screen_created", "screenId": "scr_xyz", "componentId": "cmp_xyz" },
        { "type": "screen_updated", "screenId": "scr_abc", "componentId": "cmp_abc" },
        { "type": "theme_updated" }
      ]
    }
  }
}
```

### Polling

```
Start: 2s interval
After 10s: back off to 5s
Give up after: 5 minutes
```

Lifecycle : `queued → running → completed | failed`

---

## 📸 Screenshots

```http
POST /api/v1/screenshots
Content-Type: application/json

{
  "componentIds": ["cmp_xyz", "cmp_abc"],
  "projectId": "proj_abc",
  "format": "png",
  "scale": 2,
  "gap": 40,
  "padding": 40,
  "background": "transparent",
  "showDots": false,
  "radius": 48
}
```

| Champ | Default | Notes |
|---|---|---|
| `format` | `png` | `png` ou `webp` |
| `scale` | `2` | 1–3 (DPR) |
| `gap` | `40` | Pixels entre composants |
| `padding` | `40` | Uniforme sur tous les côtés |
| `paddingX/Y/Top/Right/Bottom/Left` | — | Cascade : per-side → axis → uniform |
| `background` | `transparent` | CSS color (hex, named, transparent) |
| `showDots` | `false` | Grille de points subtile (auto-adapt couleur) |
| `radius` | `48` | Squircle corner radius (≥ 0, 0 = sharp) |
| `componentVersionOverrides` | — | Map `cmpId` → `verId` pour versions épinglées |
| `themeVersionOverrides` | — | Map `themeId` → `verId` |

> ⚠️ **Toujours `"background": "transparent"`** sauf demande explicite user.

Response : raw `image/png` ou `image/webp` avec `Content-Disposition: attachment`.

---

## 🚦 Workflow complet

### 1. Créer un projet

```http
POST /api/v1/projects
{ "name": "My New App" }
```

Chaque projet = son propre theme + design system. Pour des **variations**, créer un projet par variation.

### 2. Envoyer un chat message

- Passer la demande **telle quelle** → l'IA Sleek interprète le langage naturel
- **Pas besoin** de décomposer en screens — un seul message avec l'intent complet
- Async par défaut, poll pour completion
- **One run at a time** par projet (sinon 409 CONFLICT)
- Cross-projets en parallèle OK avec async polling

### 3. Montrer les résultats

> ⚠️ **TOUJOURS** prendre des screenshots après chaque chat run qui produit `screen_created` ou `screen_updated`. **Jamais** completer silencieusement.

- **Nouveaux screens** : 1 screenshot par screen + 1 combiné de tous les screens
- **Screens modifiés** : 1 screenshot par screen affecté
- `background: "transparent"` sauf demande explicite
- Sauver dans le dossier projet (pas un temp folder) pour visibilité user

---

## 🛠️ Implémentation des designs en code

> ⚠️ **TOUJOURS** récupérer le HTML du composant — ne pas se reposer sur les screenshots seuls.

```http
GET /api/v1/projects/:id/components/:componentId
```

### Quelle version utiliser

- Chaque composant a `versions[]` + `activeVersion: number`
- **Par défaut** : utiliser l'entrée où `versions[i].version === activeVersion`
- Si le prompt user **pin** des versions spécifiques → utiliser celles-là (voir ci-dessous)

### Pinned versions

Bloc dans le prompt user :
```
... at this exact state instead of the project's current version:
- component cmp_abc: version ver_001
- component cmp_def: version ver_002
- theme thm_ghi: version ver_003
```

Pour chaque composant pinné : trouver `versions[i].id === "ver_001"` et utiliser son `code`. **Pas** de fallback sur `activeVersion` pour les composants pinnés.

Pour les screenshots de versions pinnées :
```json
{
  "componentIds": ["cmp_abc"],
  "projectId": "proj_xyz",
  "componentVersionOverrides": { "cmp_abc": "ver_001" },
  "themeVersionOverrides": { "thm_ghi": "ver_003" }
}
```

### HTML prototypes

Le `code` retourné est un **document HTML complet** → sauver directement en `.html`. Aucun build step nécessaire.

### Frameworks natifs (React Native, SwiftUI, Flutter…)

| Source | Rôle |
|---|---|
| **HTML code** | Référence d'**implémentation** — structure, layout, styling, couleurs, spacing, images URLs, icon names |
| **Screenshots** | Cible **visuelle** — vérifier que l'implémentation matche l'aspect |

> HTML dit *comment* construire · screenshot dit *à quoi ça doit ressembler*.

#### Icônes — Iconify (`prefix:name`)

Sets fréquents : **Solar**, **Hugeicons**, **Material Symbols**, **MDI**.

> ⚠️ **Utiliser EXACTEMENT les icônes du HTML** — ne pas substituer avec un autre set (impact direct sur design fidelity).

**Si projet a déjà un système d'icônes** supportant Solar/Hugeicons/Material Symbols/MDI → utiliser.

> ❌ `@expo/vector-icons` ne supporte PAS ces sets. Ne pas l'utiliser comme substitut.

**Sinon** : fetch les SVG depuis Iconify :
```
GET https://api.iconify.design/{prefix}/{name}.svg
```

Pour React Native/Expo : `react-native-svg` + `SvgXml` (compatible Expo Go).

#### Fonts

Le HTML inclut Google Fonts via `<link>` dans `<head>`. Extraire les noms + weights et utiliser les mêmes en natif.

#### Navigation

Les designs incluent souvent tab bars + headers → **mettre à jour la navigation du projet** pour matcher (pas juste le contenu de l'écran).

---

## ❌ Erreurs courantes (à connaître pour debug)

### HTTP errors

| Code | Quand |
|---|---|
| 401 `UNAUTHORIZED` | Clé manquante/invalide/expirée |
| 403 `FORBIDDEN` | Clé OK mais mauvais scope ou plan |
| 404 `NOT_FOUND` | Resource n'existe pas |
| 400 `BAD_REQUEST` | Validation failure |
| 409 `CONFLICT` | Un autre run est déjà actif pour ce projet |
| 500 `INTERNAL_SERVER_ERROR` | Erreur serveur |

### Chat run errors (`data.error`)

| Code | Sens |
|---|---|
| `out_of_credits` | Plus de crédits dans l'organisation |
| `execution_failed` | AI execution error |

### Pièges fréquents

| Erreur | Fix |
|---|---|
| Envoyer sans `Authorization` | Ajouter le header à chaque request |
| Mauvais scope | Vérifier scopes de la clé vs endpoint |
| Envoyer message suivant avant fin du run | Poll jusqu'à `completed`/`failed` |
| `wait=true` sur longue gen | Fallback polling sur `202` |
| HTTP URLs dans `imageUrls` | HTTPS only |
| Assumer `result` présent sur `202` | `result` absent tant que pas `completed` |
| Utiliser `screenId` comme `componentIds` dans screenshots | Toujours `componentId` from `operations` pour screenshots |
| Confondre `versions[i].version` (number) avec `versions[i].id` (string) | Pour pinned versions : match par `id` (ex: `ver_001`) |

---

## 💡 Tips

### Prompter Sleek

- Passer la demande user **as-is** — pas d'ajouts non demandés
- Si user a décrit screens + styling → les inclure
- Si "build me a running app" → envoyer tel quel, laisser Sleek planifier
- Sleek produit des designs plus riches quand on lui laisse de la marge

### Sauvegarde du HTML

Le code peut être lourd. **Ne pas** écrire le contenu via output texte (lent + waste tokens). Utiliser shell pour piper la réponse API directement dans un fichier.

### Pagination

```http
GET /api/v1/projects?limit=10&offset=20
```

- `limit` 1–100, default 50
- `offset` ≥ 0
- Response : `pagination.total` pour itérer

---

## ✅ Checklist workflow

- [ ] `SLEEK_API_KEY` configuré
- [ ] Scopes de la clé matchent les endpoints utilisés
- [ ] Projet créé (ou existant identifié)
- [ ] Chat message envoyé async + polling correct
- [ ] **Screenshots pris après chaque run** (avec `background: "transparent"`)
- [ ] Screenshots sauvés dans le dossier projet
- [ ] Si implémentation native : HTML récupéré (pas seulement screenshots)
- [ ] Icônes utilisées **exactement** comme dans le HTML
- [ ] Fonts + navigation matchent le design
