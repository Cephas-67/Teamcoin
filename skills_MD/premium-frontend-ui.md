---
name: premium-frontend-ui
description: Guide pour générer des expériences web premium immersive — au-delà du HTML/CSS fonctionnel. Cible Awwwards-level avec motion design system, typo cinematic, scroll narratives, magnetic interactions, perf strict (transform+opacity uniquement), eco de libs adapté React/Next ou Vanilla/Astro. À déclencher sur "premium landing page", "Awwwards-style", "immersive UI", "interactive portfolio".
source: https://github.com/github/awesome-copilot (skills/premium-frontend-ui/SKILL.md)
author: Utkarsh Patrikar
tags: premium, awwwards, immersive, motion, scroll-narrative, magnetic, typography
---

# Premium Frontend UI — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Framework de génération pour expériences web tier Awwwards.

> Rôle : architecter des **environnements digitaux immersifs**, pas générer du HTML/CSS fonctionnel.

---

## 🎯 Quand l'activer

- "Build a premium landing page"
- "Create an Awwwards-style component"
- "Design an immersive UI"
- "Interactive portfolio"
- "Specialized component avec top-tier visual polish"

---

## 🎨 Section 1 — Fondation créative

Avant de générer du code de layout, comprendre la **résonance émotionnelle** cible. **Ne pas** default à du générique unopinionated.

S'engager sur une **identité visuelle forte** dans le CSS + component structure :

| Identité | Caractéristiques |
|---|---|
| **Editorial Brutalism** | Palettes monochromatiques high-contrast, typo oversized, edges rectangulaires sharp, raw grid structures |
| **Organic Fluidity** | Soft gradients, corners deeply rounded, glassmorphism overlays, bouncy spring-based physics |
| **Cyber / Technical** | Dark mode dominant, neon glowing accents, typo monospaced, rapid staggered reveal animations |
| **Cinematic Pacing** | Full-viewport imagery, slow cross-fades, profound use of negative space, scroll-dependent storytelling |

---

## 🏗️ Section 2 — Architecture immersive obligatoire

### 2.1 Entry Sequence (Preloading & Init)

> ❌ Une blank screen est **inacceptable**.

- Generate **lightweight preloader** qui gère la résolution d'assets (fonts, initial images, 3D models)
- Animation : transition fluide — **split-door reveal**, scale-up zoom, ou staggered text sweep

### 2.2 Hero Architecture

> Le top fold doit **commander l'attention immédiatement**.

- **Visuals** : containers full-bleed (`100vh` / `100dvh`)
- **Typography Engine** : headlines décomposées syntaxiquement (span wrapping par mot ou char) pour cascading entrance animations
- **Depth** : floating elements subtils ou clipping paths pour suggérer scale + depth

### 2.3 Navigation fluide & contextuelle

| Pattern | Détail |
|---|---|
| ❌ Pas de navbars statiques standard | — |
| ✅ Sticky headers réactifs au scroll direction | Hide on scroll down, reveal on scroll up |
| ✅ Hover states riches | Mega-menus avec image previews du link survolé |

---

## 🌊 Section 3 — Motion Design System

> Animation = **connective tissue** d'un site premium, pas afterthought.

### 3.1 Scroll-Driven Narratives

Utiliser libs scroll modernes (GSAP ScrollTrigger…) pour tier animations au progress user.

| Pattern | Détail |
|---|---|
| **Pinned Containers** | Sections qui lock dans le viewport, contenu secondaire qui flow / se reveal |
| **Horizontal Journeys** | Translate vertical scroll → horizontal movement (galeries / showcases) |
| **Parallax Mapping** | Scroll-speeds variables sur background / midground / foreground |

### 3.2 High-Fidelity Micro-Interactions

> Le curseur = avatar de l'utilisateur. Construire des interactions autour.

