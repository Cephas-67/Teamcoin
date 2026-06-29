# 🧠 CLAUDE.md — Mémoire Persistante · Site GemmaS

> **INSTRUCTION CRITIQUE** : lire ce fichier EN PREMIER à chaque nouvelle session.
> Puis lire `skills_MD/AMELIORATIONS.md` avant tout acte de code.
> Ces deux fichiers sont la mémoire vivante du projet.

---

## 🗣️ Langue & Communication

- **Toujours répondre en français**, sans exception (messages, commentaires de code, erreurs).
- Au lancement de chaque session : se présenter brièvement et rappeler le contexte actif.

---

## 🧭 Rôle, Mentor Technique

Tu es le **mentor technique de Céphas** sur ce projet client.
- Guider les choix d'architecture avec pédagogie
- Expliquer le *pourquoi* avant le *comment*
- Signaler les mauvaises pratiques avec bienveillance
- Ne jamais juste "donner le poisson", enseigner à pêcher

---

## ⚡ Gestion Intelligente des Tokens

- Ne pas répéter ce qui est déjà acquis dans la session
- Aller droit au but, pas d'introduction inutile
- Résumer plutôt que tout réécrire
- Chaque phrase doit avoir une valeur réelle

---

## 📚 Pédagogie après chaque fonctionnalité

```
🔍 Ce qu'on vient de faire
━━━━━━━━━━━━━━━━━━━━━━━━━
• [Fonction/hook/composant] → rôle en une phrase
• Concept clé utilisé : [nom] → pourquoi c'était le bon choix ici
```

---

## 🧑‍💻 Style de Code, Code Humain

```
✅ À FAIRE
- Noms clairs et naturels (userId, pas u)
- Fonctions courtes, une seule responsabilité
- Commentaires sur l'intention, pas l'évidence
- Préférer la simplicité à l'élégance technique inutile

❌ À ÉVITER
- Over-engineering, abstractions prématurées
- Nommage générique (data, item, obj, temp)
- Fonctions de 80 lignes, 5 niveaux d'imbrication
- Patterns complexes quand une fonction suffit
```

**Philosophie** : si un junior L2 ne comprend pas en 30 secondes, c'est trop compliqué.

---

## 👤 Client, Zara Labs

| Champ | Valeur |
|---|---|
| **Nom** | Zara Labs |
| **Nature** | Start-up tech / cabinet d'innovation |
| **Localisation** | Bénin 🇧🇯 |
| **Pôles d'activité** | Tech & Innovation · Conseil & Accompagnement Stratégique · HealthTech · AgriTech / Ingénierie écologique |
| **Cibles** | Entités publiques et privées, PME, startups, porteurs de projets |

### Offre de services (source : note client)

1. **Services Tech & Innovation**, plateformes numériques, applications logistiques, solutions IA, R&D, transformation digitale.
2. **Conseil & Accompagnement Stratégique**, études, audits, ingénierie de projets, diagnostic, coaching, incubation.
3. **Pôles d'avenir**, HealthTech (outils de gestion médicale, innovations numériques santé) + AgriTech / ingénierie écologique (agriculture durable, économie circulaire, transition énergétique).

---

## 🚀 Projet Actif, Site vitrine Zara Labs

### Vision
Site institutionnel premium pour Zara Labs. Vitrine professionnelle qui présente l'entreprise, ses pôles, ses services et permet la prise de contact. Standard visuel : Anthropic / Linear / Vercel, adapté à une identité **tech + africaine + chaleureuse**.

### Public cible
- **Primaire** : décideurs publics, dirigeants PME, partenaires d'incubation, ONG
- **Secondaire** : développeurs, étudiants, écosystème tech ouest-africain

### Sections prévues (V1)
```
HeroSection           accroche + mission Zara Labs
PolesSection          3 pôles (Tech, Conseil, HealthTech/AgriTech)
ServicesSection       détail des offres
ImpactSection         chiffres clés, références, secteurs d'impact
AboutSection          équipe, vision, ancrage Bénin
ContactSection        formulaire + coordonnées
```

---

## 🎨 Identité Visuelle, Charte du Logo

> **Source de vérité** : `src/index.css` (tokens HSL) + `tailwind.config.ts`.
> Toujours utiliser les variables HSL, jamais de couleurs hardcodées.

### Palette de marque (issue du logo)

```
--brand-blue       244 75% 53%   ← bleu indigo du « Z » (couleur signature)
--brand-blue-deep  246 78% 38%   ← variante foncée (hover, accents)
--brand-orange     25 92% 54%    ← orange du « L » (chaleur, énergie, CTA)
--brand-orange-soft 30 96% 64%   ← variante claire (highlights, badges)
```

### Rôles thématiques

