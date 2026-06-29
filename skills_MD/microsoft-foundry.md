---
name: microsoft-foundry
description: Skill officiel Microsoft pour le cycle de vie complet des agents IA Foundry sur Azure — déploiement (Docker/ACR), évaluation continue, fine-tuning (SFT/DPO/RFT), provisioning ressources, RBAC, quotas, réseau privé. À déclencher pour : créer/déployer/invoquer/évaluer un agent Foundry, fine-tuner un modèle, gérer un projet/ressource Foundry.
source: https://github.com/microsoft/azure-skills (skills/microsoft-foundry/SKILL.md)
license: MIT — Microsoft
---

# Microsoft Foundry — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Méta-skill qui route vers des sous-skills spécialisés selon l'intention.

---

## 🎯 Quand l'activer

| Catégorie | Mots-clés déclencheurs |
|---|---|
| **Agents** | déployer/créer/invoquer agent, hosted/prompt agent, container agent, ajouter tool, agent.yaml |
| **Évaluation** | batch eval, continuous eval, monitoring, optimize prompt, improve agent instructions |
| **Datasets** | trace-to-dataset, dataset versioning, regression detection |
| **Modèles** | deploy model, fine-tune, SFT/DPO/RFT, grader, distillation |
| **Infra** | Foundry project, AI Services resource, VNet isolation, RBAC, quota, capacity |
| **Debug** | troubleshoot, deployment failure, agent logs, App Insights |

❌ **Ne pas utiliser pour** : Azure Functions, App Service, déploiement Azure générique → utiliser `azure-deploy` ou `azure-prepare`.

---

## ⚠️ Pré-requis d'exécution obligatoires

1. **Avant tout workflow** : appeler le MCP `foundry` d'Azure MCP pour découvrir les tools Foundry disponibles + leurs paramètres
2. **Avant toute action spécifique** : lire le document du sous-skill correspondant. Même si on connaît les paramètres du tool, le doc contient des **pré-checks et validations obligatoires**

---

## 🧭 Routage par intention

### Infrastructure

| Intention utilisateur | Sous-skill |
|---|---|
| "Set up Foundry" (ambigu) | Demander : (a) AI Services resource, (b) projet public, (c) projet avec VNet → router en conséquence |
| Foundry avec VNet isolation | `private-network` |
| Projet Foundry public | `project/create` |
| Ressource Foundry seule | `resource/create` |

### Cycle agent

| Intention | Workflow (à lire dans cet ordre) |
|---|---|
| Créer un agent from scratch | `create` → `deploy` → `invoke` |
| Optimiser agent Python existant | `agent-optimizer` (scaffold → eval.yaml → optimize → apply → deploy → invoke) |
| Déployer agent (code existant) | `deploy` → `invoke` → `observe` |
| Mettre à jour / redéployer | `deploy` → `invoke` → `observe` |
| Invoquer / tester / chat | `invoke` |
| Optimiser prompt / instructions | `observe` (Step 4: Optimize) |
| Évaluer agent (full loop) | `observe` |
| Continuous evaluation monitoring | `observe` (Step 6: CI/CD & Monitoring) |
| Troubleshoot | `invoke` → `troubleshoot` |
| Fix + redeploy | `invoke` → `troubleshoot` → fix → `deploy` → `invoke` |

### Modèles & fine-tuning

| Intention | Sous-skill |
|---|---|
| Déployer un modèle | `models/deploy-model` (route auto vers preset/customize/capacity) |
| Fine-tune SFT distillation | `finetuning` |
| Fine-tune DPO preference optimization | `finetuning` |
| Fine-tune RFT avec graders | `finetuning` |

---

## 🗂️ Catalogue des sous-skills

