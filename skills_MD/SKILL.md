---
name: design
description: >
  Skill UI/UX production-grade. Déclencher sur tout mot lié à une interface :
  "composant", "page", "landing", "section", "UI", "interface", "layout",
  "formulaire", "navbar", "card", "design", "/design".
  Lire ce fichier EN PREMIER, puis UI-UX.md et COMPONENTS.md avant d'écrire une seule ligne de code.
  Ne jamais utiliser de couleurs hardcodées — toujours utiliser les tokens du projet.
  Ne jamais réinventer un composant qui existe déjà.
  Ne jamais ajouter de badge "AI / Built with Claude" sur les pages publiques.
---

# SKILL.md — Design System (template réutilisable)

## 🔧 Configuration projet (à remplir une fois)

| Placeholder | Description | Exemple |
|---|---|---|
| `{PROJECT_NAME}` | Nom du projet | Mon App |
| `{COMPONENTS_PATH}` | Dossier primitives UI | `src/components/ui/` |
| `{DOMAIN_COMPONENTS_PATH}` | Dossier composants métier | `src/components/{hero,sections,layout}/` |
| `{TOKENS_FILE}` | Fichier de tokens | `src/index.css` |
| `{COLOR_TOKEN_FORMAT}` | Format token couleur | `hsl(var(--*))` |
| `{FONT_DISPLAY}` | Police d'affichage | Clash Display / Inter Display |
| `{FONT_BODY}` | Police de corps | DM Sans / Inter |
| `{STACK}` | Stack principal | React + Vite + Tailwind |

---

## Instruction de démarrage obligatoire

Avant tout code d'interface, dans cet ordre strict :

1. Lire `UI-UX.md` (règles de craft, patterns, anti-patterns)
2. Lire `COMPONENTS.md` (catalogue des composants premium externes)
3. Inspecter `{COMPONENTS_PATH}` et `{DOMAIN_COMPONENTS_PATH}` (composants déjà créés)
4. Identifier les tokens du projet dans `{TOKENS_FILE}`
5. Seulement après : écrire le code

## Raccourci `/design`

Quand l'utilisateur tape `/design [description]` :
- Appliquer automatiquement toutes les règles de `UI-UX.md`
- Lister d'abord les composants existants (`{COMPONENTS_PATH}` + `COMPONENTS.md`) qui correspondent
- Produire du code prêt à l'emploi, pas du pseudo-code
- Passer la checklist de `UI-UX.md` avant de livrer

## Règle absolue sur les couleurs

**Ne jamais hardcoder une couleur.**
Toujours utiliser les variables définies dans `{TOKENS_FILE}` ou les utilitaires Tailwind dérivés (`bg-primary`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-accent`, etc.).

```css
/* ✅ Correct */
color: {COLOR_TOKEN_FORMAT};       /* ex: hsl(var(--foreground)) */
background: {COLOR_TOKEN_FORMAT};  /* ex: hsl(var(--background)) */

/* ✅ Correct (Tailwind) */
class="bg-background text-foreground border-border"

/* ❌ Interdit */
color: #0F172A;
background: #FFFFFF;
```

## Règle absolue sur les composants

**Ne jamais créer un composant qui existe déjà.**

Workflow obligatoire :
1. Vérifier `{COMPONENTS_PATH}` → primitives shadcn (button, card, dialog, dropdown-menu, form, input, sheet, sidebar, tabs, toast…)
2. Vérifier `{DOMAIN_COMPONENTS_PATH}` → composants métier déjà créés
3. Vérifier `COMPONENTS.md` → composants premium externes (Aceternity / Magic UI)
4. Si le composant existe → l'utiliser ou l'adapter
5. Si non → créer en respectant les patterns de `UI-UX.md` et les tokens

## Règle absolue : pas de marquage IA

Aucun badge, watermark, footer, copy ou tooltip mentionnant l'IA (Claude, GPT, "AI", "powered by…") ne doit apparaître sur les pages publiques. Voir `UI-UX.md` §10.

## Stack de référence (à compléter par projet)

```
{STACK}
```

## Polices

```
Display (titres) : {FONT_DISPLAY}   → font-display
Body             : {FONT_BODY}      → font-sans
```