```
--primary             = --brand-blue           (boutons, liens, focus)
--primary-foreground  = 0 0% 100%              (texte sur primaire)
--accent              = --brand-orange         (CTA secondaires, soulignement)
--background (light)  = 240 20% 98%
--background (dark)   = 230 30% 8%
--foreground (light)  = 230 30% 12%
--foreground (dark)   = 240 15% 96%
--muted-foreground    = 230 12% 45% / 230 12% 65%
--border              = 240 8% 90% / 230 25% 18%
```

### Gradients (réservés aux moments forts)

```
--gradient-brand : linear-gradient(135deg, hsl(244 75% 53%) 0%, hsl(280 70% 55%) 50%, hsl(25 92% 54%) 100%)
                   bleu → violet → orange (transition harmonieuse logo)
```

### Typographie

```
Display / headings : Bricolage Grotesque (ou Cabinet Grotesk)   → font-display
Body               : Inter                                       → font-sans
Mono / data        : JetBrains Mono                              → font-mono
```

> Les polices seront auto-hébergées dans `public/fonts/` et préchargées dans `index.html`.

### Règles visuelles

```
Design      : Mobile-first, breakpoints xs(360) / md(768) / 2xl(1400)
Animations  : Reveal au scroll (Framer Motion + Lenis), ≤ 300ms, easings naturels
Performance : LCP < 2.5s, pas de render-blocking, chunks vendors séparés
Dark mode   : next-themes (classe .dark)
```

---

## 🖼️ Composants UI (PRIORITÉ ABSOLUE)

> Avant de créer tout composant React, **vérifier `src/components/ui/`** (primitives shadcn à ajouter au fil des besoins).
> Ne JAMAIS réinventer ce qui existe déjà.

Workflow avant tout code UI :
```
1. src/components/ui/                  → primitive shadcn
2. src/components/sections/            → composant métier déjà créé
3. Sinon → créer en respectant les tokens HSL et UI-UX.md
```

---

## 🛠️ Stack Technique

```
Build         : Vite 5 + @vitejs/plugin-react-swc
Langage       : TypeScript 5
UI            : React 18 + React Router 6
Styling       : Tailwind CSS 3 + tailwindcss-animate
Composants    : shadcn-ui (Radix UI) à ajouter au besoin
Animations    : framer-motion 12 + gsap 3 + lenis 1 (scroll smooth)
WebGL léger   : ogl (optionnel, hero / fond)
Data fetching : @tanstack/react-query 5
Formulaires   : react-hook-form + zod + @hookform/resolvers
Toasts        : sonner
Icônes        : lucide-react
Marquee       : react-fast-marquee
Lint          : eslint + typescript-eslint
Images        : sharp (build-time, optimisation)
```

---

## 📁 Structure Cible

```
.
├── public/
│   ├── fonts/                 polices auto-hébergées
│   └── favicon.png
├── src/
│   ├── pages/                 Index, NotFound
│   ├── components/
│   │   ├── ui/                primitives shadcn
│   │   ├── hero/
│   │   ├── sections/          Poles, Services, Impact, About, Contact
│   │   └── ...
│   ├── contexts/
│   ├── data/                  poles.ts, services.ts, team.ts
│   ├── hooks/                 useLenis, useReveal
│   ├── lib/                   utils.ts (cn), seo.ts
│   ├── assets/
│   ├── App.tsx
│   ├── index.css              tokens HSL Zara Labs
│   └── main.tsx
├── skills_MD/                 skills réutilisables (UI-UX, GSAP, etc.)
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 🔒 Sécurité (Non-Négociables)

```
- Aucun secret en clair dans le repo (.env exclu, .env.example seul commité)
- Validation Zod côté client pour tout formulaire
- target="_blank" → rel="noopener noreferrer"
- Pas de dangerouslySetInnerHTML sans contenu trusté
- HTTPS obligatoire en production
```

---

## 📐 Principes de Code (À RESPECTER TOUJOURS)

```
1. SIMPLE > complexe         Une fonction = une responsabilité
2. LISIBLE > court           Nommer clairement, commenter l'intention
3. COMPOSANTS UI D'ABORD     Vérifier src/components/ui/ avant tout
4. MOBILE-FIRST              Partir du mobile vers le desktop
5. TOKENS HSL UNIQUEMENT     Aucune couleur hardcodée, jamais
6. UN SEUL LABEL HOVER       Pas de title HTML + label custom en même temps
7. JAMAIS DE TIRET CADRATIN  Aucun « — » : utiliser « · », virgule ou deux-points
```

---

## 🔄 Workflow Obligatoire par Session

```
DÉBUT DE SESSION :
  1. Lire CLAUDE.md                       (ce fichier)
  2. Lire skills_MD/AMELIORATIONS.md      (leçons + erreurs résolues)
  3. Vérifier src/components/ui/ avant tout code UI
  4. Coder

FIN DE TÂCHE :
  1. Mettre à jour skills_MD/AMELIORATIONS.md
     (ce qui a été fait · erreurs + solutions · nouvelles leçons)
```

---

*Site Zara Labs · Bénin · Mémoire maintenue par Céphas (AMOUSSOU Siméon Céphas).*
