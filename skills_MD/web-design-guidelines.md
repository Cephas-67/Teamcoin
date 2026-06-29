---
name: web-design-guidelines
description: Audit UI code contre les Web Interface Guidelines de Vercel — a11y, focus, formulaires, animations, typo, perf, dark mode, i18n, hydration. À déclencher sur "review my UI", "check accessibility", "audit design", "review UX", ou pour valider un composant avant merge.
source: https://github.com/vercel-labs/agent-skills (skills/web-design-guidelines) + https://github.com/vercel-labs/web-interface-guidelines
license: MIT — Vercel
---

# Web Interface Guidelines — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Checklist exhaustive pour auditer du code UI web.

---

## 🎯 Quand l'activer

- Review de PR sur des composants UI
- "Vérifie l'accessibilité de X"
- "Audit design de cette page"
- Validation finale avant merge d'un nouveau composant
- Refacto ciblé d'un composant existant

---

## 🛠️ Mode d'emploi

1. **Lire** le(s) fichier(s) ciblé(s)
2. **Cocher** contre chaque catégorie ci-dessous
3. **Output** au format `file:line — description courte` (style VS Code, cliquable)
4. **Sacrifier la grammaire pour la concision** — high signal-to-noise ratio

---

## ♿ Accessibility

- Boutons icône-seule → `aria-label`
- Form controls → `<label>` ou `aria-label`
- Interactive elements → keyboard handlers (`onKeyDown`/`onKeyUp`)
- `<button>` pour actions, `<a>`/`<Link>` pour navigation — **JAMAIS `<div onClick>`**
- Images → `alt` (ou `alt=""` si décoratif)
- Icônes décoratives → `aria-hidden="true"`
- Updates async (toast, validation) → `aria-live="polite"`
- HTML sémantique (`<button>`, `<a>`, `<label>`, `<table>`) **avant** ARIA
- Headings hiérarchiques `<h1>`–`<h6>` + skip-link vers main
- `scroll-margin-top` sur les ancres de headings

## 🎯 Focus States

- Tout interactif → focus visible (`focus-visible:ring-*` ou équivalent)
- ❌ Jamais `outline-none` sans replacement
- `:focus-visible` > `:focus` (évite le ring au clic)
- Group focus avec `:focus-within` pour compound controls

## 📝 Forms

- Inputs → `autocomplete` + `name` significatif
- Type correct (`email`, `tel`, `url`, `number`) + `inputmode`
- ❌ Ne **jamais** bloquer `paste` (`onPaste` + `preventDefault`)
- Labels cliquables (`htmlFor` ou wrapping)
- `spellCheck={false}` sur emails / codes / usernames
- Checkbox / radio → label + control partagent un **hit target unique**
- Submit bouton actif jusqu'au start de la request, spinner pendant
- Erreurs inline next aux fields, focus sur la 1re erreur au submit
- Placeholders terminent par `…` + show pattern exemple
- `autocomplete="off"` sur les non-auth (évite triggers password manager)
- Warn avant navigation avec changements non sauvés

## 🎬 Animation

