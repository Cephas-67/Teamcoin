# UI-UX.md — Règles de Design Production-Grade (template réutilisable)

> Lire avant tout code d'interface. Ce fichier définit le **comment** construire,
> pas les couleurs. Les couleurs viennent du projet (`CLAUDE.md` / `{TOKENS_FILE}`).

---

## 🔧 Configuration projet (à remplir une fois)

| Placeholder | Description | Exemple |
|---|---|---|
| `{TOKENS_FILE}` | Fichier de tokens CSS | `src/index.css` |
| `{COMPONENTS_PATH}` | Dossier primitives UI | `src/components/ui/` |
| `{DOMAIN_COMPONENTS_PATH}` | Dossier composants métier | `src/components/{hero,sections,layout}/` |
| `{FONT_DISPLAY}` | Police titres | Clash Display |
| `{FONT_BODY}` | Police corps | DM Sans |
| `{OWNER}` | Propriétaire du produit | Nom Prénom |

---

## 0. Le Problème à Éviter — "AI Design Slop"

Les LLMs produisent par défaut des interfaces reconnaissables entre mille.
Ce pattern doit être **activement évité** :

- Gros titre centré avec texte en dégradé
- Sous-titre gris, puis 3 cartes identiques avec icône + titre + texte
- Sections alternées fond clair / fond sombre toutes les 2 sections
- Bouton CTA `rounded-full` avec `hover:scale-105`
- Footer 4 colonnes de liens
- Glassmorphism `backdrop-blur` partout
- Particules animées en background
- Progress bars décoratifs sans sens fonctionnel
- **Badges "AI / Powered by AI / Made with Claude" sur les pages publiques** — interdits

**Ce n'est pas du design. C'est un template recyclé.**

---

## 1. Références — Ce Qu'on Reproduit

### Anthropic (anthropic.com, claude.ai)
- Beaucoup d'espace blanc, éléments qui respirent
- Typographie éditoriale — serif massif pour les grands titres
- Une seule couleur vive, utilisée avec parcimonie
- Contenu posé directement sur la page, pas des cartes partout
- Interactions subtiles (150–200ms)

### Linear (linear.app)
- Layout asymétrique — texte à gauche, visuels décalés à droite
- Sans-serif resserrée — `letter-spacing` tight sur les headings
- Lignes fines comme séparateurs, pas de cartes lourdes
- Motion précise — reveals au scroll avec stagger

### Vercel (vercel.com)
- Grille stricte — tout s'aligne
- Contraste fort — sections sombres/claires alternées avec intention
- Typographie large pour headings, précise pour le corps

### Stripe (stripe.com)
- Une seule zone visuellement riche par page
- Couleur primaire réservée aux éléments interactifs

### Notion (notion.so)
- Sidebar + main — layout fonctionnel
- Densité dans les listes, espace dans les headers
- Focus lisibilité longue durée

---

## 2. Typographie — Règles Précises

```
Display (hero)   : font-display, clamp(2.5rem, 6vw, 5rem), weight 700
H1 (page title)  : font-display ou font-body bold, 2rem–2.5rem, weight 600–700
H2 (section)     : font-body, 1.25rem–1.5rem, weight 600
H3 (card title)  : font-body, 1rem–1.125rem, weight 600
Body             : font-body, 1rem, weight 400
Small / meta     : font-body, 0.75rem–0.875rem, weight 400–500
```

### Règles obligatoires
- `line-height` des titres : **1.05 à 1.2** — jamais 1.5 sur un H1
- `letter-spacing` des grands titres : **-0.02em à -0.04em**
- Titres display via `font-display` ({FONT_DISPLAY})
- Corps via `font-sans` ({FONT_BODY})

### Interdit
- ❌ Texte en dégradé (`background-clip: text`) — cliché épuisé
- ❌ `text-transform: uppercase` sur les titres principaux
- ❌ `font-weight: 700` sur tout
- ❌ Emoji dans les titres de section

---

## 3. Layout — Principes de Composition

### Respiration
- Sections : `padding-block` ≥ **4rem** (6–8rem sur desktop)
- Contenu max-width : `1152px`–`1280px` avec `margin: auto`
- Padding de page : `1.5rem` mobile, `2–3rem` desktop

### Asymétrie intentionnelle
- Éviter les layouts 100% symétriques
- Hero : texte ~60% de largeur, le reste respire
- Ne pas centrer tous les blocs — alterner alignement avec intention

### Grille
- 12 colonnes explicites
- `gap` cohérents : `1rem`, `1.5rem`, `2rem`
- Jamais de `width: 33.33%` hors grille déclarée

### Patterns par type de page
```
Landing     : hero pleine hauteur, sections larges, rythme vertical fort
Feed/Liste  : sidebar 240–280px + grille 2–4 cols
Dashboard   : sidebar + main, métriques en haut, contenu dense en bas
Lecture     : colonne centrale max 680px
Auth        : centré, une seule colonne, max 400px, pas d'ornement
```

---

## 4. Composants — Règles de Construction

### Boutons
```
Primaire   : background couleur forte, texte contrasté, padding 10px 20px, radius 6px
Secondaire : transparent, border 1px, texte couleur secondaire
Ghost      : sans bg ni border, texte avec underline offset au hover
Destructif : couleur d'alerte, même structure que primaire
Taille     : sm (8px 14px), md (10px 20px), lg (12px 28px)
```
**Interdit** : `rounded-full` sur les CTAs principaux · `hover:scale-105` · `shadow` colorée · icônes animées au hover

