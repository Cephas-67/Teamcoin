---
name: ck-ui-ux-pro-max
description: Design intelligence UI/UX exhaustive pour web + mobile — 50+ styles, 161 palettes, 57 font pairings, 161 product types, 99 UX guidelines, 25 chart types sur 10 stacks (React, Next, Vue, Svelte, SwiftUI, RN, Flutter, Tailwind, shadcn/ui, HTML/CSS). 10 catégories priorisées par impact, intégration shadcn/ui MCP. À déclencher pour design new pages, refactor UI components, choisir palettes/typo/spacing, review UI code.
source: https://github.com/binjuhor/shadcn-lar (.claude/skills/ui-ux-pro-max/SKILL.md)
author: claudekit
---

# UI/UX Pro Max (ClaudeKit) — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise.

Guide design complet pour web + mobile. Database searchable avec priority-based recommendations sur 10 stacks technology.

---

## 🎯 Quand activer

### Must Use
- Designing new pages (Landing, Dashboard, Admin, SaaS, Mobile)
- Creating/refactoring UI components (buttons, modals, forms, tables, charts…)
- Choosing color schemes, typography systems, spacing, layout
- Reviewing UI code pour UX, a11y, visual consistency
- Implementing navigation structures, animations, responsive
- Product-level design decisions (style, hierarchy, brand expression)
- Improving perceived quality

### Recommended
- UI looks "not professional enough" mais raison floue
- Receiving feedback usability/UX
- Pre-launch UI quality optimization
- Aligning cross-platform (Web/iOS/Android)
- Building design systems

### Skip
- Pure backend logic / API / database
- Perf optim non-UI
- Infra / DevOps
- Non-visual scripts

> **Critère de décision** : si la tâche change **how a feature looks, feels, moves, or is interacted with** → activer.

---

## 📊 10 Catégories de règles par priorité d'impact

| # | Catégorie | Impact | Domain | Checks must-have | Anti-patterns à éviter |
|---|---|---|---|---|---|
| **1** | Accessibility | 🔴 CRITICAL | `ux` | Contrast 4.5:1, alt text, keyboard nav, aria-labels | Removing focus rings, icon-only buttons sans labels |
| **2** | Touch & Interaction | 🔴 CRITICAL | `ux` | Min 44×44px, 8px+ spacing, loading feedback | Hover only, instant state changes (0ms) |
| **3** | Performance | 🟠 HIGH | `ux` | WebP/AVIF, lazy loading, reserve space (CLS < 0.1) | Layout thrashing, CLS |
| **4** | Style Selection | 🟠 HIGH | `style`, `product` | Match product type, consistency, SVG icons (no emoji) | Mix flat/skeuomorphic random, emoji as icons |
| **5** | Layout & Responsive | 🟠 HIGH | `ux` | Mobile-first breakpoints, viewport meta, no horizontal scroll | Horizontal scroll, fixed px widths, disable zoom |
| **6** | Typography & Color | 🟡 MEDIUM | `typography`, `color` | Base 16px, line-height 1.5, semantic color tokens | Text <12px body, gray-on-gray, raw hex in components |
| **7** | Animation | 🟡 MEDIUM | `ux` | Duration 150–300ms, motion conveys meaning, spatial continuity | Decorative-only, animating width/height, no reduced-motion |
| **8** | Forms & Feedback | 🟡 MEDIUM | `ux` | Visible labels, error near field, helper text, progressive disclosure | Placeholder-only label, errors only at top |
| **9** | Navigation Patterns | 🟠 HIGH | `ux` | Predictable back, bottom nav ≤5, deep linking | Overloaded nav, broken back, no deep links |
| **10** | Charts & Data | 🟢 LOW | `chart` | Legends, tooltips, accessible colors | Relying on color alone |

---

## 🔴 #1 Accessibility (CRITICAL)

Règles clés (référence rapide) :

| Rule ID | Détail |
|---|---|
| `color-contrast` | 4.5:1 min text normal, 3:1 large text (MD) |
| `focus-states` | Rings 2-4px visibles (HIG, MD) |
| `alt-text` | Descriptive sur images signifiantes |
| `aria-labels` | Sur icon-only buttons, accessibilityLabel en native |
| `keyboard-nav` | Tab order = visual order, full kbd support |
| `form-labels` | `<label for>` |
| `skip-links` | Skip to main content |
| `heading-hierarchy` | h1→h6 séquentiel, no skip |
| `color-not-only` | Ajouter icône/text — pas que la couleur |
| `dynamic-type` | Support system text scaling (Dynamic Type / MD) |
| `reduced-motion` | Respecter `prefers-reduced-motion` |
| `voiceover-sr` | Meaningful accessibilityLabel/Hint, logical reading order |
| `escape-routes` | Cancel/back dans modals + multi-step |
| `keyboard-shortcuts` | Préserver système + a11y shortcuts |

---

## 🔴 #2 Touch & Interaction (CRITICAL)