- Honor `prefers-reduced-motion`
- Animer **`transform` + `opacity` uniquement** (compositor-friendly)
- ❌ Jamais `transition: all` — lister les propriétés explicitement
- `transform-origin` correctement positionné
- SVG : transforms sur `<g>` wrapper + `transform-box: fill-box; transform-origin: center`
- Animations **interruptibles** (responsive à l'input user mid-animation)

## 🅰️ Typographie

- `…` (ellipsis Unicode) **pas** `...`
- Guillemets courbes `"` `"` **pas** droits `"`
- `&nbsp;` insécables : `10&nbsp;MB`, `⌘&nbsp;K`, brand names
- Loading states terminent par `…` : `"Loading…"`, `"Saving…"`
- `font-variant-numeric: tabular-nums` pour colonnes de chiffres / comparaisons
- `text-wrap: balance` ou `text-pretty` sur les headings (évite les widows)

## 📦 Content Handling

- Containers text → `truncate`, `line-clamp-*`, ou `break-words`
- Flex children → `min-w-0` pour autoriser truncation
- Gérer les **empty states** — pas de UI cassée sur strings/arrays vides
- Anticiper short / average / very long inputs sur le contenu user

## 🖼️ Images

- `<img>` → `width` et `height` explicites (évite CLS)
- Below-fold → `loading="lazy"`
- Critical above-fold → `priority` ou `fetchpriority="high"`

## ⚡ Performance

- Listes >50 items → **virtualiser** (`virtua`, `content-visibility: auto`)
- ❌ Pas de layout reads dans render (`getBoundingClientRect`, `offsetHeight/Width`, `scrollTop`)
- Batch reads/writes DOM, pas d'alternance
- Préférer uncontrolled inputs ; controlled = doit être cheap par keystroke
- `<link rel="preconnect">` pour CDN/asset domains
- Fonts critiques : `<link rel="preload" as="font">` + `font-display: swap`

## 🧭 Navigation & State

- URL reflète le state — filtres, tabs, pagination, panneaux ouverts dans query params
- Links → `<a>`/`<Link>` (support Cmd/Ctrl-click, middle-click)
- Deep-link tout UI stateful (si `useState`, considérer sync URL via `nuqs` ou similaire)
- Actions destructives → confirmation modal OU undo window — **jamais immédiat**

## 👆 Touch & Interaction

- `touch-action: manipulation` (évite le delay double-tap zoom)
- `-webkit-tap-highlight-color` set intentionnellement
- `overscroll-behavior: contain` dans modales/drawers/sheets
- Pendant drag : disable text selection, `inert` sur l'élément dragué
- `autoFocus` parcimonie — desktop only, single primary input, jamais mobile

## 📐 Safe Areas & Layout

- Full-bleed layouts → `env(safe-area-inset-*)` pour les notches
- Éviter scrollbars indésirables : `overflow-x-hidden` sur containers + fix overflow content
- Flex/grid > mesure JS pour le layout

## 🌓 Dark Mode & Theming

- `color-scheme: dark` sur `<html>` (fix scrollbars + inputs)
- `<meta name="theme-color">` matchant le bg de la page
- `<select>` natif → `background-color` + `color` explicites (Windows dark mode)

## 🌍 Locale & i18n

- Dates/times → `Intl.DateTimeFormat` (pas de format hardcodé)
- Numbers/currency → `Intl.NumberFormat` (pas hardcodé)
- Détecter la langue via `Accept-Language` / `navigator.languages` — **pas IP**
- Brand names / code tokens → `translate="no"` (évite l'auto-traduction qui les casse)

## 💧 Hydration Safety

- Inputs avec `value` → `onChange` (ou `defaultValue` pour uncontrolled)
- Date/time render → guard contre hydration mismatch (server vs client)
- `suppressHydrationWarning` uniquement où vraiment nécessaire

## 🖱️ Hover & Interactive States

- Boutons/links → `hover:` state (feedback visuel)
- Interactive states **augmentent le contraste** : hover/active/focus plus prononcés que le rest

## ✍️ Content & Copy

- **Voix active** : "Install the CLI" pas "The CLI will be installed"
- Title Case sur headings/boutons (Chicago style)
- Numérique pour les counts : "8 deployments" pas "eight"
- Labels boutons spécifiques : "Save API Key" pas "Continue"
- Messages d'erreur incluent fix/next step — pas juste le problème
- Seconde personne (you/your), pas première (I/we)
- `&` > "and" si contraint en espace

---

## 🚫 Anti-patterns à flagger immédiatement

| Pattern | Pourquoi |
|---|---|
| `user-scalable=no` / `maximum-scale=1` | Bloque le zoom = a11y fail |
| `onPaste` + `preventDefault` | Casse les password managers |
| `transition: all` | Animations layout-heavy non maîtrisées |
| `outline-none` sans replacement | Casse le focus visible |
| Inline `onClick` navigation sans `<a>` | Cmd-click cassé |
| `<div onClick>` / `<span onClick>` | Devrait être `<button>` |
| Images sans `width`/`height` | CLS garanti |
| `.map()` sur grande array sans virtualisation | Render explosif |
| Inputs sans label | A11y fail |
| Boutons icône sans `aria-label` | Screen readers cassés |
| Dates/numbers hardcodés | i18n cassée |
| `autoFocus` sans justification | UX intrusive |

---

## 📤 Format de sortie

```text
## src/components/Button.tsx

src/components/Button.tsx:42 — icon button missing aria-label
src/components/Button.tsx:18 — input lacks label
src/components/Button.tsx:55 — animation missing prefers-reduced-motion
src/components/Button.tsx:67 — transition: all → list properties

## src/components/Modal.tsx

src/components/Modal.tsx:12 — missing overscroll-behavior: contain
src/components/Modal.tsx:34 — "..." → "…"

## src/components/Card.tsx

✓ pass
```

**Règles d'output** :
- Grouper **par fichier**
- Format `file:line — description courte` (cliquable VS Code)
- **Sacrifier la grammaire** pour la concision
- Pas de preamble, pas d'explication sauf si le fix est non-évident
- Cocher `✓ pass` pour les fichiers conformes
