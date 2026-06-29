# COMPONENTS.md — Catalogue UI (template réutilisable)

> Bibliothèque de référence · composants premium externes
> Sources couramment intégrées : [Aceternity UI](https://ui.aceternity.com) · [Magic UI](https://magicui.design) · [shadcn-ui](https://ui.shadcn.com)

---

## 🔧 Configuration projet (à remplir une fois)

| Placeholder | Description | Exemple |
|---|---|---|
| `{PROJECT_NAME}` | Nom du projet | Mon App |
| `{OWNER}` | Propriétaire | Nom Prénom |
| `{COMPONENTS_PATH}` | Dossier composants UI | `src/components/ui/` |
| `{DOMAIN_COMPONENTS_PATH}` | Dossier composants métier | `src/components/{hero,sections,...}/` |
| `{TOKENS_FILE}` | Fichier de tokens CSS | `src/index.css` |
| `{UTILS_FILE}` | Fichier helper `cn` | `src/lib/utils.ts` |
| `{COLOR_SYSTEM}` | Système de couleurs | HSL CSS variables / OKLCH / Tailwind extends |

---

## Règle d'utilisation absolue

**Avant de créer n'importe quel composant UI, suivre cet ordre :**

1. **Inspecter `{COMPONENTS_PATH}`** (primitives déjà installées)
2. **Inspecter `{DOMAIN_COMPONENTS_PATH}`** (composants métier déjà créés)
3. **Chercher dans ce catalogue** ↓ — si un composant premium externe convient, l'intégrer
4. **Si rien ne convient** → créer en respectant `UI-UX.md` et les tokens du projet

> Ce fichier est un **catalogue de référence**. Les composants ne sont pas tous installés
> dans le repo — il faut les copier depuis leur source, dans `{COMPONENTS_PATH}<catégorie>/<composant>.tsx`,
> en adaptant aux tokens du projet.

---

## Cible d'installation suggérée

```
{COMPONENTS_PATH}
├── (primitives shadcn — button, card, dialog, form, …)
└── (sous-dossiers à créer au besoin)
    ├── cards/
    ├── backgrounds/
    ├── 3d/
    ├── text-effects/
    ├── navigation/
    ├── heroes/
    ├── modals/
    └── misc/
```

---

## Dépendances types

```
✅ Couramment requises
- framer-motion (animations)
- tailwind-merge, clsx (cn helper)
- lucide-react (icônes)

➕ À ajouter UNIQUEMENT si on intègre les composants concernés
- three, @react-three/fiber, @react-three/drei  (composants 3D)
- @tabler/icons-react                            (certains Aceternity)
- @tsparticles/react                             (sparkles, vortex)
- three-globe + data_glob.json                   (3d-globe)
```

Utilitaire `cn` requis dans `{UTILS_FILE}` :
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Règle d'adaptation aux tokens du projet

Quand on intègre un composant Aceternity/Magic UI, **toujours remplacer les couleurs hardcodées** par les tokens du projet :

```diff
- className="bg-black text-white border-neutral-700"
+ className="bg-background text-foreground border-border"

- style={{ background: "#0F172A" }}
+ style={{ background: "hsl(var(--background))" }}
```

---

## 1. `ui/cards/` — Cartes & hover effects

| Fichier | Description | Notes |
|---|---|---|
| `bento-grid.tsx` | Grille bento style Apple | Layout asymétrique |
| `card-hover-effect.tsx` | Cartes avec highlight au survol | Effet fond lumineux |
| `card-spotlight.tsx` | Carte avec spotlight canvas | Requiert `canvas-reveal-effect` |
| `card-stack.tsx` | Stack de cartes animées | Pile + flip auto |
| `comet-card.tsx` | Carte avec bordure comète animée | — |
| `direction-aware-hover.tsx` | Hover avec direction aware | Détecte direction du curseur |
| `evervault-card.tsx` | Carte avec effet matrice/chiffres | Caractères aléatoires au hover |
| `glare-card.tsx` | Carte avec effet glare 3D | Tilt 3D + reflet |
| `glowing-effect.tsx` | Wrapper avec bordure lumineuse | Universel |
| `layout-grid.tsx` | Grille masonry animée | Click pour expand |

## 2. `ui/backgrounds/` — Fonds animés

| Fichier | Description | Notes |
|---|---|---|
| `aurora-background.tsx` | Fond aurora boréale animé | Wrapper de section |
| `background-beams.tsx` | Faisceaux de lumière | Fond sombre recommandé |
| `background-boxes.tsx` | Grille de cubes colorés | — |
| `background-gradient-animation.tsx` | Gradient animé en boucle | CSS pur, léger |
| `canvas-reveal-effect.tsx` | Effet de révélation canvas | Requis par `card-spotlight` |
| `google-gemini-effect.tsx` | Effet lignes style Gemini | Piloté par scroll |
| `meteors.tsx` | Pluie de météores | Fond sombre uniquement |
| `sparkles.tsx` | Particules scintillantes | Requiert tsparticles |
| `vortex.tsx` | Fond vortex | Canvas animé |
| `wavy-background.tsx` | Fond vagues animées | SVG animé |

## 3. `ui/3d/` — Composants 3D / WebGL

| Fichier | Description | Notes |
|---|---|---|
| `3d-globe.tsx` | Globe 3D interactif | Requiert `data_glob.json` + `three-globe` |
| `3d-marquee.tsx` | Défilé 3D en perspective | Grille d'images |
| `3d-pin.tsx` | Pin 3D flottant au hover | Container effet depth |
| `macbook-scroll.tsx` | Scroll reveal style MacBook | Scroll-driven |
| `pixelated-canvas.tsx` | Canvas pixelisé | Effet pixel dissolve |

## 4. `ui/text-effects/` — Effets texte

| Fichier | Description |
|---|---|
| `colourful-text.tsx` | Texte multicolore animé |
| `flip-words.tsx` | Mots en rotation |
| `glowing-stars.tsx` | Étoiles canvas autour du texte |
| `hero-highlight.tsx` | Surlignage animé |
| `pointer-highlight.tsx` | Highlight qui suit le pointeur |
| `text-generate-effect.tsx` | Génération mot par mot |
| `text-reveal-card.tsx` | Texte révélé au hover |
| `typewriter-effect.tsx` | Machine à écrire + curseur |

## 5. `ui/navigation/` — Navigation

| Fichier | Description |
|---|---|
| `floating-navbar.tsx` | Navbar flottante au scroll |
| `navbar-menu.tsx` | Menu avec sous-menus animés |
| `resizable-navbar.tsx` | Navbar qui se réduit au scroll |
| `sidebar.tsx` | Sidebar rétractable |
| `sticky-banner.tsx` | Bannière sticky |
| `tabs.tsx` | Tabs avec underline animé |

## 6. `ui/heroes/` — Sections hero

| Fichier | Description |
|---|---|
| `container-scroll-animation.tsx` | Device mock révélé au scroll |
| `hero-parallax.tsx` | Grille d'images parallax |
| `images-slider.tsx` | Slider d'images |
| `lamp.tsx` | Hero avec lampe lumineuse |
| `spotlight.tsx` | Spotlight suivant le curseur |
| `svg-mask-effect.tsx` | Masque SVG révélé au hover |

## 7. `ui/misc/` — Divers

| Fichier | Description |
|---|---|
| `animated-tooltip.tsx` | Tooltip avec avatar |
| `following-pointer.tsx` | Curseur custom |
| `hover-border-gradient.tsx` | Bordure gradient au hover |
| `infinite-moving-cards.tsx` | Carrousel infini (testimonials) |
| `moving-border.tsx` | Bordure animée |
| `stateful-button.tsx` | Bouton avec états idle/loading/success/error |
| `sticky-scroll-reveal.tsx` | Contenu révélé au scroll (Notion) |
| `terminal.tsx` | Terminal animé |
| `timeline.tsx` | Timeline verticale |
| `tracing-beam.tsx` | Faisceau qui trace le scroll |
| `world-map.tsx` | Carte du monde SVG + arcs |

---

## Combinaisons recommandées (à adapter au domaine)

```
Hero premium sobre   : spotlight + flip-words + (background-beams discret)
Section "À propos"   : tracing-beam + sticky-scroll-reveal
Compétences          : bento-grid + glowing-effect
Portfolio            : hero-parallax OU 3d-pin + card-hover-effect
Témoignages          : infinite-moving-cards + animated-tooltip
Contact              : moving-border + stateful-button
```

> ⚠️ **Modération** : un seul effet "wow" par section. Voir `UI-UX.md` §0 (anti AI slop)
> et §5 (retenue dans les animations).

---

*Catalogue chargé par `SKILL.md` à chaque session design.*
