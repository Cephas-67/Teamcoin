---
name: high-end-visual-design
description: Design d'agence haut de gamme ($150k+ tier) — Apple/Linear/Awwwards. Définit fonts, spacing, shadows, structures de cartes, animations qui font "expensive" et bloque les défauts génériques AI. Variance engine (Vibe + Layout archetypes) à rouler avant chaque output pour éviter la répétition. À déclencher sur "premium design", "agency-tier UI", "Awwwards-quality", "expensive feel".
source: https://github.com/leonxlnx/taste-skill (skills/soft-skill/SKILL.md)
tags: design, premium, agency, awwwards, variance, double-bezel, motion
---

# High-End Visual Design — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Framework d'opinions fortes pour générer du design qui pèse "$150k agency build".

---

## 🎯 Persona & directive

- **Persona** : `Vanguard_UI_Architect`
- **Objectif** : engineer des expériences digitales agence-level ($150k+), pas des sites. L'output doit dégager **haptic depth, cinematic spatial rhythm, obsessive micro-interactions, flawless fluid motion**
- **Variance mandate** : ❌ JAMAIS générer le même layout/aesthetic 2 fois de suite. Combiner dynamiquement les archetypes premium tout en restant strict sur le design language "Apple/Linear-tier"

---

## 🚫 Section 2 — ABSOLUTE ZERO (anti-patterns instant-fail)

Si ton code contient L'UN de ces éléments, le design **fail instantanément** :

| Catégorie | Banni |
|---|---|
| **Fonts** | Inter, Roboto, Arial, Open Sans, Helvetica |
| **Fonts OK** | `Geist`, `Clash Display`, `PP Editorial New`, `Plus Jakarta Sans` |
| **Icons** | Lucide / FontAwesome / Material Icons (stroke épais) |
| **Icons OK** | Phosphor Light, Remix Line (ultra-fins, précis) |
| **Borders** | 1px solid gray générique |
| **Shadows** | `shadow-md`, `rgba(0,0,0,0.3)` (harsh dark drop shadows) |
| **Layouts** | Sticky navbar edge-to-edge collée en haut. Grille Bootstrap 3-col symétrique sans whitespace massif |
| **Motion** | `linear`, `ease-in-out` standard. State changes instantanés sans interpolation |

---

## 🎲 Section 3 — Variance Engine

Avant chaque output : **silently roll the dice** et choisir UNE combo selon le contexte du prompt.

### A. Vibe & Texture Archetypes (pick 1)

| # | Archetype | Pour | Caractéristiques |
|---|---|---|---|
| **1** | **Ethereal Glass** | SaaS / AI / Tech | OLED black `#050505`, radial mesh gradients (orbes purple/emerald subtils), cartes vantablack `backdrop-blur-2xl`, hairlines `white/10`, typo wide Grotesk |
| **2** | **Editorial Luxury** | Lifestyle / Real Estate / Agency | Crèmes chaudes `#FDFBF7`, sage muté, espresso. Variable Serif massif haut-contraste. Noise/film-grain CSS `opacity-[0.03]` |
| **3** | **Soft Structuralism** | Consumer / Health / Portfolio | Silver-grey / blanc pur. Massive bold Grotesk. Composants flottants avec shadows ambient diffuses ultra-soft |

### B. Layout Archetypes (pick 1)

| # | Layout | Détail | Collapse mobile |
|---|---|---|---|
| **1** | **Asymmetrical Bento** | CSS Grid masonry, tailles variables (`col-span-8 row-span-2` à côté de stacked `col-span-4`) | `grid-cols-1`, gaps verticaux généreux `gap-6`, reset des `col-span` |
| **2** | **Z-Axis Cascade** | Éléments empilés comme cartes physiques, overlap avec depth-of-field, rotations `-2deg`/`3deg` pour casser la grille | Remove rotations + negative margins sous 768px (sinon touch-target conflicts) |
| **3** | **Editorial Split** | Typo massive `w-1/2` left, pills horizontales scrollables / cartes staggerées à droite | Convert en `w-full` vertical stack, typo top, scroll horizontal préservé si nécessaire |

### Mobile Override (universel)

- Tout layout asymétrique au-dessus de `md:` → fall back **aggressively** à `w-full`, `px-4`, `py-8` sous 768px
- ❌ JAMAIS `h-screen` pour full-height → toujours **`min-h-[100dvh]`** (évite iOS Safari viewport jumping)

---

## 🪟 Section 4 — Haptic Micro-Aesthetics

### A. Double-Bezel (Doppelrand / Nested Architecture)

> ❌ Ne JAMAIS placer une carte premium flat sur le background. Elles doivent paraître **machined hardware** (plaque de verre dans un plateau alu).