### Cartes
```
Structure  : surface (≠ bg), border 1px, radius 8px
Padding    : 1rem–1.5rem
Hover      : changer border-color uniquement
Shadow     : max 0 2px 8px rgba(0,0,0,0.08) — jamais colorée
```
**Interdit** : `hover:scale-105` · `backdrop-blur` comme fond de carte · radius > 16px · gradient en background

### Inputs / Formulaires
```
Label      : au-dessus du champ, toujours visible
Border     : 1px solid hsl(var(--border))
Focus      : border-color + outline 2px offset 2px (couleur accent)
Padding    : 10px 14px
Radius     : 4px–6px
Error      : border rouge + message texte en dessous
```

### Navigation
```
Hauteur    : 56px max
Position   : sticky top-0
Logo       : typographique de préférence
Links      : 0.875rem, couleur secondaire, hover couleur principale
Mobile     : hamburger après 768px, menu slide ou drawer
```

### Badges / Tags
```
Padding    : 2px 10px
Radius     : 9999px (seul endroit où c'est approprié)
Taille     : 0.75rem, weight 500
```
**Interdit** : badges "AI / Built with Claude / GPT-powered" sur les pages publiques.

---

## 5. Interactions et Animations

### Principe de retenue
Une bonne animation est celle qu'on ne remarque pas consciemment.
Elle guide l'attention, elle ne la détourne pas.

### Durées recommandées
```
Micro-interactions (hover, focus) : 100–150ms
Transitions d'état (show/hide)    : 150–250ms
Reveals au scroll                 : 300–500ms
Transitions de page               : 200–300ms
```

### Permis
- Reveal au scroll discret (`opacity` + `translateY(12px)` → 0)
- Stagger 50ms sur les listes
- Hover discret (`border-color` 150ms)

### Interdit
- ❌ `animation-duration > 1s` sur du UI
- ❌ `animate-bounce` sur du décoratif
- ❌ Parallax sur background de section
- ❌ Rotation infinie décorative
- ❌ Particules / confettis en background
- ❌ `transition: all` — cibler les propriétés précises

---

## 6. Spacing — Système Cohérent

Échelle de 4px. Pas de valeurs arbitraires.

```
4px  → gap inline (icône + texte)
8px  → padding interne petit
12px → padding input
16px → padding card, gap standard
24px → padding section interne
32px → margin entre composants
48px → padding section petite
64px → padding section standard
96px → padding section grande (desktop)
```

**Règle** : jamais `margin: 7px` ou `padding: 13px`.

---

## 7. Mobile-First — Impératif

```
375px  : 1 colonne, texte 16px min, touch 44px min
768px  : 2 colonnes possibles, sidebar peut apparaître
1024px : layout complet, sidebar fixe
1280px : max-width atteint
```

- Touch target ≥ `44px × 44px`
- Pas de `hover` comme seule affordance
- `font-size: 16px` min sur inputs (évite zoom iOS)
- Pas de contenu important coupé par `overflow: hidden`

---

## 8. Accessibilité — Non-Négociable

```
Contraste texte/fond : ≥ 4.5:1 (WCAG AA)
Focus visible        : outline sur TOUS les interactifs
Alt text             : sur toutes les images signifiantes
ARIA labels          : sur icônes seules / boutons sans texte
Sémantique HTML      : <nav>, <main>, <article>, <section>
```

---

## 9. Composants UI Personnels — Règle de Priorité

**Avant de créer un composant :**
1. Vérifier `{COMPONENTS_PATH}` (primitives shadcn)
2. Vérifier `{DOMAIN_COMPONENTS_PATH}` (composants métier)
3. Vérifier `COMPONENTS.md` (catalogue premium externe)
4. Si existe → utiliser/adapter minimalement
5. Si non → créer en respectant ce fichier + tokens

---

## 10. Pas de Marquage IA sur les Pages

**Règle absolue** :
- ❌ Aucun badge / footer / tooltip mentionnant l'IA (Claude, GPT, "AI"…) sur les pages publiques
- ❌ Aucune trace de plateforme de génération (Lovable, v0, Bolt…) dans markup, meta, assets
- ✅ Le produit se présente comme un produit fini, signé `{OWNER}`

---

## 11. Checklist Avant Livraison

**Typographie**
- [ ] Grands titres en `font-display` ?
- [ ] `line-height` ≤ 1.2 sur les titres ?
- [ ] `letter-spacing` négatif sur display ?
- [ ] Aucun texte en dégradé ?

**Layout**
- [ ] `padding-block` ≥ 4rem sur les sections ?
- [ ] Pas de 3 cartes identiques icône+titre+texte ?
- [ ] Max-width + `margin: auto` ?
- [ ] Testé mentalement en 375px ?

**Composants**
- [ ] Boutons radius 6px (pas rounded-full sur CTAs) ?
- [ ] Pas de `hover:scale` ?
- [ ] Shadows subtiles ?
- [ ] Pas de glassmorphism décoratif ?
- [ ] Aucune couleur hardcodée ?

**Réutilisation**
- [ ] `{COMPONENTS_PATH}` vérifié ?
- [ ] `{DOMAIN_COMPONENTS_PATH}` consulté ?
- [ ] `COMPONENTS.md` consulté ?

**Accessibilité**
- [ ] Touch targets ≥ 44px ?
- [ ] Focus visible partout ?
- [ ] HTML sémantique ?

**Marquage IA / outils tiers**
- [ ] Aucun badge IA visible ?
- [ ] Aucune trace de plateforme de génération ?

---

*UI-UX.md — Règles de craft agnostiques des couleurs.*
*Les couleurs viennent du projet (`CLAUDE.md` / `{TOKENS_FILE}`).*
