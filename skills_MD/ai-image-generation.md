---
name: ai-image-generation
description: Génération d'images IA via 50+ modèles (FLUX, GPT-Image-2, Gemini, Grok, Seedream, Reve, ImagineArt…) à travers le CLI `belt` de inference.sh. Capabilities — text-to-image, image-to-image, inpainting, LoRA, editing, upscaling, text rendering. À déclencher pour AI art, product mockups, concept art, social media graphics, illustrations marketing.
source: https://github.com/skills-shell/skills (tools/image/ai-image-generation/SKILL.md)
required-cli: belt (inference.sh) — installer via `npx skills add belt-sh/cli`
allowed-tools: Bash(belt *)
---

# AI Image Generation — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Nécessite l'installation du CLI `belt` (inference.sh) en pré-requis.

---

## 🎯 Quand l'activer

Triggers : `flux`, `image generation`, `ai image`, `text to image`, `stable diffusion`, `generate image`, `ai art`, `midjourney alternative`, `dall-e alternative`, `text2img`, `t2i`, `image generator`, `ai picture`, `create image with ai`, `generative ai`, `ai illustration`, `grok image`, `gemini image`, `gpt image`, `openai image`, `chatgpt image`.

Use cases :
- AI art
- Product mockups
- Concept art
- Social media graphics
- Marketing visuals
- Illustrations

---

## ⚙️ Prérequis

```bash
# Installer le CLI belt
npx skills add belt-sh/cli

# Login
belt login
```

Doc d'install détaillée : https://raw.githubusercontent.com/inference-sh/skills/refs/heads/main/cli-install.md

---

## 🚀 Quick start

```bash
belt app run falai/flux-dev-lora --input '{"prompt": "a cat astronaut in space"}'
```

---

## 🗂️ Catalogue des modèles principaux

| Modèle | App ID | Idéal pour |
|---|---|---|
| **GPT-Image-2** | `openai/gpt-image-2` | Text-to-image, editing, inpainting |
| **FLUX Dev LoRA** | `falai/flux-dev-lora` | Haute qualité avec styles custom |
| **FLUX.2 Klein LoRA** | `falai/flux-2-klein-lora` | Rapide avec LoRA (4B/9B) |
| **P-Image** | `pruna/p-image` | Rapide, économique, multi-aspects |
| **P-Image-LoRA** | `pruna/p-image-lora` | Rapide avec styles LoRA preset |
| **P-Image-Edit** | `pruna/p-image-edit` | Édition rapide d'image |
| **Gemini 3 Pro** | `google/gemini-3-pro-image-preview` | Dernier Google |
| **Gemini 2.5 Flash** | `google/gemini-2-5-flash-image` | Google rapide |
| **Grok Imagine** | `xai/grok-imagine-image` | xAI, multi-aspects |
| **Seedream 4.5** | `bytedance/seedream-4-5` | 2K-4K cinématographique |
| **Seedream 4.0** | `bytedance/seedream-4-0` | Haute qualité 2K-4K |
| **Seedream 3.0** | `bytedance/seedream-3-0-t2i` | Rendu de texte précis |
| **Reve** | `falai/reve` | Édition par langage naturel + text rendering |
| **ImagineArt 1.5 Pro** | `falai/imagine-art-1-5-pro-preview` | Ultra haute fidélité 4K |
| **FLUX Klein 4B** | `pruna/flux-klein-4b` | Ultra-cheap ($0.0001/image) |
| **Topaz Upscaler** | `falai/topaz-image-upscaler` | Upscaling professionnel |

### Parcourir tous les modèles dispo

```bash
belt app store --category image
```

---

## 📚 Exemples par cas d'usage

### GPT-Image-2 — text-to-image classique

```bash
belt app run openai/gpt-image-2 --input '{
  "prompt": "professional product photo of sneakers, studio lighting",
  "quality": "high"
}'
```

### GPT-Image-2 — édition d'image existante

```bash
belt app run openai/gpt-image-2 --input '{
  "prompt": "change the background to a beach at sunset",
  "images": ["https://your-image.jpg"]
}'
```

### FLUX Dev LoRA — qualité haute

```bash
belt app run falai/flux-dev-lora --input '{
  "prompt": "professional product photo of a coffee mug, studio lighting"
}'
```

### FLUX Klein — génération rapide

```bash
belt app run falai/flux-2-klein-lora --input '{"prompt": "sunset over mountains"}'
```

### Google Gemini 3 Pro

```bash
belt app run google/gemini-3-pro-image-preview --input '{
  "prompt": "photorealistic landscape with mountains and lake"
}'
```

### Grok Imagine — avec aspect ratio

```bash
belt app run xai/grok-imagine-image --input '{
  "prompt": "cyberpunk city at night",
  "aspect_ratio": "16:9"
}'
```

### Reve — text rendering (poster, signe, etc.)

```bash
belt app run falai/reve --input '{
  "prompt": "A poster that says HELLO WORLD in bold letters"
}'
```

### Seedream 4.5 — 4K cinématique

```bash
belt app run bytedance/seedream-4-5 --input '{
  "prompt": "cinematic portrait of a woman, golden hour lighting"
}'
```

### Upscaling

```bash
belt app run falai/topaz-image-upscaler --input '{"image_url": "https://..."}'
```

### Combiner plusieurs images

```bash
belt app run infsh/stitch-images --input '{
  "images": ["https://img1.jpg", "https://img2.jpg"],
  "direction": "horizontal"
}'
```

---

## 🎯 Quel modèle choisir ?

| Besoin | Recommandation |
|---|---|
| **Édition d'image existante** | `openai/gpt-image-2` ou `pruna/p-image-edit` |
| **Text-to-image qualité top** | `bytedance/seedream-4-5` (4K) ou `falai/imagine-art-1-5-pro-preview` |
| **Rapide & pas cher** | `pruna/flux-klein-4b` ($0.0001/image) |
| **LoRA / styles custom** | `falai/flux-dev-lora` ou `falai/flux-2-klein-lora` |
| **Texte dans l'image** (poster, sign) | `falai/reve` ou `bytedance/seedream-3-0-t2i` |
| **Upscale d'une image existante** | `falai/topaz-image-upscaler` |
| **Multi-image collage / stitch** | `infsh/stitch-images` |

---

## 🔗 Skills connexes (à installer séparément si besoin)

| Domaine | Skill |
|---|---|
| Plateforme inference.sh complète (250+ apps) | `inference-sh/skills@infsh-cli` |
| P-Image (rapide & éco) | `inference-sh/skills@p-image` |
| GPT-Image-2 seul | `inference-sh/skills@gpt-image` |
| FLUX dédié | `inference-sh/skills@flux-image` |
| Upscaling & enhancement | `inference-sh/skills@image-upscaling` |
| Background removal | `inference-sh/skills@background-removal` |
| Génération vidéo | `inference-sh/skills@ai-video-generation` |
| AI avatars vidéo | `inference-sh/skills@ai-avatar-video` |

---

## 📚 Documentation officielle

- [Running Apps](https://inference.sh/docs/apps/running) — Lancer une app via CLI
- [Image Generation Example](https://inference.sh/docs/examples/image-generation) — Guide complet
- [Apps Overview](https://inference.sh/docs/apps/overview) — Comprendre l'écosystème
