# 🎯 TRACK_{NAME}.md — Document de Continuité par Feature (template réutilisable)

> **Document de continuité** : à lire en début de session pour reprendre le travail d'une feature/sprint long.
> Format pensé pour les chantiers qui s'étalent sur plusieurs sessions.

---

## 🔧 Configuration projet (à remplir à la création du doc)

| Placeholder | Description | Exemple |
|---|---|---|
| `{NAME}` | Identifiant court du chantier | `A_3D_IMMERSIVE`, `B_AUTH`, `C_DASHBOARD` |
| `{PROJECT_NAME}` | Nom du projet | Mon App |
| `{REFERENCE_URL}` | URL inspiration / cible de niveau | `https://exemple.com` |
| `{TARGET_DESCRIPTION}` | Une phrase qui décrit l'objectif final | "Atteindre le niveau X de Y" |
| `{LAST_UPDATE}` | Date dernière session | YYYY-MM-DD |
| `{PROGRESS_PCT}` | Avancement global estimé | 0–100 |

> Renommer le fichier en `TRACK_{NAME}.md` puis remplir l'en-tête.

---

## 🎯 Objectif final

{TARGET_DESCRIPTION}

Référence visuelle / fonctionnelle : {REFERENCE_URL}

**Dernier état** : {LAST_UPDATE} — **avancement {PROGRESS_PCT} %**

---

## ✅ Récap par session

> Une sous-section par session importante. Du plus récent au plus ancien.

### Session N — {YYYY-MM-DD} — {Titre court}

**Ce qui a été fait** :
-

**Décisions clés** :
-

**Métriques avant/après** (si applicable) :

| | Avant | Après |
|---|---|---|
|  |  |  |

---

### Session N-1 — {YYYY-MM-DD} — {Titre}

…

---

## 🗺️ État actuel par phase

| Phase | État | Reste |
|---|---|---|
| 1 — Foundation | ⬜ / 🟡 / ✅ |  |
| 2 — Core feature |  |  |
| 3 — Polish |  |  |
| 4 — Optimisations |  |  |
| 5 — QA / Edge cases |  |  |

Légende : ⬜ pas commencé · 🟡 en cours · ✅ terminé

---

## 🏆 Roadmap restante

### 🔥 Quick wins (gros effet, peu d'effort)
- [ ]

### 🎬 Polish / niveau Awwwards
- [ ]

### 🚀 Pro-level (nice to have)
- [ ]

### 🐛 Detail polish
- [ ]

---

## 📋 Pour reprendre la prochaine session

**Prompt suggéré à coller** :

> Lis `TRACK_{NAME}.md`. On reprend le chantier. État actuel : {PROGRESS_PCT} %.
> Reste prioritaire : [à compléter]. Demande-moi par quoi commencer.

**Fichiers clés à connaître** :

- [`path/to/file.ts`](path/to/file.ts) — rôle en une phrase
- ...

**Conventions du chantier** :

- (à compléter — ex: ne pas casser X, toujours tester sur Y, etc.)

---

*Document maintenu par sessions Claude · {PROJECT_NAME}*
