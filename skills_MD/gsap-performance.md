---
name: gsap-performance
description: Skill officiel GSAP — optimiser les animations pour du 60 fps stable (transforms vs layout, will-change, batching, quickTo, ScrollTrigger). À déclencher quand l'utilisateur parle de jank, perf d'anim, FPS, smooth scroll.
source: https://github.com/greensock/gsap-skills (skills/gsap-performance/SKILL.md)
license: MIT
---

# GSAP Performance — Skill réutilisable

> ✅ **Ce fichier est neutre** — aucune configuration projet requise. Utilisable tel quel dans tout projet qui intègre GSAP.

---

## 🎯 Quand l'activer

- Optimiser des animations GSAP pour un 60 fps stable
- Réduire le coût layout / paint
- L'utilisateur parle de **jank**, **FPS**, **smooth**, **best practices** d'animation
- Animation lourde sur mobile bas de gamme

**Skills liés** :
- `gsap-core` (transforms, autoAlpha)
- `gsap-timeline`
- `gsap-scrolltrigger` (perf ScrollTrigger spécifique)

---

## 1. Préférer `transform` et `opacity`

Animer **transform** (`x`, `y`, `scaleX`, `scaleY`, `rotation`, `rotationX/Y`, `skewX/Y`) et **opacity** garde le travail sur le **compositor** → pas de layout, pas (ou peu) de paint.

| ✅ Préférer | ❌ Éviter quand un transform équivaut |
|---|---|
| `x`, `y` | `top`, `left` |
| `scale` | `width`, `height` |
| `rotation` | `margin`, `padding` |
| `opacity` | — |

> GSAP utilise `translate` par défaut pour `x`/`y` → toujours les utiliser **au lieu de** `top`/`left` pour bouger un élément.

---

## 2. `will-change` — avec parcimonie

Hint CSS pour promouvoir l'élément sur sa propre couche :

```css
.element-anime { will-change: transform; }
```

**Règles** :
- ✅ Uniquement sur les éléments **réellement animés**
- ❌ Pas "au cas où" sur tout le DOM — coûteux en mémoire GPU
- ❌ Ne **pas** abuser de `force3D: true`

---

## 3. Batch reads / writes

GSAP batche déjà ses updates en interne. Quand on **mélange** GSAP avec du DOM direct :

- Faire **tous les reads d'abord**, puis **tous les writes**
- Ne jamais alterner read → write → read → write (= layout thrashing)
- Laisser GSAP grouper les writes dans son tick

---

## 4. Beaucoup d'éléments (listes, stagger)

```js
// ✅ Une seule instruction
gsap.from(".item", { y: 20, opacity: 0, stagger: 0.05 });

// ❌ Surcoût + difficile à orchestrer
items.forEach((el, i) => gsap.from(el, { y: 20, opacity: 0, delay: i * 0.05 }));
```

- Utiliser **`stagger`** plutôt que N tweens manuels
- Pour des listes longues : **virtualiser** ou n'animer que les éléments visibles
- **Réutiliser les timelines** — ne pas en créer à chaque frame

---

## 5. Propriétés mises à jour fréquemment → `quickTo()`

Pour curseur custom, parallax mousemove, valeurs pilotées par input continu :

```js
const xTo = gsap.quickTo("#cursor", "x", { duration: 0.4, ease: "power3" });
const yTo = gsap.quickTo("#cursor", "y", { duration: 0.4, ease: "power3" });

window.addEventListener("mousemove", (e) => {
  xTo(e.clientX);
  yTo(e.clientY);
});
```

`quickTo()` **réutilise un seul tween** au lieu d'en créer un par event → énorme gain.

---

## 6. ScrollTrigger — perf spécifique

| Pratique | Détail |
|---|---|
| `pin: true` | Promeut l'élément. **Pinner uniquement ce qui le nécessite.** |
| `scrub: 1` (valeur petite) | Réduit le travail pendant le scroll. **Tester sur low-end.** |
| `ScrollTrigger.refresh()` | Appeler **uniquement quand le layout change** (ex: contenu lazy chargé). **Debouncer**, jamais sur chaque `resize`. |

---

## 7. Réduire le travail simultané

- **Pause/kill** les animations off-screen ou inactives quand la section sort du viewport
- Éviter d'animer des dizaines de propriétés sur des centaines d'éléments en parallèle
- **Cleanup obligatoire** dans `useEffect` (React) :
  ```js
  useEffect(() => {
    const ctx = gsap.context(() => { /* tweens */ }, containerRef);
    return () => ctx.revert(); // kill tweens + ScrollTriggers
  }, []);
  ```

---

## ✅ Best practices (résumé)

- ✅ Animer **transform** + **opacity** uniquement quand possible
- ✅ `will-change: transform` **seulement** sur les éléments animés
- ✅ `stagger` au lieu de N tweens avec `delay` manuel
- ✅ `gsap.quickTo()` pour les propriétés rafraîchies souvent (mousemove, scroll)
- ✅ Cleanup systématique : `ctx.revert()` / `tween.kill()` / `ScrollTrigger.refresh()` debouncé

## ❌ À ne pas faire

- ❌ Animer `width` / `height` / `top` / `left` quand `x` / `y` / `scale` suffisent
- ❌ `will-change` ou `force3D` "au cas où" sur tout
- ❌ Créer des centaines de tweens / ScrollTriggers sans tester sur low-end
- ❌ Oublier le cleanup → tweens fantômes qui tournent même après démontage

---

## 🔗 Intégration React (rappel)

```tsx
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function MyComponent() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".item", {
        y: 30,
        opacity: 0,
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });
    }, root);

    return () => ctx.revert(); // kill tout proprement
  }, []);

  return <div ref={root}>{/* … */}</div>;
}
```

> `useLayoutEffect` > `useEffect` pour GSAP : la mesure DOM se fait avant le paint, pas de flash.
