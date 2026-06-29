---
name: ck-frontend-design
description: Skill ClaudeKit pour créer des interfaces frontend polies depuis designs/screenshots/vidéos. Web components, 3D experiences, replicating UI designs, quick prototypes, immersive interfaces, anti-AI-slop. Workflow par type d'input + design dials configurables (variance / motion / density). Doit appeler ck:ui-ux-pro-max EN PREMIER pour la design intelligence.
source: https://github.com/binjuhor/shadcn-lar (.claude/skills/frontend-design/SKILL.md)
author: claudekit
---

# Frontend Design (ClaudeKit) — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Sister skill : `ck-ui-ux-pro-max` (à activer en 1er pour la design intelligence).

---

## 🎯 Workflow par type d'input

| Input | Workflow | Reference |
|---|---|---|
| **Screenshot** | Replicate exactly | `./references/workflow-screenshot.md` |
| **Vidéo** | Replicate with animations | `./references/workflow-video.md` |
| **Screenshot/Vidéo (describe only)** | Document for devs | `./references/workflow-describe.md` |
| **3D/WebGL request** | Three.js immersive | `./references/workflow-3d.md` |
| **Quick task** | Rapid implementation | `./references/workflow-quick.md` |
| **Complex/award-quality** | Full immersive | `./references/workflow-immersive.md` |
| **Existing project upgrade** | Redesign audit | `./references/redesign-audit-checklist.md` |
| **From scratch** | Design Thinking (ci-dessous) | — |

> ⚠️ **Avant tout workflow** : activer `ck:ui-ux-pro-max` skill EN PREMIER pour la design intelligence.

> ⚠️ **Precedence** : quand anti-slop rules conflit avec `ck:ui-ux-pro-max` (ex: Inter font, AI Purple palette, Lucide-only icons) → substitue par alternatives de `./references/anti-slop-rules.md` sauf demande explicite.

---

## 📸 Workflow Screenshot/Video Replication (quick ref)

1. **Analyze** avec `ck:ai-multimodal` — extract colors, fonts, spacing, effects
2. **Plan** avec `ui-ux-designer` subagent — create phased implementation
3. **Implement** — match source precisely
4. **Verify** — compare to original
5. **Document** — update `./docs/design-guidelines.md` si approved

---

## 🎛️ Design Dials (paramètres configurables)

3 paramètres qui drivent les décisions. Set defaults au session start ou let user override.

| Dial | Default | Range | Low (1-3) | High (8-10) |
|---|---|---|---|---|
| `DESIGN_VARIANCE` | **8** | 1-10 | Symétrie parfaite, centered, equal grids | Asymétrique, masonry, massive empty zones, fractional CSS Grid |
| `MOTION_INTENSITY` | **6** | 1-10 | CSS hover/active states only | Framer Motion scroll reveals, spring physics, perpetual micro-animations |
| `VISUAL_DENSITY` | **4** | 1-10 | Art gallery — huge whitespace, expensive/clean | Cockpit — tiny paddings, 1px dividers, monospace numbers everywhere |

### Règles drivées par les dials

- `DESIGN_VARIANCE > 4` → centered heroes overused → force **split-screen** ou **left-aligned**
- `MOTION_INTENSITY > 5` → embed **perpetual micro-animations**
- `VISUAL_DENSITY > 7` → remove generic cards, use **spacing/dividers**

Voir `./references/bento-motion-engine.md` pour SaaS dashboard dial-driven.

---

## 🎨 Design Thinking

Avant de coder, s'engager sur une direction **BOLD aesthetic** :

| Aspect | Question |
|---|---|
| **Purpose** | Quel problème l'interface résout ? Qui l'utilise ? |
| **Tone** | Choisir un extrême — brutally minimal · maximalist chaos · retro-futuristic · organic/natural · luxury/refined · playful/toy-like · editorial/magazine · brutalist/raw · art deco/geometric · soft/pastel · industrial/utilitarian… |
| **Constraints** | Framework, perf, a11y |
| **Differentiation** | Qu'est-ce qui rend ça INOUBLIABLE ? Le seul truc qu'on retiendra ? |