| Rule ID | Détail |
|---|---|
| `touch-target-size` | 44×44pt (Apple) / 48×48dp (Material) |
| `touch-spacing` | Min 8px/dp gap entre targets |
| `hover-vs-tap` | Click/tap pour primary, pas hover seul |
| `loading-buttons` | Disable + spinner pendant async |
| `cursor-pointer` | Sur clickables (web) |
| `tap-delay` | `touch-action: manipulation` (évite 300ms) |
| `standard-gestures` | Platform standards, ne pas redéfinir |
| `system-gestures` | Don't block (Control Center, back swipe) |
| `press-feedback` | Ripple / state layers MD |
| `haptic-feedback` | Pour confirmations + actions importantes |
| `gesture-alternative` | Toujours visible controls pour actions critiques |
| `safe-area-awareness` | Eloigner targets du notch, Dynamic Island, gesture bar |

---

## 🟠 #3 Performance (HIGH)

| Rule ID | Détail |
|---|---|
| `image-optimization` | WebP/AVIF, srcset/sizes, lazy non-critical |
| `image-dimension` | width/height ou aspect-ratio (anti CLS) |
| `font-loading` | `font-display: swap/optional` |
| `font-preload` | Seulement critical fonts |
| `critical-css` | Above-the-fold prioritisé |
| `lazy-loading` | Dynamic import / route splitting |
| `bundle-splitting` | Par route/feature (Suspense / Next dynamic) |
| `third-party-scripts` | async/defer, audit + remove |
| `reduce-reflows` | Batch reads then writes |
| `lazy-load-below-fold` | `loading="lazy"` |
| `virtualize-lists` | 50+ items |
| `main-thread-budget` | <16ms/frame pour 60fps |
| `progressive-loading` | Skeleton/shimmer pour >1s |
| `input-latency` | <100ms taps/scrolls |
| `debounce-throttle` | High-frequency events |

---

## 🟠 #4 Style Selection (HIGH)

| Rule ID | Détail |
|---|---|
| `style-match` | Match style → product type |
| `consistency` | Même style sur toutes les pages |
| `no-emoji-icons` | SVG icons (Heroicons, Lucide), pas emojis |
| `color-palette-from-product` | Palette dérivée du produit/industrie |
| `effects-match-style` | Shadows/blur/radius alignés au style |
| `platform-adaptive` | iOS HIG vs Material (nav, controls, typo, motion) |
| `state-clarity` | Hover/pressed/disabled visuellement distincts |
| `elevation-consistent` | Scale shadow consistante |
| `dark-mode-pairing` | Light/dark design ensemble |
| `icon-style-consistent` | 1 seul set (stroke width, corner radius) |
| `system-controls` | Préférer natifs, customize si branding |
| `blur-purpose` | Background dismissal (modals), pas déco |
| `primary-action` | 1 seul CTA primary par screen |

---

## 🟠 #5 Layout & Responsive (HIGH)

| Rule ID | Détail |
|---|---|
| `viewport-meta` | `width=device-width initial-scale=1`, **JAMAIS** disable zoom |
| `mobile-first` | Mobile → tablet → desktop |
| `breakpoint-consistency` | 375 / 768 / 1024 / 1440 |
| `readable-font-size` | **Min 16px body mobile** (évite iOS auto-zoom) |
| `line-length-control` | Mobile 35-60 chars, desktop 60-75 |
| `horizontal-scroll` | ❌ jamais sur mobile |
| `spacing-scale` | 4pt/8dp incremental |
| `container-width` | Max-w-6xl / 7xl consistent |
| `z-index-management` | Scale définie : 0 / 10 / 20 / 40 / 100 / 1000 |
| `fixed-element-offset` | Safe padding pour underlying content |
| `viewport-units` | `min-h-dvh` > `100vh` sur mobile |
| `orientation-support` | Landscape readable + operable |
| `content-priority` | Core content first mobile, secondary fold/hide |
| `visual-hierarchy` | Size / spacing / contrast, pas couleur seule |

---

## 🟡 #6 Typography & Color (MEDIUM)

| Rule ID | Détail |
|---|---|
| `line-height` | 1.5-1.75 pour body |
| `line-length` | 65-75 chars/ligne |
| `font-pairing` | Heading + body personnalités matchent |
| `font-scale` | 12 14 16 18 24 32 |
| `contrast-readability` | Darker text on light (slate-900 on white) |
| `text-styles-system` | iOS Dynamic Type / MD type roles (display/headline/title/body/label) |
| `weight-hierarchy` | Bold headings 600-700, regular body 400, medium labels 500 |
| `color-semantic` | Tokens (primary/secondary/error/surface), pas raw hex |
| `color-dark-mode` | Desaturated/lighter tonal, pas inverted |
| `color-accessible-pairs` | 4.5:1 (AA) / 7:1 (AAA) |
| `truncation-strategy` | Wrap > truncate, ellipsis + tooltip |
| `number-tabular` | Tabular figures pour data columns/prices/timers |

---

## 🟡 #7 Animation (MEDIUM)

