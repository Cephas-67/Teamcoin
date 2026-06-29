---
name: vercel-react-best-practices
description: Best practices React + Next.js de l'équipe Vercel Engineering — 70 règles classées en 8 catégories par impact, pour écrire/refactor/review du code React perf-aware. À déclencher quand on écrit un composant React, une page Next.js, du data fetching, ou qu'on optimise un bundle.
source: https://github.com/vercel-labs/agent-skills (skills/react-best-practices/SKILL.md)
license: MIT — Vercel
---

# Vercel React Best Practices — Skill réutilisable

> ✅ **Ce fichier est neutre** — aucune configuration projet requise. Les règles s'appliquent à tout projet React/Next.js.

---

## 🎯 Quand l'activer

- Écriture d'un **nouveau composant React** ou d'une **page Next.js**
- Implémentation de **data fetching** (client ou server)
- Review de code pour identifier des problèmes de perf
- Refacto de code React/Next.js existant
- Optimisation **bundle size** ou **load time**

---

## 📋 Catégories par priorité d'impact

| # | Catégorie | Impact | Préfixe règles |
|---|---|---|---|
| 1 | Éliminer les waterfalls | 🔴 CRITIQUE | `async-` |
| 2 | Optimisation bundle size | 🔴 CRITIQUE | `bundle-` |
| 3 | Performance server-side | 🟠 HAUT | `server-` |
| 4 | Data fetching client | 🟡 MOYEN-HAUT | `client-` |
| 5 | Optimisation re-render | 🟡 MOYEN | `rerender-` |
| 6 | Performance rendering | 🟡 MOYEN | `rendering-` |
| 7 | Performance JS pure | 🟢 BAS-MOYEN | `js-` |
| 8 | Patterns avancés | 🟢 BAS | `advanced-` |

---

## 🔴 1. Éliminer les waterfalls (CRITIQUE)

| Règle | Idée |
|---|---|
| `async-cheap-condition-before-await` | Tester les conditions sync cheap AVANT d'await un flag/valeur remote |
| `async-defer-await` | Déplacer `await` dans la branche qui l'utilise vraiment |
| `async-parallel` | `Promise.all()` pour ops indépendantes |
| `async-dependencies` | `better-all` pour dépendances partielles |
| `async-api-routes` | Démarrer les promises tôt, await tard dans les API routes |
| `async-suspense-boundaries` | Suspense pour stream le contenu |

## 🔴 2. Bundle size (CRITIQUE)

| Règle | Idée |
|---|---|
| `bundle-barrel-imports` | Imports directs, pas via `index.ts` barrel |
| `bundle-analyzable-paths` | Paths d'import statiquement analysables (pas de templates dynamiques) |
| `bundle-dynamic-imports` | `next/dynamic` pour les composants lourds |
| `bundle-defer-third-party` | Analytics / logging chargés APRÈS hydration |
| `bundle-conditional` | Charger un module uniquement si la feature est activée |
| `bundle-preload` | Preload au `hover`/`focus` pour gain de vitesse perçue |

## 🟠 3. Server-side (HAUT)

| Règle | Idée |
|---|---|
| `server-auth-actions` | Server actions auth comme les API routes |
| `server-cache-react` | `React.cache()` pour dedup par requête |
| `server-cache-lru` | LRU cache pour caching cross-request |
| `server-dedup-props` | Éviter la sérialisation dupliquée dans RSC props |
| `server-hoist-static-io` | Hoister I/O statiques (fonts, logos) au niveau module |
| `server-no-shared-module-state` | Pas de state mutable au niveau module en RSC/SSR |
| `server-serialization` | Minimiser la data passée aux client components |
| `server-parallel-fetching` | Restructurer pour paralléliser les fetches |
| `server-parallel-nested-fetching` | Chaîner les fetches imbriqués via `Promise.all` |
| `server-after-nonblocking` | `after()` pour opérations non-bloquantes |

## 🟡 4. Client data fetching (MOYEN-HAUT)

| Règle | Idée |
|---|---|
| `client-swr-dedup` | SWR pour dedup auto des requêtes |
| `client-event-listeners` | Dédupliquer les listeners globaux |
| `client-passive-event-listeners` | `passive: true` sur les listeners de scroll |
| `client-localstorage-schema` | Versionner + minimiser data localStorage |

## 🟡 5. Re-render (MOYEN)

