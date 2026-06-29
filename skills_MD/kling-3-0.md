---
name: kling-3-0
description: Génération vidéo via Kling 3.0 sur RunComfy — modèle multi-shot de Kuaishou avec audio synchronisé natif + identité de personnages préservée entre shots. 3 tiers (Standard / Pro / 4K) × 2 modes (t2v / i2v) = 6 endpoints. À déclencher sur "kling", "kling 3.0", "kling v3", "kling pro", "kling 4k", "kling text/image to video".
source: https://github.com/agentspace-so/runcomfy-agent-skills (kling-3-0/SKILL.md)
license: MIT
required-cli: "@runcomfy/cli (npm i -g @runcomfy/cli)"
required-env: RUNCOMFY_TOKEN (CI/containers, sinon `runcomfy login`)
---

# Kling 3.0 — Pro Pack RunComfy

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Nécessite CLI `runcomfy` + compte RunComfy.

---

## 🎯 Quand l'activer

Triggers : `kling`, `kling 3.0`, `kling v3`, `kling pro`, `kling 4k`, `kling text to video`, `kling image to video`.

## 🧬 Kling 3.0 — ce qu'il est

Modèle vidéo V3 de Kuaishou. Capable de :
- **Multi-shot cinématographique** (plusieurs scènes en un seul call)
- **Audio synchronisé natif** (in-pass)
- **Identité de personnage préservée** entre les shots
- **Motion physics-aware**
- Jusqu'à **15 secondes** par clip
- **4K natif** (3840×2160) sur le tier 4K
- Système unifié multi-prompt segment

---

## 📋 Les 6 endpoints

| Endpoint | Résolution | Sans audio | Avec audio |
|---|---|---|---|
| `kling/kling-3.0/standard/text-to-video` | up to 1080p | $0.084/s | $0.126/s |
| `kling/kling-3.0/standard/image-to-video` | up to 1080p | $0.084/s | $0.126/s |
| `kling/kling-3.0/pro/text-to-video` | 1080p | $0.112/s | $0.168/s |
| `kling/kling-3.0/pro/image-to-video` | 1080p | $0.112/s | $0.168/s |
| `kling/kling-3.0/4k/text-to-video` | 3840×2160 | **$0.42/s flat** | $0.42/s flat |
| `kling/kling-3.0/4k/image-to-video` | 3840×2160 | **$0.42/s flat** | $0.42/s flat |

> 💡 **4K = tarif flat** (audio ou pas), Standard/Pro = +50 % avec audio.

---

## 🎯 Choix du tier selon le rôle

