# 📦 skills_MD — Skills réutilisables

> Dossier de **skills/templates Markdown neutres**, réutilisables d'un projet à l'autre.
> À chaque nouveau projet : copier ce dossier, remplir les placeholders `{...}` de chaque fichier, supprimer le bloc **🔧 Configuration projet** une fois rempli.

---

## 🗂️ Contenu

| Fichier | Rôle | Configuration requise ? |
|---|---|---|
| [`SKILL.md`](SKILL.md) | Skill `design` — point d'entrée UI/UX, à lire en 1er pour tout code d'interface | ✅ Oui (tokens, polices, paths) |
| [`UI-UX.md`](UI-UX.md) | Règles de craft (typo, layout, composants, anim, a11y) | ✅ Oui (polices, paths) |
| [`COMPONENTS.md`](COMPONENTS.md) | Catalogue de composants premium externes (Aceternity / Magic UI) | ✅ Oui (paths) |
| [`AMELIORATIONS.md`](AMELIORATIONS.md) | Journal vivant — leçons, fixes, décisions par session | ✅ Oui (nom projet, owner) |
| [`TRACK_TEMPLATE.md`](TRACK_TEMPLATE.md) | Template pour suivi multi-sessions d'une feature/sprint long | ✅ Oui (nom du chantier) |
| [`find-skills.md`](find-skills.md) | Skill `find-skills` (vercel-labs) — découvrir d'autres skills via `npx skills` | ❌ Neutre tel quel |
| [`gsap-performance.md`](gsap-performance.md) | Skill `gsap-performance` (greensock) — 60 fps stable, transforms, `quickTo`, ScrollTrigger | ❌ Neutre tel quel |
| [`frontend-design.md`](frontend-design.md) | Skill `frontend-design` (anthropics) — parti pris esthétique fort, anti AI slop, choix audacieux | ❌ Neutre tel quel |
| [`mcp-builder.md`](mcp-builder.md) | Skill `mcp-builder` (anthropics) — créer des serveurs MCP de qualité (TS SDK ou FastMCP Python), workflow 4 phases | ❌ Neutre tel quel |
| [`vercel-react-best-practices.md`](vercel-react-best-practices.md) | Skill `vercel-react-best-practices` (vercel) — **70 règles perf React/Next.js** en 8 catégories (waterfalls, bundle, RSC, re-render…) | ❌ Neutre tel quel |
| [`microsoft-foundry.md`](microsoft-foundry.md) | Skill `microsoft-foundry` (microsoft) — cycle complet agents IA Foundry sur Azure (deploy, eval, fine-tune SFT/DPO/RFT, RBAC, quota, VNet) | ❌ Neutre tel quel |
| [`web-design-guidelines.md`](web-design-guidelines.md) | Skill `web-design-guidelines` (vercel) — audit UI exhaustif (a11y, focus, forms, anim, typo, perf, dark, i18n, hydration) + format `file:line` | ❌ Neutre tel quel |
| [`remotion-best-practices.md`](remotion-best-practices.md) | Skill `remotion-best-practices` (remotion-dev) — création vidéo React via `useCurrentFrame()` + `interpolate()`, `Sequence`, `staticFile()`, catalogue de rules par domaine | ❌ Neutre tel quel |
| [`ai-image-generation.md`](ai-image-generation.md) | Skill `ai-image-generation` (skills-shell) — 50+ modèles via `belt` CLI (FLUX, GPT-Image-2, Gemini, Grok, Seedream, Reve) — t2i, edit, inpaint, upscale | ❌ Neutre tel quel (requiert CLI `belt`) |
| [`sleek-design-mobile-apps.md`](sleek-design-mobile-apps.md) | Skill `sleek-design-mobile-apps` (sleekdotdesign) — design d'apps mobiles via API REST sleek.design : créer projets, génèrer screens en prompt, screenshots HD, récupérer HTML pour implémentation native | ❌ Neutre tel quel (requiert `SLEEK_API_KEY` + plan Pro) |
| [`image-to-video.md`](image-to-video.md) | Skill `image-to-video` (agentspace-so) — animer image fixe via RunComfy, router intent → HappyHorse 1.0 (portrait/produit) / Wan 2.7+audio (lip-sync custom) / Seedance 2.0 Pro (multi-modal) | ❌ Neutre tel quel (requiert CLI `runcomfy` + compte RunComfy) |
| [`kling-3-0.md`](kling-3-0.md) | Skill `kling-3-0` (agentspace-so) — vidéo Kuaishou Kling 3.0 sur RunComfy, multi-shot + audio natif + identité persos préservée, 6 endpoints (Standard / Pro / 4K × t2v / i2v) | ❌ Neutre tel quel (requiert CLI `runcomfy` + compte RunComfy) |
| [`impeccable-animate.md`](impeccable-animate.md) | Skill `animate` (pbakaus/impeccable) — guide craft d'animation UI : 100/300/500 rule, easing curves recommandées, motion materials, perceived perf, a11y, anti-patterns | ❌ Neutre tel quel |
| [`high-end-visual-design.md`](high-end-visual-design.md) | Skill `high-end-visual-design` (leonxlnx/taste-skill) — design tier agence $150k+ (Apple/Linear/Awwwards) : variance engine, Double-Bezel, button-in-button, fonts/icons bannis, checklist 11 points | ❌ Neutre tel quel |
| [`canvas-design.md`](canvas-design.md) | Skill `canvas-design` (anthropics) — créer art visuel original (.png/.pdf) via workflow 2 étapes : philosophie/manifeste d'aesthetic movement → expression visuelle museum-quality | ❌ Neutre tel quel |
| [`premium-frontend-ui.md`](premium-frontend-ui.md) | Skill `premium-frontend-ui` (github/awesome-copilot) — architecture immersive complète Awwwards : preloader, hero, nav contextuelle, scroll narratives, magnetic interactions, typo, ecosystem libs React/Vanilla | ❌ Neutre tel quel |
| [`ck-frontend-design.md`](ck-frontend-design.md) | Skill `ck:frontend-design` (binjuhor/shadcn-lar) — créer UI depuis screenshots/vidéos, 3D, design dials configurables (variance/motion/density), anti-AI-slop strict | ❌ Neutre tel quel |
| [`ck-ui-ux-pro-max.md`](ck-ui-ux-pro-max.md) | Skill `ck:ui-ux-pro-max` (binjuhor/shadcn-lar) — **database design exhaustive** : 161 palettes, 57 font pairings, 99 UX guidelines, 25 chart types, 10 catégories par priorité d'impact, 10 stacks | ❌ Neutre tel quel |