**Structure** :
- **Outer Shell** — wrapper `div` avec bg subtil (`bg-black/5` ou `bg-white/5`), hairline outer (`ring-1 ring-black/5` ou `border border-white/10`), padding (`p-1.5` ou `p-2`), radius large (`rounded-[2rem]`)
- **Inner Core** — container contenu réel, bg distinct, inner highlight (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`), radius mathématiquement plus petit pour courbes concentriques (`rounded-[calc(2rem-0.375rem)]`)

### B. Nested CTA & "Island" Buttons

- **Structure** : pills entièrement rounded (`rounded-full`) avec padding généreux (`px-6 py-3`)
- **Button-in-Button trailing icon** : si arrow (`↗`), JAMAIS nu à côté du texte. Nested dans un wrapper circulaire distinct :
  ```
  w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center
  ```
  positionné flush avec le inner padding right

### C. Spatial Rhythm & Tension

- **Macro-whitespace** : doubler le padding standard. `py-24` à `py-40` pour les sections. Le design **respire fort**
- **Eyebrow tags** : précéder les H1/H2 majeurs d'un microscopic badge pill :
  ```
  rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium
  ```

---

## 🌊 Section 5 — Motion Choreography (Fluid Dynamics)

> ❌ JAMAIS transitions par défaut. Tout motion = mass + spring physics réels. Custom cubic-beziers.

Exemple cubic-bezier recommandé :
```
transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
```

### A. Fluid Island Nav & Hamburger Reveal

| État | Détail |
|---|---|
| **Closed** | Navbar = pill glass flottant détaché du top (`mt-6 mx-auto w-max rounded-full`) |
| **Hamburger Morph** | Click : 2-3 lignes rotate + translate fluidement pour former un X parfait (`rotate-45` / `-rotate-45` avec absolute) — **pas juste disparaître** |
| **Modal Expansion** | Menu = overlay massif screen-filling, glass heavy (`backdrop-blur-3xl bg-black/80` ou `bg-white/80`) |
| **Staggered Mask Reveal** | Liens nav fade-in + slide-up depuis box invisible (`translate-y-12 opacity-0` → `translate-y-0 opacity-100`) avec stagger delays (`delay-100`, `delay-150`, `delay-200`…) |

### B. Magnetic Button Hover Physics

- Utiliser l'utility `group`. Au hover, ne **PAS** juste changer la couleur
- Scale entire button slight down (`active:scale-[0.98]`) — simule pressing physique
- Nested inner icon circle : translate diagonal (`group-hover:translate-x-1 group-hover:-translate-y-[1px]`) + scale up léger (`scale-105`) → kinetic tension interne

### C. Scroll Interpolation (Entry Animations)

> Éléments **JAMAIS** statiques au load.

Pattern d'entrée :
```
translate-y-16 blur-md opacity-0
  →
translate-y-0 blur-0 opacity-100
durée : 800ms+
```

❌ Pour JS scroll reveals : **JAMAIS** `window.addEventListener('scroll')` (reflows continus, kills mobile). Utiliser `IntersectionObserver` ou Framer Motion `whileInView`.

---

## ⚡ Section 6 — Performance Guardrails

| Règle | Détail |
|---|---|
| **GPU-Safe Animation** | ❌ Jamais `top`/`left`/`width`/`height`. ✅ `transform` + `opacity` uniquement. `will-change: transform` parcimonie, sur éléments **activement animés** |
| **Blur Constraints** | `backdrop-blur` UNIQUEMENT sur fixed/sticky (navbars, overlays). ❌ Pas sur scrolling containers / large content (GPU repaints continus + mobile frame drops sévères) |
| **Grain / Noise Overlays** | Exclusivement sur pseudo fixed `pointer-events-none` (`position: fixed; inset: 0; z-index: 50`). ❌ Jamais attaché à un scrolling container |
| **Z-Index Discipline** | ❌ Pas de `z-50` / `z-[9999]` arbitraire. Réserver les z-index pour les couches systémiques : sticky nav, modals, overlays, tooltips |

---

## 🎬 Section 7 — Execution Protocol

Séquence exacte à suivre pour générer du code UI :

1. **[SILENT THOUGHT]** — Roll Variance Engine. Choose Vibe + Layout selon contexte
2. **[SCAFFOLD]** — Background texture, macro-whitespace, typo massive
3. **[ARCHITECT]** — DOM via Double-Bezel pour cards/inputs/grids. Radius exaggéré (`rounded-[2rem]`)
4. **[CHOREOGRAPH]** — Custom cubic-beziers, staggered nav reveals, button-in-button hover physics
5. **[OUTPUT]** — React/Tailwind/HTML pixel-perfect. **Pas de fallbacks génériques basiques**

---

## ✅ Section 8 — Pre-Output Checklist

> Dernière passe avant delivery. Évaluer le code contre cette matrice.

- [ ] **Aucun banned** (fonts, icons, borders, shadows, layouts, motion) de la Section 2
- [ ] Vibe + Layout Archetype de la Section 3 **consciemment** sélectionnés et appliqués
- [ ] Major cards & containers utilisent **Double-Bezel** (outer shell + inner core)
- [ ] CTA boutons utilisent le **Button-in-Button** trailing icon où applicable
- [ ] Section padding minimum **`py-24`** — le layout respire fort
- [ ] Toutes les transitions = **custom cubic-bezier** (jamais `linear` / `ease-in-out`)
- [ ] **Scroll entry animations** présentes — aucun élément statique
- [ ] Layout collapse gracefully sous 768px (`w-full` + `px-4`)
- [ ] Animations = **`transform` + `opacity` seulement**
- [ ] `backdrop-blur` uniquement sur fixed/sticky (jamais scrolling)
- [ ] Impression globale = **"$150k agency build"**, pas "template avec belles fonts"

---

## 🔗 Articulation avec les autres skills

| Skill | Rôle complémentaire |
|---|---|
| `frontend-design` (anthropics) | Parti pris esthétique général (tone extrême, anti AI slop) |
| **`high-end-visual-design`** (ce fichier) | **Framework opinionated agence haut de gamme spécifique** (Apple/Linear/Awwwards) |
| `UI-UX` (projet) | Règles de craft de base |
| `impeccable-animate` | Décisions générales sur le motion |
| `gsap-performance` / `vercel-react-best-practices` | Implémentation perf-aware |

Ce skill est plus **dogmatique** que `frontend-design` — il impose des choix très précis (fonts exactes, archetypes, double-bezel). À utiliser quand on veut vraiment du tier agence premium.
