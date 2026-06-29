---
name: impeccable-animate
description: Guide d'animation UI orienté craft — ajouter du motion qui communique state, feedback, hiérarchie ; couper le motion décoratif. Cible "animation fatigue" + 100/300/500 rule + easing curves recommandées + matériaux de motion + a11y (`prefers-reduced-motion`). À déclencher quand on ajoute des animations, qu'on review du motion existant, ou qu'on définit une stratégie d'anim sur un composant/section.
source: https://github.com/pbakaus/impeccable (skill/reference/animate.md)
tags: animation, motion, ux, micro-interactions, performance, a11y
---

# Impeccable — Animate

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Guide de craft pour décider **quand**, **où** et **comment** animer.

> **Contexte additionnel requis** : performance constraints.

---

## 🧭 Philosophie

> Ajouter du motion qui communique **state, feedback, hierarchy**. Couper le motion qui existe **seulement pour décorer**.

> **Animation fatigue is a real cost** — dépenser le budget sur les moments qui le méritent.

---

## 🎚️ Register (positionnement)

### Brand
- Motion fait partie de la voix : **une seule entrée bien chorégraphiée > 50 micro-interactions éparpillées**
- ❌ Le default "AI saturated" = fade-and-rise reveals sur **chaque section scrollée** → **tell, pas chorégraphie**
- Le scroll-triggered motion est réservé aux moments qui le méritent

### Product
- **150–250 ms** sur la plupart des transitions
- Motion = state : feedback, reveal, loading, transitions
- **Pas de page-load choreography** — l'utilisateur est dans une tâche

---

## 🔍 Repérer les opportunités d'animation

### 1. Identifier les zones statiques

- **Missing feedback** — actions sans acknowledgment visuel (clic bouton, submit form…)
- **Jarring transitions** — changements instantanés qui paraissent abrupts (show/hide, page loads, route changes)
- **Unclear relationships** — relations spatiales/hiérarchiques non évidentes
- **Lack of delight** — interactions fonctionnelles mais joyeux
- **Missed guidance** — opportunités de diriger l'attention ou d'expliquer un comportement

### 2. Comprendre le contexte

| Question | Influence sur la décision |
|---|---|
| Quelle personnalité ? | Playful vs serious, energetic vs calm |
| Quel budget perf ? | Mobile-first ? Page complexe ? |
| Qui est l'audience ? | Motion-sensitive ? Power users qui veulent speed ? |
| Qu'est-ce qui compte ? | 1 hero animation OU plein de micro-interactions ? |

> ⚠️ **CRITIQUE** : Respecter `prefers-reduced-motion`. **Toujours** fournir des alternatives non-animées.

---

## 📋 Stratégie d'animation

Plan purposeful :

| Layer | Question |
|---|---|
| **Hero moment** | Quelle est **LA** signature animation ? (Page load ? Hero ? Interaction clé ?) |
| **Feedback layer** | Quelles interactions ont besoin d'acknowledgment ? |
| **Transition layer** | Quels state changes ont besoin d'être adoucis ? |
| **Delight layer** | Où peut-on surprendre ? |

> 💡 **Une expérience bien orchestrée > animations partout.**

---

## 🛠️ Catalogue d'animations par catégorie

### Entrance Animations
| Cible | Pattern |
|---|---|
| **Hero section** | Dramatic entrance (scale, parallax, ou effet créatif) |
| **Modal / drawer entry** | Smooth slide + fade, backdrop fade, focus management |
| **List rhythm** | Sibling stagger sur cards-in-a-grid ou list-items. Whole-section fade-on-scroll = **pas une liste, illégitime**. Cap stagger total : 10 items × 50ms = 500ms max. Plus d'items → réduire le delay ou capper |

**Stagger via CSS custom prop** (clean) :
```css
.item { animation-delay: calc(var(--i, 0) * 50ms); }
```
```html
<div style="--i: 0">…</div>
<div style="--i: 1">…</div>
```

### Micro-interactions
| Élément | Patterns |
|---|---|
| **Button hover** | Subtle scale (1.02-1.05), color shift, shadow increase |
| **Button click** | Quick scale 0.95 → 1, ripple effect |
| **Button loading** | Spinner ou pulse state |
| **Input focus** | Border color transition, slight scale ou glow |
| **Form validation** | Shake on error, check mark on success |
| **Toggle switches** | Smooth slide + color transition (200-300ms) |
| **Checkboxes / radio** | Check mark animation, ripple |
| **Like / favorite** | Scale + rotation, particle effects, color transition |

### State Transitions
- **Show / hide** — fade + slide (pas instant), 200-300ms
- **Expand / collapse** — height transition + overflow + icon rotation
- **Loading states** — skeleton fades, spinner, progress bars
- **Success / error** — color transitions, icon animations, gentle pulse
- **Enable / disable** — opacity transitions, cursor changes

### Navigation & Flow
- **Page transitions** — crossfade entre routes, shared element transitions
- **Tab switching** — slide indicator, content fade/slide
- **Carousel / slider** — smooth transforms, snap points, momentum
- **Scroll effects** — parallax layers, sticky headers, scroll progress

### Feedback & Guidance
- **Hover hints** — tooltip fade-ins, cursor changes, highlights
- **Drag & drop** — lift effect (shadow + scale), drop zone highlights
- **Copy / paste** — brief flash, "copied" confirmation
- **Focus flow** — highlight path through form