| Tier | Cas d'usage | Compromis |
|---|---|---|
| **Standard** | Drafts, previews, social shorts, A/B variants | Cheapest — quality OK sauf hero shots |
| **Pro** | Hero 1080p, ad creative, talking heads haute fidélité | ~33% + cher que Standard, motion fidelity nettement tighter |
| **4K** | Brand films 4K, big-screen cinematic, finished masters | Native 3840×2160 (pas d'upscale), flat $0.42/s ≈ 5× le coût Standard |

## 🎯 Choix du mode

- **Text-to-Video** (t2v) — prompt seul, génération from scratch. Pour scènes novel, compositions brand new
- **Image-to-Video** (i2v) — prompt + image source. Quand on a une référence exacte (visage, produit, scène) à préserver

---

## ⚙️ Prérequis

```bash
npm i -g @runcomfy/cli
runcomfy login                    # ou: export RUNCOMFY_TOKEN="..."
```

Pour i2v : URL HTTPS publique (JPEG/PNG/WebP).

---

## 📝 Schema d'input (commun aux 6 endpoints)

| Champ | Type | Requis | Default | Notes |
|---|---|---|---|---|
| `prompt` | string | ✅ | — | Scene + motion + camera + atmosphere. Multi-segment supporté pour transitions de scène |
| `image_url` | string | ✅ (i2v only) | — | HTTPS, JPEG/PNG/WebP |
| `tail_image_url` | string | ❌ (i2v) | — | Image de fin pour transition source→tail contrôlée |
| `negative_prompt` | string | ❌ | — | Éléments à exclure |
| `duration` | int | ❌ | 5 | 3–15 secondes |
| `aspect_ratio` | enum | ❌ | `16:9` | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9` |
| `cfg_scale` | float | ❌ | 0.5 | Strength du prompt. 0.7-0.9 strict / 0.3-0.4 loose |
| `generate_audio` | bool | ❌ | false | Audio in-pass synchronisé |
| `seed` | int | ❌ | — | Reproducibility |

---

## 🚀 Invocations CLI

### Standard t2v (cheapest 1080p draft)

```bash
runcomfy run kling/kling-3.0/standard/text-to-video \
  --input '{"prompt": "<prompt>", "duration": 5, "aspect_ratio": "16:9"}' \
  --output-dir <absolute/path>
```

### Standard i2v (animer un still)

```bash
runcomfy run kling/kling-3.0/standard/image-to-video \
  --input '{"prompt": "<motion>", "image_url": "https://.../src.jpg", "duration": 5}' \
  --output-dir <absolute/path>
```

### Pro t2v (highest 1080p fidelity)

```bash
runcomfy run kling/kling-3.0/pro/text-to-video \
  --input '{"prompt": "<prompt>", "duration": 8, "aspect_ratio": "16:9", "generate_audio": true}' \
  --output-dir <absolute/path>
```

### Pro i2v (hero animation from source image)

```bash
runcomfy run kling/kling-3.0/pro/image-to-video \
  --input '{"prompt": "<motion>", "image_url": "https://.../subj.jpg", "duration": 8, "generate_audio": true}' \
  --output-dir <absolute/path>
```

### 4K t2v (cinematic native 4K)

```bash
runcomfy run kling/kling-3.0/4k/text-to-video \
  --input '{"prompt": "<prompt>", "duration": 10, "aspect_ratio": "16:9", "generate_audio": true}' \
  --output-dir <absolute/path>
```

### 4K i2v (4K animation d'une référence)

```bash
runcomfy run kling/kling-3.0/4k/image-to-video \
  --input '{"prompt": "<motion>", "image_url": "https://.../src-4k.jpg", "duration": 10, "generate_audio": true}' \
  --output-dir <absolute/path>
```

---

## ✍️ Prompting Kling 3.0 — ce qui marche

### Lead with motion + camera

Kling 3.0 lit `"wide shot, slow push-in"`, `"tracking shot, low angle"`, `"handheld follow"` comme de **vraies directives**. Front-load.

### Multi-shot en un seul call

Un prompt peut décrire une **séquence de shots**. Numéroter :
```
Shot 1: wide of the cafe at dusk.
Shot 2: medium close-up of the barista.
Shot 3: tight on the espresso pour.
```
Kling 3.0 préserve l'identité (face, wardrobe, props) entre les shots.

### Identity anchors pour i2v

Restate ce qui doit rester stable :
> "preserve the subject's face, pose, and clothing; only the camera moves and the background changes."

### `tail_image_url` pour endings contrôlés

Sur i2v, fournir une image de fin → Kling interpole motion source → tail.

### `generate_audio: true` pour dialogue one-pass

Décrire ce que Kling doit produire :
- `"warm friendly tone, English voiceover"`
- `"city ambience, distant traffic, no dialogue"`

### `cfg_scale` tuning

| Valeur | Quand |
|---|---|
| **0.5** (default) | Marche pour la plupart |
| **0.7-0.9** | Adhérence stricte au prompt (output stylisé) |
| **0.3-0.4** | Motion naturelle (prompt loose) |

### Anti-patterns

- Style cues conflictuels dans un seul prompt → simplifier (1-2 anchors)
- > 15s en un call → erreur 422, segmenter et stitcher
- Aspect ratios hors set supporté → rejected
- Sur 4K : combiner multi-shot agressif + 15s + dialogue + 6 cuts → fonctionne mais coût ≈ **$6.30 / generation**. Valider sur Standard d'abord.

---

## 🎬 Où Kling 3.0 brille

| Use case | Endpoint recommandé |
|---|---|
| Cinematic 1080p brand stories avec persos consistants | **Pro** (t2v ou i2v) |
| Native 4K hero films + big-screen | **4K** (t2v ou i2v) |
| Cheap iteration, social-first shorts, A/B variants | **Standard t2v** |
| Animer assets brand, product photos, character art | **Standard i2v** ou **Pro i2v** |
| Multi-shot ads avec dialogue sync en un pass | **Pro** + `generate_audio: true` |
| Premium 4K finished masters avec audio natif | **4K** + `generate_audio: true` (flat rate) |

---

## 📝 Exemples de prompts

### Cinematic multi-shot (Pro tier)

```
Cinematic multi-shot of a young American couple celebrating their
anniversary at a candlelit rooftop restaurant. Shot 1: wide of the
city skyline at golden hour. Shot 2: medium two-shot, the couple
toasting. Shot 3: tight on the woman's smile, soft bokeh, warm fill
light. Subtle ambient string music, gentle wind, distant traffic.
```

### i2v animer portrait (4K tier)

```
Gentle camera dolly-in on the subject from the source image. Subtle
breathing motion, identity-stable features, soft natural light,
shallow depth of field. Background: warm golden-hour glow with a
slow drift of dust motes. No dialogue, only ambient room tone.
```

### Vertical short (Standard tier, 9:16)

```
9:16 vertical. A barista in a black apron pulls a single espresso
shot, steam rising into morning sun, rich crema slowly forming.
Close-up handheld, shallow depth of field, warm cafe ambience and
the hiss of the steam wand.
```

---

## ❓ FAQ

| Question | Réponse |
|---|---|
| **Durée max d'un clip Kling 3.0 ?** | 15 secondes / generation sur les 3 tiers. Plus long → segmenter + stitcher |
| **4K vs Standard/Pro pricing ?** | 4K flat $0.42/s. Standard $0.084/s no-audio (cheapest). Pro $0.112/s. 4K ≈ 5× Standard |
| **Multi-shot en un call ?** | ✅ Tous les endpoints. Numéroter "Shot 1:", "Shot 2:" → identité persos préservée |
| **Audio synchronisé ?** | ✅ `generate_audio: true` → dialogue + ambient + music in-pass. Flat $0.42/s sur 4K, +50% sur Std/Pro |
| **Aspect ratios supportés ?** | 16:9, 9:16, 1:1, 4:3, 3:4, 21:9. 4K en 21:9 = wide cinema crops |
| **Tail image sur i2v ?** | ✅ `tail_image_url` lock la dernière frame |
| **Diff Kling 3.0 vs 2.x ?** | + multi-shot identity stronger, + durée max (15s vs 10s), + 4K natif, + multi-prompt segment unifié |

---

## ⚠️ Limitations

- **Cap durée 15s** sur chaque tier
- **Max 6 shots continus** en une seule gen 4K
- **i2v requiert HTTPS URL publique** — fichiers locaux pas supportés
- **Aspect ratios fixes** aux 6 documentés
- **Output 4K = fichiers larges** — planifier disque + bandwidth pour batch

---

## 🚨 Exit codes

| Code | Sens |
|---|---|
| 0 | Generation succeeded |
| 64 | Mauvais CLI args |
| 65 | Mauvais JSON / schema mismatch |
| 69 | Upstream 5xx |
| 75 | Retryable : timeout / 429 |
| 77 | Pas signed in / token rejeté |

Doc : https://docs.runcomfy.com/cli/troubleshooting

---

## 🔒 Security & Privacy

- **Token storage** : `~/.config/runcomfy/token.json` mode 0600. `RUNCOMFY_TOKEN` env var bypass complet
- **Pas de shell-expand** sur le prompt → pas de surface injection
- **Image URLs** fetchées par les serveurs RunComfy, **PAS** par le CLI local. Image-based prompt injection = risque connu
- **Outbound** : `model-api.runcomfy.net` + `*.runcomfy.net` / `*.runcomfy.com` uniquement
- **Cap download** : 2 GiB par fichier (anti disk-fill 4K runaway)
