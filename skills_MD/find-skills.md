---
name: find-skills
description: Aide à découvrir et installer des skills d'agents depuis l'écosystème ouvert quand l'utilisateur demande "comment faire X", "y a-t-il un skill pour X", ou souhaite étendre ses capacités.
source: https://github.com/vercel-labs/skills (skills/find-skills/SKILL.md)
---

# Find Skills — Skill réutilisable

> ✅ **Ce fichier est neutre** — aucune configuration projet requise. Il s'utilise tel quel dans n'importe quel repo.

Skill du repo `vercel-labs/skills` qui guide la découverte et l'installation de skills via la **Skills CLI** (`npx skills`).

---

## 🎯 Quand l'activer

Déclencher ce skill quand l'utilisateur :

- Demande **"comment faire X"** où X pourrait correspondre à un skill existant
- Dit **"trouve-moi un skill pour X"** ou **"existe-t-il un skill pour X"**
- Demande **"peux-tu faire X"** (X = capacité spécialisée)
- Veut étendre les capacités de l'agent
- Cherche outils, templates ou workflows
- Mentionne un domaine où il aimerait être assisté (design, tests, déploiement…)

---

## 🧰 La Skills CLI

`npx skills` est le **gestionnaire de paquets** de l'écosystème ouvert de skills d'agents.

| Commande | Rôle |
|---|---|
| `npx skills find [query]` | Rechercher des skills |
| `npx skills add <package>` | Installer un skill |
| `npx skills check` | Vérifier les mises à jour |
| `npx skills update` | Mettre à jour tous les skills |

**Catalogue** : https://skills.sh/

---

## 🔄 Workflow recommandé (6 étapes)

1. **Comprendre le besoin** — domaine, tâche précise, probabilité qu'un skill existe
2. **Consulter le leaderboard** — https://skills.sh/ (top : `vercel-labs/agent-skills`, `anthropics/skills`)
3. **Lancer `npx skills find [query]`** — mots-clés précis ("react testing" > "testing")
4. **Vérifier la qualité** — installs 1K+ préféré, source officielle, étoiles GitHub du repo
5. **Présenter** — nom, rôle, installs, commande d'install, lien skills.sh
6. **Installer** — `npx skills add <owner/repo@skill> -g -y` (`-g` global, `-y` skip confirm)

---

## 🗂️ Catégories courantes

| Catégorie | Exemples |
|---|---|
| Web dev | react, nextjs, typescript, css, tailwind |
| Tests | jest, playwright, e2e |
| DevOps | deploy, docker, kubernetes, ci-cd |
| Docs | readme, changelog, api-docs |
| Qualité | review, lint, refactor |
| Design | ui, ux, design-system, accessibility |

---

## 🚫 Si aucun skill ne correspond

1. Le dire clairement
2. Proposer d'aider directement
3. Suggérer `npx skills init my-xyz-skill` pour créer le sien