| Sous-skill | Rôle |
|---|---|
| `deploy` | Container build, ACR push, create/update/clone deployments |
| `invoke` | Envoyer messages à un agent (single/multi-turn) |
| `invocations-ws` | Agents WebSocket duplex (voice agents, real-time streams) |
| `observe` | Eval qualité, batch evals, optimize prompt, CI/CD monitoring |
| `trace` | Query traces, latency/failures via App Insights `customEvents` |
| `troubleshoot` | Logs hosted agent, telemetry, diagnose |
| `create` | New hosted agent (Agent Framework / LangGraph / custom, Python/C#) |
| `agent-optimizer` | Optimize-ready scaffold + eval.yaml + apply candidates |
| `eval-datasets` | Harvest production traces → datasets, versioning, regression detection |
| `project/create` | New Foundry project |
| `resource/create` | New AI Services multi-service resource via Azure CLI |
| `private-network` | Foundry network isolation (BYO VNet / Managed VNet / hybrid) |
| `models/deploy-model` | Unified model deployment + capacity discovery |
| `quota` | Quota & capacity management |
| `rbac` | RBAC, role assignments, managed identities, service principals |
| `finetuning` | SFT/DPO/RFT, dataset prep, grader calibration |

---

## 🏗️ Workspace standard `.foundry/`

Chaque dossier d'agent peut avoir son cache + overlay Foundry :

```
<agent-root>/
  .foundry/
    agent-metadata.yaml         ← overlay local/dev
    agent-metadata.prod.yaml    ← overlay prod/CI (optionnel)
    suites/                     ← cache eval suites
    datasets/                   ← cache datasets
    evaluators/                 ← cache evaluators
    results/                    ← résultats d'eval
```

**Règles** :
- En projets azd : déduire le contexte (project endpoint, agent name, ACR, App Insights) depuis `azure.yaml` + `azd env get-values` — ne pas dupliquer dans metadata
- `agent-metadata.yaml` = overlay pour les valeurs non-azd + caches + overrides explicites
- `suites/`, `datasets/`, `evaluators/` = caches locaux — réutiliser si à jour, **demander avant** d'écraser

---

## 🔍 Résolution du contexte projet (7 étapes)

À exécuter **uniquement quand des valeurs manquent** — skip si déjà connu depuis le message user ou un skill précédent.

| Step | Quoi |
|---|---|
| **1. Discover agent roots** | Vérifier `azure.yaml` avec `host: azure.ai.agent` → 1 service = root, plusieurs = demander, aucun = chercher `.foundry/` |
| **2. Resolve environment** | Ordre : explicit user → `AZURE_ENV_NAME` → default `.azure/config.json` → session |
| **3. Select metadata overlay** | Ordre : explicit → `agent-metadata.<env>.yaml` → `agent-metadata.yaml` → prompt |
| **4. Resolve eval.yaml** | Si présent : `agent.name`, `dataset_file`, `evaluators[]`, `name`, options → traiter comme **intention locale**, pas comme preuve d'existence remote |
| **5. Layer config sources** | 1) user input · 2) azd env · 3) `.foundry/agent-metadata*.yaml` · 4) `agent.yaml`/`eval.yaml` · 5) prompts |
| **6. Write metadata overlay** | Persist UNIQUEMENT le non-derivable (suites, lastEval, overrides) — pas les valeurs azd-owned |
| **7. Collect missing values** | Via `ask_user`/`askQuestions` uniquement pour ce qui n'a pas pu être résolu |

### Sources prioritaires par valeur

| Valeur | Source préférée |
|---|---|
| Project endpoint | azd env (`AZURE_AI_PROJECT_ENDPOINT`) |
| Agent name/version | azd vars (`AGENT_<SERVICE>_NAME/VERSION`) puis `agent.yaml` |
| ACR | azd env (`AZURE_CONTAINER_REGISTRY_NAME`) |
| Evaluation suites | `.foundry/agent-metadata*.yaml` |
| Local eval intent | `eval.yaml` |
| App Insights | azd env (`APPLICATIONINSIGHTS_CONNECTION_STRING`) |

---

## 🧬 Types d'agents

| Type | Kind | Description |
|---|---|---|
| **Prompt** | `"prompt"` | Agents LLM avec model deployment |
| **Hosted** | `"hosted"` | Containers avec code custom |

Utiliser `agent_get` MCP tool pour déterminer le type d'un agent existant.

---

## 🛠️ Conventions tools

- `ask_user` / `askQuestions` → collecter info user (jamais inventer)
- `task` / `runSubagent` → déléguer long/independent (scan env vars, polling, Dockerfile gen)
- **Azure MCP tools > CLI direct** quand dispo
- Référencer la doc officielle Microsoft Learn plutôt que d'embarquer la syntaxe CLI

---

## 📚 Références

- [Hosted Agents](https://learn.microsoft.com/azure/ai-foundry/agents/concepts/hosted-agents?view=foundry)
- [Runtime Components](https://learn.microsoft.com/azure/ai-foundry/agents/concepts/runtime-components?view=foundry)
- SDK Python : `references/sdk/foundry-sdk-py.md` dans le repo source

> 💡 **Onboarding complet** : `project/create` (public) ou `private-network` (VNet) → `models/deploy-model` → `create` → `deploy` → `invoke`.