### Delight Moments
- **Empty states** — subtle floating animations sur illustrations
- **Completed actions** — confetti, check mark flourish
- **Easter eggs** — hidden interactions for discovery
- **Contextual** — weather, time-of-day, seasonal

---

## ⏱️ Timing — la règle 100/300/500

> **Le timing compte plus que l'easing** pour le "feels right".

| Durée | Cas d'usage | Exemples |
|---|---|---|
| **100–150ms** | Instant feedback | Button press, toggle, color change |
| **200–300ms** | State changes | Menu open, tooltip, hover state |
| **300–500ms** | Layout changes | Accordion, modal, drawer |
| **500–800ms** | Entrance animations | Page load, hero reveal |

> 💡 **Exit animations = ~75% de la durée d'entrée**.

---

## 🌀 Easing curves

```css
/* ✅ Recommandés — décélération naturelle */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* Smooth */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);   /* Snappier */
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);    /* Confident, decisive */

/* ❌ À ÉVITER — feel dated and tacky */
/* bounce:  cubic-bezier(0.34, 1.56, 0.64, 1); */
/* elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6); */
```

---

## 🎨 Motion Materials

Transform + opacity = défauts fiables mais **pas la palette complète**. Premium interfaces ont besoin de propriétés atmosphériques.

| Material | Pour quoi |
|---|---|
| **Transform / opacity** | Mouvement, press feedback, reveals simples, list choreography |
| **Blur / filter / backdrop-filter** | Focus pulls, depth, glass/lens, softened entrances |
| **Clip-path / masks** | Wipes, reveals, editorial cropping, product-like transitions |
| **Shadow / glow / color filters** | Energy, affordance, focus, warmth, active state |
| **Grid-template-rows / FLIP** | Expanding & reflowing layout sans animer `height` directement |

> 💡 **La règle dure** n'est PAS "transform et opacity seulement". C'est :
> - **Éviter** d'animer les propriétés layout-driving casuallement (`width`, `height`, `top`, `left`, margins)
> - **Borner** les effets coûteux à des zones petites/isolées
> - **Vérifier** la fluidité in-browser sur les viewports cibles

---

## 🛠️ Tech d'implémentation

### CSS Animations
```
Préférer pour simples / déclaratives
- transitions for state changes
- @keyframes for complex sequences
- transform / opacity for reliable movement
- blur, filters, masks, clip-paths, shadows, color shifts → atmosphere quand verified smooth
```

### JavaScript Animation
```
Pour complexes / interactives
- Web Animations API (programmatic)
- Framer Motion (React)
- GSAP (complex sequences)
```

---

## ⚡ Performance

- **Layout safety** — éviter d'animer `width`/`height`/`top`/`left`/margins casuallement
- **`will-change`** — sparingly pour anim expensive connues (sur `:hover` ou `.animating`), **jamais préemptivement** sur toute la page
- **Scroll triggers** — IntersectionObserver, pas scroll event listeners. Unobserve après l'anim
- **Bound expensive effects** — blur/filter/shadow zones petites ou isolées, `contain` où approprié
- **Monitor FPS** — 60fps sur devices cibles

---

## 🧠 Perceived Performance

> **Personne ne se soucie de la vitesse réelle, juste de la vitesse perçue.**

Seuil **80ms** : sous ~80ms ça paraît instantané (les cerveaux buffer les inputs sensoriels pendant ce temps pour synchroniser la perception). Target ce threshold pour les micro-interactions.

| Technique | Quand |
|---|---|
| **Preemptive start** | Démarrer la transition pendant le loading (iOS app zoom, skeleton UI) |
| **Early completion** | Show content progressivement, ne pas attendre tout (progressive images, streaming HTML) |
| **Optimistic UI** | Update interface immediately. Pour actions low-stakes (likes, follows). Éviter pour paiements / opérations destructives |
| **Easing affects perceived duration** | `ease-in` fait paraître plus court (peak-end effect). `ease-out` satisfying pour entrances |

> ⚠️ **Caution** : trop rapide peut réduire la perception de valeur sur opérations complexes (search, analysis). Parfois un brief delay signale "real work is happening".

---

## ♿ Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🚫 NEVER

- ❌ **Bounce / elastic** easing — feel dated, attire attention sur l'animation elle-même
- ❌ Animer **layout properties** casuallement (`width`, `height`, `top`, `left`, margins) quand transform/FLIP/grid marche
- ❌ Durées > 500ms pour du **feedback** (feel laggy)
- ❌ Animer **sans purpose** (chaque anim a besoin d'une raison)
- ❌ Ignorer `prefers-reduced-motion` (a11y violation)
- ❌ **Tout animer** (animation fatigue = interfaces exhausting)
- ❌ Bloquer l'interaction pendant les animations (sauf intentionnel)

---

## ✅ Vérification qualité

- **60 fps smooth** — no jank on target devices
- **Feels natural** — easing curves organic, pas robotic
- **Appropriate timing** — pas trop rapide (jarring), pas trop lent (laggy)
- **Reduced motion works** — animations disabled/simplified
- **Doesn't block** — interaction possible pendant/après
- **Adds value** — interface plus claire OU plus delightful

---

## 🔗 Hand-off

Quand le motion **clarifie le state** au lieu de le décorer → hand off à `impeccable polish` pour le pass final.