| Règle | Idée |
|---|---|
| `rerender-defer-reads` | Pas de subscribe à un state utilisé seulement dans des callbacks |
| `rerender-memo` | Extraire le travail expensive dans des composants memo |
| `rerender-memo-with-default-value` | Hoister les props non-primitive par défaut |
| `rerender-dependencies` | Dépendances primitives dans les effets |
| `rerender-derived-state` | Subscribe au booléen dérivé, pas à la valeur brute |
| `rerender-derived-state-no-effect` | Dériver le state dans le render, pas dans un effect |
| `rerender-functional-setstate` | Functional setState pour callbacks stables |
| `rerender-lazy-state-init` | Passer une fn à useState pour valeurs expensive |
| `rerender-simple-expression-in-memo` | Pas de `memo` pour des primitives simples |
| `rerender-split-combined-hooks` | Split les hooks aux deps indépendantes |
| `rerender-move-effect-to-event` | Mettre la logique d'interaction dans les event handlers |
| `rerender-transitions` | `startTransition` pour updates non-urgents |
| `rerender-use-deferred-value` | `useDeferredValue` pour renders expensive |
| `rerender-use-ref-transient-values` | `useRef` pour valeurs transitoires fréquentes |
| `rerender-no-inline-components` | Pas de composants définis dans un autre composant |

## 🟡 6. Rendering (MOYEN)

| Règle | Idée |
|---|---|
| `rendering-animate-svg-wrapper` | Animer le `div` wrapper, pas l'élément SVG |
| `rendering-content-visibility` | `content-visibility: auto` pour longues listes |
| `rendering-hoist-jsx` | Extraire le JSX statique hors des composants |
| `rendering-svg-precision` | Réduire la précision des coordonnées SVG |
| `rendering-hydration-no-flicker` | Inline script pour data client-only |
| `rendering-hydration-suppress-warning` | Supprimer les mismatches attendus |
| `rendering-activity` | Composant `Activity` pour show/hide |
| `rendering-conditional-render` | Ternaire, pas `&&` pour les conditionnels |
| `rendering-usetransition-loading` | `useTransition` pour les loading states |
| `rendering-resource-hints` | React DOM resource hints pour preload |
| `rendering-script-defer-async` | `defer` ou `async` sur les `<script>` |

## 🟢 7. JavaScript pur (BAS-MOYEN)

| Règle | Idée |
|---|---|
| `js-batch-dom-css` | Grouper les changements CSS via classes/`cssText` |
| `js-index-maps` | Build une `Map` pour les lookups répétés |
| `js-cache-property-access` | Cacher les propriétés d'objet dans les boucles |
| `js-cache-function-results` | Cacher les résultats de fonction au niveau module |
| `js-cache-storage` | Cacher les reads `localStorage`/`sessionStorage` |
| `js-combine-iterations` | Combiner plusieurs `filter`/`map` en une boucle |
| `js-length-check-first` | Vérifier la longueur du tableau avant comparaison expensive |
| `js-early-exit` | `return` tôt depuis les fonctions |
| `js-hoist-regexp` | Hoister la création de RegExp hors des boucles |
| `js-min-max-loop` | Boucle pour min/max au lieu de `sort` |
| `js-set-map-lookups` | `Set`/`Map` pour lookups O(1) |
| `js-tosorted-immutable` | `toSorted()` pour l'immutabilité |
| `js-flatmap-filter` | `flatMap` pour map + filter en un seul pass |
| `js-request-idle-callback` | `requestIdleCallback` pour le non-critical |

## 🟢 8. Patterns avancés (BAS)

| Règle | Idée |
|---|---|
| `advanced-effect-event-deps` | Pas de `useEffectEvent` dans les deps d'un effect |
| `advanced-event-handler-refs` | Stocker les event handlers dans des refs |
| `advanced-init-once` | Initialiser l'app une fois par app load |
| `advanced-use-latest` | `useLatest` pour refs de callbacks stables |

---

## 📚 Comment utiliser

Pour le détail de chaque règle (mauvais exemple + bon exemple + raison) :
- Format du fichier : `rules/<rule-id>.md` dans le repo source
- Compilé : `AGENTS.md`
- URL source : https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices

**En pratique** : référencer un rule ID dans un commit ou une review (ex: *"appliqué `bundle-barrel-imports` pour réduire le chunk Hero de 40 %"*) permet d'avoir un langage commun et auditable.

---

## ✅ Top 10 à appliquer en priorité

Si on n'a le temps que pour 10 règles dans une codebase existante :

1. `async-parallel` — Promise.all() sur ops indépendantes (gros gain TTFB)
2. `bundle-barrel-imports` — directe vs barrel (gros gain bundle)
3. `bundle-dynamic-imports` — next/dynamic pour composants lourds
4. `rerender-no-inline-components` — pas de composants inline (cause typique de re-render infini)
5. `rerender-functional-setstate` — callbacks stables
6. `server-cache-react` — React.cache() per request
7. `server-parallel-fetching` — paralléliser les fetches RSC
8. `client-passive-event-listeners` — passive sur scroll/touch
9. `rendering-content-visibility` — content-visibility sur longues listes
10. `js-set-map-lookups` — Set/Map pour O(1) (cf. `sectionCenters` killer)