| Rule ID | Détail |
|---|---|
| `duration-timing` | 150-300ms micro, ≤400ms complexe, ❌ >500ms |
| `transform-performance` | `transform`/`opacity` only |
| `loading-states` | Skeleton si >300ms |
| `excessive-motion` | Max 1-2 key elements/view |
| `easing` | ease-out enter, ease-in exit, ❌ linear UI |
| `motion-meaning` | Express cause-effet, pas décoratif |
| `continuity` | Shared element / directional slide pour transitions |
| `spring-physics` | Préférer spring vs linear/cubic-bezier |
| `exit-faster-than-enter` | Exit ~60-70% de enter |
| `stagger-sequence` | 30-50ms/item list/grid |
| `interruptible` | Tap/gesture cancel anim immédiatement |
| `no-blocking-animation` | UI reste interactive |
| `scale-feedback` | 0.95-1.05 sur press |
| `modal-motion` | Anim depuis trigger source |
| `navigation-direction` | Forward left/up, backward right/down |
| `layout-shift-avoid` | Transform pour position changes |

---

## 🟡 #8 Forms & Feedback (MEDIUM)

| Rule ID | Détail |
|---|---|
| `input-labels` | Label visible (pas placeholder seul) |
| `error-placement` | Sous le field concerné |
| `submit-feedback` | Loading → success/error |
| `required-indicators` | Asterisk |
| `empty-states` | Message helpful + action |
| `toast-dismiss` | Auto-dismiss 3-5s |
| `confirmation-dialogs` | Avant destructive |
| `input-helper-text` | Persistent sous complex inputs |
| `disabled-states` | Opacity 0.38-0.5 + cursor + sémantique |
| `progressive-disclosure` | Reveal complexité progressivement |
| `inline-validation` | Sur blur (pas keystroke) |
| `input-type-keyboard` | email/tel/number → keyboard mobile correct |
| `password-toggle` | Show/hide |
| `autofill-support` | autocomplete/textContentType |
| `undo-support` | "Undo delete" toast |
| `error-clarity` | Cause + how to fix (pas "Invalid input") |
| `aria-live-errors` | aria-live ou role="alert" |
| `focus-management` | Auto-focus 1er invalid field après submit |
| `touch-friendly-input` | Height ≥44px mobile |

---

## 🟠 #9 Navigation Patterns (HIGH)

| Rule ID | Détail |
|---|---|
| `bottom-nav-limit` | Max 5 items + icon+label (MD) |
| `drawer-usage` | Secondary nav, pas primary |
| `back-behavior` | Prévisible + preserve scroll/state |
| `deep-linking` | URL pour tous les screens clés |
| `tab-bar-ios` | Bottom Tab Bar (Apple HIG) |
| `top-app-bar-android` | Top App Bar (MD) |
| `nav-label-icon` | Icon + label (jamais icon seul) |
| `nav-state-active` | Highlight visuel current location |
| `modal-escape` | Close/dismiss clair, swipe-down mobile |
| `breadcrumb-web` | Pour hiérarchies 3+ niveaux |
| `state-preservation` | Restore scroll + filtres au back |
| `adaptive-navigation` | ≥1024px sidebar, mobile bottom/top nav |
| `back-stack-integrity` | Ne JAMAIS silently reset le stack |
| `avoid-mixed-patterns` | ❌ Tab + Sidebar + Bottom Nav au même niveau |
| `modal-vs-navigation` | Modals ≠ primary navigation |

---

## 🟢 #10 Charts & Data (LOW)

| Rule ID | Détail |
|---|---|
| `chart-type` | trend→line, comparison→bar, proportion→pie/donut |
| `color-guidance` | Palette a11y, ❌ red/green seul |
| `data-table` | Alternative table pour a11y |
| `pattern-texture` | Patterns/textures en supplément couleur |
| `legend-visible` | Near chart, pas detached |
| `tooltip-on-interact` | Hover (web) ou tap (mobile) |
| `responsive-chart` | Reflow ou simplify sur small screen |
| `empty-data-state` | "No data yet" + guidance, pas frame vide |
| `loading-chart` | Skeleton/shimmer |
| `large-dataset` | 1000+ → aggregate/sample + drill-down |
| `no-pie-overuse` | ❌ pie pour >5 categories → bar |
| `legend-interactive` | Clickable pour toggle visibility |
| `screen-reader-summary` | text/aria-label avec key insight |

---

## 🧩 Intégrations

- **shadcn/ui MCP** pour component search + examples

## 📚 Stacks couverts (10)

React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, HTML/CSS

## 🎨 Styles couverts (50+)

Glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design, + 40 autres.

## 🗂️ Database contents

- **161 color palettes**
- **57 font pairings**
- **161 product types** avec reasoning rules
- **99 UX guidelines**
- **25 chart types**

Pour query détaillée : `--domain <Domain>` ou `--design-system <recommendation>`.

> 💡 Voir la doc complète sur https://github.com/binjuhor/shadcn-lar pour la base searchable complète.