---

## 🚀 Workflow pour un nouveau projet

1. **Copier `skills_MD/`** à la racine du nouveau projet
2. Ouvrir chaque fichier marqué ✅ et **remplacer les placeholders** `{PROJECT_NAME}`, `{COMPONENTS_PATH}`, `{TOKENS_FILE}`, `{FONT_DISPLAY}`, etc.
3. Supprimer le bloc **🔧 Configuration projet** une fois rempli (le bloc est juste là pour le setup)
4. Référencer ces fichiers depuis le `CLAUDE.md` du projet
5. Au quotidien : mettre à jour `AMELIORATIONS.md` après chaque tâche

---

## 🧭 Convention des placeholders

Tous les fichiers utilisent la même nomenclature `{NOM_EN_MAJUSCULES}` :

| Placeholder | Sens |
|---|---|
| `{PROJECT_NAME}` | Nom lisible du projet |
| `{OWNER}` | Propriétaire / mainteneur |
| `{STACK}` | Stack technique (1 ligne) |
| `{TOKENS_FILE}` | Fichier des design tokens |
| `{COMPONENTS_PATH}` | Dossier des primitives UI |
| `{DOMAIN_COMPONENTS_PATH}` | Dossier des composants métier |
| `{FONT_DISPLAY}` / `{FONT_BODY}` | Polices du projet |
| `{COLOR_TOKEN_FORMAT}` | Format des couleurs (HSL var, OKLCH…) |

> 💡 **Astuce** : un `find/replace` global dans l'éditeur configure tous les fichiers d'un coup.