> ⚠️ **CRITIQUE** : Choisir une direction conceptuelle claire et l'exécuter avec précision. Bold maximalism et refined minimalism marchent tous deux — la clé est l'**intentionnalité**, pas l'intensité.

Code produit :
- Production-grade et fonctionnel
- Visuellement frappant et mémorable
- Cohérent avec un POV esthétique clair
- Méticuleusement raffiné dans chaque détail

---

## 🎨 Frontend Aesthetics Guidelines

| Aspect | Règle |
|---|---|
| **Typography** | Polices belles, uniques, intéressantes. ❌ Arial/Inter. ✅ Choix distinctifs. Pair display font distinctive + body raffinée |
| **Color & Theme** | Engagement sur aesthetic cohérente. CSS variables pour consistance. **Couleurs dominantes + accents tranchés** > palettes timides distribuées |
| **Motion** | Anim pour effets + micro-interactions. CSS-only en priorité pour HTML. **Motion library** pour React. Focus high-impact : **1 page-load orchestré avec staggered reveals** (animation-delay) > 50 micro-interactions éparpillées |
| **Spatial Composition** | Layouts inattendus. **Asymétrie · overlap · diagonale · grid-breaking**. Negative space généreux OU densité contrôlée |
| **Backgrounds & Visual Details** | Atmosphère + profondeur, pas aplats. Gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, grain overlays |

> ⚠️ **Match implementation complexity à la vision** : maximaliste → code élaboré, minimal → retenue + précision.

---

## 🚫 Anti-Patterns (AI Slop)

> Full rules : `./references/anti-slop-rules.md`

### Typography
- ❌ Inter / Roboto / Arial
- ✅ Trending Google Fonts support vietnamien, **Geist, Outfit, Cabinet Grotesk, Satoshi**

### Font size
- ⚠️ **TOUJOURS** font size > 16px pour inputs (évite zoom mobile)

### Color
- ❌ AI purple/blue gradient aesthetic, pure `#000000`, oversaturated accents
- ✅ Bases neutres avec un seul accent considéré

### Layout
- ❌ 3-column equal card rows, centered heroes à high variance, `h-screen`
- ✅ Asymmetric grids, split-screen, `min-h-[100dvh]`. **Mobile-first obligatoire**

### Content
- ❌ "John Doe", "Acme Corp", round numbers, AI clichés ("Elevate", "Seamless", "Unleash")
- ✅ Realistic names, organic data, plain specific language

### Effects
- ❌ Neon/outer glows, custom cursors, gradient text on headers
- ✅ Tinted inner shadows, spring physics

### Components
- ❌ Default unstyled shadcn, Lucide-only icons, generic card-border-shadow pattern à high density
- ✅ Always customize, try Phosphor/Heroicons, use spacing over cards

---

## 📚 Reference files (sous-skills à charger à la demande)

| Tâche | Reference |
|---|---|
| Generate assets | `./references/asset-generation.md` |
| Analyze quality | `./references/visual-analysis-overview.md` |
| Extract guidelines | `./references/design-extraction-overview.md` |
| Optimization | `./references/technical-overview.md` |
| Animations | `./references/animejs.md` |
| Magic UI (80+ components) | `./references/magicui-components.md` |
| Anti-slop forbidden patterns | `./references/anti-slop-rules.md` |
| Redesign audit checklist | `./references/redesign-audit-checklist.md` |
| Premium design patterns | `./references/premium-design-patterns.md` |
| Performance guardrails | `./references/performance-guardrails.md` |
| Bento motion engine (SaaS) | `./references/bento-motion-engine.md` |

**Quick start** : `./references/ai-multimodal-overview.md`