| Pattern | Détail |
|---|---|
| **Magnetic Components** | Calculer distance pointer ↔ button, attirer le button vers le curseur dynamiquement |
| **Custom Tracking Elements** | Custom cursor avec interpolation calculée (lerp) pour smooth drag |
| **Dimensional Hover States** | CSS Transforms (`scale`, `rotateX`, `translate3d`) pour weight + tactile feedback |

---

## 🅰️ Section 4 — Typography & Visual Texture

| Aspect | Règle |
|---|---|
| **Type Hierarchy** | Contrast massif en scale. Headlines → `clamp()` extreme jusqu'à `12vw`. Body crisp min `16-18px` |
| **Font Selection** | Variable fonts ou typefaces premium > system defaults |
| **Atmospheric Filters** | CSS/SVG noise overlays (`mix-blend-mode: overlay`, opacity `0.02-0.05`) → enlève la sterility digitale, ajoute photo-grain |
| **Lighting & Glass** | `backdrop-filter: blur(x)` + ultra-thin borders semi-transparents → frosted-glass depth |

---

## ⚡ Section 5 — Performance imperative

> Un site beau qui stutter = un failure.

| Règle | Détail |
|---|---|
| **Hardware Acceleration** | Animer **seulement** `transform` + `opacity`. ❌ `width`, `height`, `top`, `margin` à éviter fiercement |
| **Render Optimization** | `will-change: transform` intelligemment sur éléments complexes. **Retirer post-animation** pour libérer mémoire |
| **Responsive Degradation** | Custom cursor + heavy hover anims wrappés dans `@media (hover: hover) and (pointer: fine)` |
| **Accessibility** | Heavy continuous anims dans `@media (prefers-reduced-motion: no-preference)` |

---

## 📚 Section 6 — Implementation Ecosystem

### Pour cibles React / Next.js

| Use case | Lib |
|---|---|
| Layout transitions + spring physics | **Framer Motion** |
| Smooth scrolling context | **Lenis** (`@studio-freight/lenis`) |
| WebGL / 3D interactions | **React Three Fiber** (`@react-three/fiber`) |

### Pour cibles Vanilla / HTML / Astro

| Use case | Lib |
|---|---|
| Timeline sequencing | **GSAP** (GreenSock) |
| Scroll hijacking / smoothing | **Lenis** vanilla via CDN |
| Typo chunking safe + accessible | **SplitType** |

---

## ✅ Action Summary

Sur prompt "Build a premium landing page" / "Awwwards-style" / "immersive UI", automatiquement :

1. **Wrap** l'output dans une architecture robuste scroll-smoothed
2. **Provide CSS** qui garantit perf parfaite via composited layers
3. **Integrate** sweeping staggered component entrances
4. **Elevate** la typographie via fluid scales
5. **Create** un footprint esthétique intentionnel + mémorable

---

## 🔗 Articulation avec les autres skills design

| Skill | Position dans la pyramide |
|---|---|
| `UI-UX` (projet) | Règles craft de base (typo, layout, anti-AI-slop) |
| `frontend-design` (anthropics) | Vision esthétique (parti pris audacieux, anti-slop fontwise) |
| `web-design-guidelines` (vercel) | Audit checklist (a11y, focus, perf) — file:line output |
| `vercel-react-best-practices` | 70 règles perf React/Next.js (rerender, bundle, RSC…) |
| `impeccable-animate` | Décisions générales motion (100/300/500 rule, easing, materials) |
| `gsap-performance` | Implémentation GSAP perf-aware spécifiquement |
| `high-end-visual-design` | Dogmatique agence tier $150k+ (variance engine, double-bezel, fonts/icons bannis) |
| **`premium-frontend-ui`** (ce fichier) | **Spec d'architecture immersive complète** — preloader + hero + nav + scroll narratives + magnetic + typo + ecosystem libs |
| `canvas-design` | Art statique (.png/.pdf), différent — sortie média pas web |

Ce skill est **le plus complet pour l'architecture web premium** : il couvre tout le pipeline du preloader à la navigation, avec choix de libs explicites par stack. À utiliser pour scaffold un site Awwwards from scratch.
