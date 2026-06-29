---
name: frontend-design
description: Skill officiel Anthropic — créer des interfaces distinctives, production-grade, qui évitent l'esthétique "AI slop" générique. À déclencher quand l'utilisateur demande un composant, une page, un artifact, une landing, un dashboard, un poster ou tout UI web à designer / sublimer.
source: https://github.com/anthropics/skills (skills/frontend-design/SKILL.md)
license: Anthropic — voir LICENSE.txt du repo source
---

# Frontend Design — Skill réutilisable

> ✅ **Ce fichier est neutre** — aucune configuration projet requise. Complémentaire de `UI-UX.md` (qui couvre les règles de craft) et `SKILL.md` design (le point d'entrée du projet).

---

## 🎯 Quand l'activer

Sur toute demande de **création visuelle** : composant, page, landing, dashboard, artifact React, layout HTML/CSS, "rends ça plus beau", "design-moi…", etc.

Objectif : générer du code **production-grade** + un **vrai parti pris esthétique** — pas un template recyclé.

---

## 🧠 Design Thinking (avant de coder)

S'engager sur une **direction esthétique forte** avant la 1re ligne de code :

| Question | Ce qu'on cherche |
|---|---|
| **Purpose** | Quel problème résout l'interface ? Pour qui ? |
| **Tone** | Choisir un extrême : *brutalement minimal · maximaliste · rétro-futuriste · organique · luxe · jouet · éditorial magazine · brutaliste · art déco · pastel · industriel*… |
| **Constraints** | Stack imposée, perf, a11y |
| **Differentiation** | Quelle est **LA** chose qu'on retiendra ? |

> ⚠️ **Critique** : choisir une direction conceptuelle claire et l'exécuter avec précision. Le maximalisme audacieux et le minimalisme raffiné fonctionnent tous deux — la clé est l'**intentionnalité**, pas l'intensité.

Puis implémenter du code (HTML/CSS/JS, React, Vue…) qui est :
- Production-grade et fonctionnel
- Visuellement frappant et mémorable
- Cohérent avec un point de vue esthétique clair
- Méticuleusement raffiné dans chaque détail

---

## 🎨 Frontend Aesthetics — leviers à activer

### Typographie
- Polices **belles, uniques, intéressantes**
- ❌ **Éviter** : Arial, **Inter**, Roboto, system fonts génériques
- ✅ Polices de caractère : une display distinctive + une body raffinée
- Pas de convergence inter-générations (ex. tout le monde finit sur Space Grotesk → bannir le réflexe)

### Couleur & Thème
- Engagement sur une **esthétique cohérente**
- CSS variables pour la consistance
- **Couleurs dominantes + accents tranchés** > palettes timides distribuées également

### Motion
- Animations pour effets + micro-interactions
- CSS-only en priorité pour HTML pur
- **Motion library** pour React quand dispo
- Focus sur les **gros moments** : un page-load orchestré avec reveals staggered (`animation-delay`) > 50 micro-interactions éparpillées
- Scroll-triggering + hover states **qui surprennent**

### Composition spatiale
- Layouts inattendus
- **Asymétrie · overlap · diagonale · grid-breaking**
- Negative space généreux **OU** densité contrôlée — pas l'entre-deux

### Backgrounds & détails visuels
Créer **atmosphère et profondeur**, pas des aplats unis. Outils :
- Gradient meshes
- Textures noise / grain overlays
- Patterns géométriques
- Transparences en couches
- Shadows dramatiques
- Bordures décoratives
- Custom cursors

---

## 🚫 Interdits — l'esthétique "AI slop"

| Catégorie | À bannir |
|---|---|
| **Polices** | Inter, Roboto, Arial, system fonts par défaut |
| **Couleurs** | **Dégradés violets sur fond blanc** (cliché ultime) |
| **Layouts** | Patterns prévisibles, 3 cards icône+titre+texte |
| **Composants** | Cookie-cutter, aucun caractère contextuel |

---

## 🎯 Règle de cohérence implémentation ↔ vision

**Important** : faire correspondre la **complexité du code** à la **vision esthétique**.

| Vision | Implémentation |
|---|---|
| **Maximaliste** | Code élaboré, anims extensives, effets nombreux |
| **Minimaliste / raffiné** | Retenue, précision, attention aux espaces / typo / détails subtils |

> L'élégance vient de **bien exécuter** la vision, pas d'empiler des effets.

---

## 🔗 Articulation avec les autres skills du repo

| Skill | Rôle complémentaire |
|---|---|
| `SKILL.md` (design — entrée projet) | Point d'entrée + paths du projet + workflow obligatoire |
| `UI-UX.md` | Règles de craft (typo, layout, anim, a11y, checklist) — le **comment construire** |
| `COMPONENTS.md` | Catalogue de composants premium externes à intégrer |
| **`frontend-design.md` (ce fichier)** | **Le pourquoi visuel + le parti pris esthétique** — à utiliser pour briefer la direction avant de coder |
| `gsap-performance.md` | Quand on choisit du motion lourd, vérifier qu'il reste à 60 fps |

---

## ✅ Mantra final

> Claude est capable de travail créatif extraordinaire. **Ne pas se retenir.** Montrer ce qu'on peut vraiment créer quand on pense hors du cadre et qu'on s'engage pleinement sur une vision distinctive.
