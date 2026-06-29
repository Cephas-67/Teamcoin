---
name: mcp-builder
description: Skill officiel Anthropic pour créer des serveurs MCP (Model Context Protocol) de qualité — tools bien designés, schémas Zod/Pydantic, évaluations, choix Python (FastMCP) vs TypeScript SDK. À déclencher quand l'utilisateur veut intégrer un service externe à un LLM via MCP.
source: https://github.com/anthropics/skills (skills/mcp-builder/SKILL.md)
license: Anthropic — voir LICENSE.txt du repo source
---

# MCP Builder — Skill réutilisable

> ✅ **Ce fichier est neutre** — aucune configuration projet requise. Méthode de travail pour construire un serveur MCP de qualité, agnostique du domaine cible.

---

## 🎯 Quand l'activer

Sur toute demande de :
- Création d'un **serveur MCP** (Model Context Protocol)
- Intégration d'un **service externe** (API REST, base de données, plateforme SaaS) dans un workflow LLM
- Choix entre **FastMCP (Python)** ou **MCP SDK (TypeScript)**
- Refonte/audit d'un serveur MCP existant

**Mesure de qualité** d'un serveur MCP : à quel point il permet au LLM d'accomplir des tâches réelles, pas juste d'exposer des endpoints.

---

## 🚀 Workflow en 4 phases

### Phase 1 — Recherche & planification

#### 1.1 Comprendre le design moderne d'un MCP

**API coverage vs workflow tools** :
- ✅ Couverture exhaustive de l'API → flexibilité (l'agent compose des opérations)
- ✅ Workflow tools spécialisés → pratique pour des tâches précises
- **Par défaut** : prioriser la couverture API quand on hésite

**Nommage des tools** :
- Noms clairs et descriptifs
- **Préfixes consistants** (ex: `github_create_issue`, `github_list_repos`)
- Action-oriented (verbe + objet)

**Context management** :
- Descriptions concises
- Filtrage / pagination des résultats
- Tools qui retournent de la donnée focalisée et pertinente

**Messages d'erreur actionnables** :
- Guident l'agent vers la solution
- Suggestions concrètes + prochaines étapes

#### 1.2 Étudier la spec MCP

- Point d'entrée : https://modelcontextprotocol.io/sitemap.xml
- Format markdown : ajouter `.md` à l'URL (ex: `/specification/draft.md`)
- Pages clés : architecture · transports (streamable HTTP, stdio) · tools/resources/prompts

#### 1.3 Choix de stack recommandé

| | Recommandation | Pourquoi |
|---|---|---|
| **Langage** | **TypeScript** | SDK de qualité, bonne compatibilité environnements (ex: MCPB), typage statique, LLMs solides en TS |
| **Transport** | **Streamable HTTP stateless** (serveurs distants) ou **stdio** (locaux) | Simple à scaler, pas de gestion de session |

**Docs SDK à charger** :
- TS : https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md
- Python : https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md

#### 1.4 Planifier l'implémentation

- Lire la doc API du service cible (endpoints, auth, modèles de données)
- Lister les endpoints à implémenter en commençant par les plus communs
- Identifier la structure auth (clé API, OAuth, token, etc.)

---

### Phase 2 — Implémentation

#### 2.1 Structure projet

Suivre les conventions du SDK :
- **TS** : `package.json`, `tsconfig.json`, structure modulaire
- **Python** : module-based, dépendances déclarées

#### 2.2 Core infrastructure (utilitaires partagés)

- Client API avec auth
- Helpers d'error handling
- Formatage de réponse (JSON / Markdown)
- Support pagination

#### 2.3 Implémenter chaque tool

| Élément | Détail |
|---|---|
| **Input schema** | Zod (TS) ou Pydantic (Python) — contraintes + descriptions claires + exemples dans les champs |
| **Output schema** | Définir `outputSchema` pour les données structurées, utiliser `structuredContent` (TS SDK) |
| **Description tool** | Résumé concis + descriptions des paramètres + type de retour |
| **Implémentation** | Async/await pour les I/O, error handling actionnable, pagination si applicable |
| **Annotations** | `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` |

---

### Phase 3 — Review & test

#### 3.1 Qualité code
- Pas de duplication (DRY)
- Error handling consistent
- Type coverage complète
- Descriptions tools claires

#### 3.2 Build & test
- **TS** : `npm run build` puis `npx @modelcontextprotocol/inspector`
- **Python** : `python -m py_compile <serveur>.py` puis MCP Inspector

---

### Phase 4 — Évaluations

Créer des **évaluations** pour vérifier que le LLM peut utiliser le serveur efficacement sur des questions réelles complexes.

#### 4.1 Méthode (10 questions)

1. **Tool inspection** — lister les tools + comprendre leurs capacités
2. **Content exploration** — opérations READ-ONLY pour découvrir la donnée disponible
3. **Question generation** — 10 questions complexes et réalistes
4. **Answer verification** — résoudre soi-même chaque question pour valider

#### 4.2 Critères de chaque question

| Critère | Définition |
|---|---|
| **Indépendante** | Ne dépend pas des autres questions |
| **Read-only** | Aucune opération destructive requise |
| **Complexe** | Nécessite plusieurs tool calls + exploration |
| **Réaliste** | Cas d'usage que des humains se posent vraiment |
| **Vérifiable** | Une réponse claire, comparable par string |
| **Stable** | La réponse ne change pas avec le temps |

#### 4.3 Format XML

```xml
<evaluation>
  <qa_pair>
    <question>...</question>
    <answer>...</answer>
  </qa_pair>
</evaluation>
```

---

## 📚 Références à charger

| Quand | Quoi |
|---|---|
| Phase 1 | Sitemap MCP + best practices universelles |
| Phase 1/2 | SDK README (TS ou Python) |
| Phase 2 | Guide d'implémentation par langage |
| Phase 4 | Guide d'évaluation |

---

## ✅ Checklist finale

- [ ] Couverture API exhaustive (ou workflow tools justifiés)
- [ ] Nommage cohérent avec préfixe
- [ ] Input/output schemas typés (Zod/Pydantic)
- [ ] Error messages actionnables
- [ ] Pagination implémentée où applicable
- [ ] Annotations (read-only, destructive, idempotent) correctes
- [ ] Build pass + test MCP Inspector OK
- [ ] 10 questions d'évaluation indépendantes/read-only/complexes/stables
