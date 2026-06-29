---
name: image-to-video
description: Animer une image fixe via RunComfy — router intelligent qui choisit le bon modèle i2v selon l'intention. HappyHorse 1.0 (Arena #1, audio natif, préservation identité) pour anim générale ; Wan 2.7 + audio_url pour lip-sync sur voiceover custom ; Seedance 2.0 Pro pour multi-modal (image + vidéo ref + audio ref). À déclencher sur "image to video", "i2v", "animate image", "make this move", "turn still into video".
source: https://github.com/agentspace-so/runcomfy-agent-skills (image-to-video/SKILL.md)
license: MIT
required-cli: "@runcomfy/cli (npm i -g @runcomfy/cli)"
required-env: RUNCOMFY_TOKEN (en CI/containers, sinon `runcomfy login`)
---

# Image-to-Video — Pro Pack RunComfy

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. Nécessite le CLI `runcomfy` + un compte RunComfy.

---

## 🎯 Quand l'activer

Triggers : `image to video`, `image-to-video`, `i2v`, `animate image`, `make this move`, "tourne cette image fixe en vidéo".

Le skill est un **router** : il classifie l'intent user puis choisit le bon modèle dans le catalogue RunComfy.

---

## 🧭 Choix du modèle selon l'intent

| Intent user | Modèle | Pourquoi |
|---|---|---|
| Animer un portrait — identité stable | **HappyHorse 1.0 I2V** | #1 Arena (Elo 1392), fidélité faciale forte |
| Reveal produit / 360 / macro motion | **HappyHorse 1.0 I2V** | Préservation géométrie + mouvements caméra fluides |
| Audio ambiant natif synchronisé en 1 pass | **HappyHorse 1.0 I2V** | Synthèse audio in-pass |
| Anim + **lip-sync sur voiceover custom** | **Wan 2.7 + `audio_url`** | Accepte ton MP3/WAV (3-30s, ≤15MB), pilote le lip-sync |
| Dubs multi-langues (même image, audio diff/call) | **Wan 2.7 + `audio_url`** | Même shot, swap `audio_url` |
| Multi-modal (image + vidéo ref + audio ref) | **Seedance 2.0 Pro** | Jusqu'à 9 image refs, 3 vidéo refs, 3 audio refs |
| Brand narrative (perso ref + scène ref + voix ref) | **Seedance 2.0 Pro** | Image=identité, vidéo=scène, audio=voix |
| **Default si pas précisé** | **HappyHorse 1.0 I2V** | Meilleur all-round + audio natif |

---

## ⚙️ Prérequis

```bash
# 1. CLI
npm i -g @runcomfy/cli

# 2. Auth (browser device-code flow)
runcomfy login

# OU en CI / containers
export RUNCOMFY_TOKEN="<token>"
```

**Image source** : JPEG/PNG/WebP, min 300px, ≤10MB, aspect 1:2.5 à 2.5:1 (HappyHorse).

---

## 🐎 Route 1 — HappyHorse 1.0 I2V (default)

**Model** : `happyhorse/happyhorse-1-0/image-to-video` · **Arena rank** : #1 (Elo 1392)

### Schéma

| Champ | Type | Requis | Default | Notes |
|---|---|---|---|---|
| `image_url` | string | ✅ | — | JPEG/JPG/PNG/WEBP, min 300px, aspect 1:2.5–2.5:1, ≤10MB |
| `prompt` | string | ✅ | — | ≤5000 non-CJK / 2500 CJK chars. **Motion / camera / lighting** |
| `resolution` | enum | ❌ | `1080P` | `720P` ou `1080P` |
| `duration` | int | ❌ | 5 | 3–15 secondes |
| `seed` | int | ❌ | 0 | Pour comparer variantes |
| `watermark` | bool | ❌ | true | Watermark provider |

> Output aspect = input aspect. Pas de reframing indépendant.

### Invocation

```bash
runcomfy run happyhorse/happyhorse-1-0/image-to-video \
  --input '{
    "image_url": "https://.../portrait.jpg",
    "prompt": "Gentle camera drift around the subject'\''s face, subtle breathing motion, identity-stable features, soft natural light."
  }' \
  --output-dir <absolute/path>
```

### Prompting tips

- **Commencer par les verbes de mouvement** : "drift", "dolly in", "orbit", "tilt up", "reveal", "blink", "breathe"
- **Ne pas redécrire l'image** — le modèle la voit. Focus sur ce qui change
- **Buts de préservation explicites** : "identity-stable features", "packaging unchanged", "background geometry stable"
- **Évolution de l'éclairage** : "rim light intensifying", "shadows shortening as camera rises"
- **Un seul beat par clip** : un seul mouvement primaire (orbit OU dolly OU tilt OU character action)

---

## 🎙️ Route 2 — Wan 2.7 + `audio_url` (lip-sync custom)

**Model** : `wan-ai/wan-2-7/text-to-video` (PAS `/image-to-video` — c'est le t2v endpoint qui accepte `audio_url`)

> 💡 Pour de l'i2v pure (image animée par prompt seul), préférer **HappyHorse**. Wan 2.7 est utile uniquement quand le user a un audio track custom à lip-syncer.

### Schéma

| Champ | Type | Requis | Default | Notes |
|---|---|---|---|---|
| `prompt` | string | ✅ | — | ≤5000 chars. Décrit la prise talking-head : framing, lighting, motion |
| `audio_url` | string | ✅ (pour lip-sync) | — | WAV/MP3, 3–30s, ≤15MB. **Pilote le lip-sync** |
| `aspect_ratio` | enum | ❌ | `16:9` | `16:9`, `9:16`, `1:1`, `4:3`, `3:4` |
| `resolution` | enum | ❌ | `1080p` | `720p` ou `1080p` |
| `duration` | enum | ❌ | `5` | 2–15 (secondes entières). **Match audio length** |
| `negative_prompt` | string | ❌ | — | Issues concrètes à éviter (ex: "no subtitles, no flicker") |
| `seed` | int | ❌ | — | Reproducibility |

### Invocation

```bash
runcomfy run wan-ai/wan-2-7/text-to-video \
  --input '{
    "prompt": "Medium close-up of a confident spokesperson in a softly-lit recording booth, leaning slightly toward the camera, locked tripod, shallow DOF, warm key light from camera-left.",
    "audio_url": "https://.../voiceover-en.mp3",
    "duration": 12,
    "aspect_ratio": "9:16"
  }' \
  --output-dir <absolute/path>
```

### Prompting tips

- **Décrire la prise talking-head** — framing, lighting, lens feel. L'audio pilote le lip-sync, le prompt construit le frame
- **`duration` matche la durée audio** — silence après si trop long
- **`negative_prompt`** pour les bugs : `"no subtitles, no flicker, no distorted hands"`
- **Multi-langue** : même prompt, swap `audio_url`. Lock seed pour cohérence visuelle

---

## 🎬 Route 3 — Seedance 2.0 Pro (multi-modal)

**Model** : `bytedance/seedance-v2/pro`

À utiliser quand le user veut **un seul clip** combinant : **image sujet** + **scène de vidéo ref** + **voix de audio ref**.

### Schéma (champs i2v-relevants)

| Champ | Type | Requis | Default | Notes |
|---|---|---|---|---|
| `prompt` | string | ✅ | — | CN ≤500 chars OU EN ≤1000 mots |
| `image_url` | array | ✅ (i2v) | `[]` | 0–9 images. **Premier = sujet principal** |
| `video_url` | array | ❌ | `[]` | 0–3 clips ref (MP4/MOV), 2–15s chacun |
| `audio_url` | array | ❌ | `[]` | 0–3 audios ref (WAV/MP3), 2–15s, <15MB chacun |
| `aspect_ratio` | enum | ❌ | `adaptive` | `adaptive`, `16:9`, `9:16`, `4:3`, `3:4`, `1:1`, `21:9` |
| `duration` | int | ❌ | 5 | 4–15 (secondes entières) |
| `resolution` | enum | ❌ | `720p` | `480p` ou `720p` |
| `generate_audio` | bool | ❌ | true | Speech/SFX/music synchronisé in-pass |
| `seed` | int | ❌ | — | Reproducibility |

### Invocation

```bash
runcomfy run bytedance/seedance-v2/pro \
  --input '{
    "prompt": "Subject from image 1 walks through the café in video 1, voice tone matches audio 1. Medium close-up, slow push-in, warm light, gentle ambience.",
    "image_url": ["https://.../subject.jpg"],
    "video_url": ["https://.../cafe-locked-shot.mp4"],
    "audio_url": ["https://.../voice-tone.mp3"],
    "duration": 8
  }' \
  --output-dir <absolute/path>
```

### Prompting tips

- **Division image vs texte** : `image_url` pour ce qui doit rester stable (visage, costume, brand), `prompt` pour ce qui doit évoluer (action, mood, lighting)
- **Numéroter les refs** : `"subject from image 1, lighting from video 1, voice from audio 1"` — Seedance route correctement
- **Specs media ref** : vidéos / audios 2–15s, audio <15MB
- **Pas de styles radicalement différents** entre les refs (watercolor vs photoreal → output drift)

---

## ⚠️ Limitations

- **Chaque route hérite des limites de son modèle** : HappyHorse 15s max + aspect=input ; Wan 2.7 15s max + audio 3-30s/15MB ; Seedance plafonné 720p ici + 15s max
- **Pas de blending multi-route** : 1 seul modèle par call. Si user veut HappyHorse anim + Wan lip-sync dans le même clip → 2 calls + stitch (hors scope)
- **Variant spécifique nommé par user** (Wan 2.6, Seedance 1.5) → router vers le skill brand (`wan-2-7`, `seedance-v2`) au lieu de forcer ici

---

## 🚨 Exit codes

| Code | Sens |
|---|---|
| 0 | Success |
| 64 | Mauvais args CLI |
| 65 | Mauvais JSON input / schema mismatch |
| 69 | Upstream 5xx |
| 75 | Retryable : timeout / 429 |
| 77 | Pas signed in ou token rejeté |

Doc complète : https://docs.runcomfy.com/cli/troubleshooting

---

## 🔄 How it works (sous le capot)

1. Le skill classifie l'intent user
2. Choisit un des 3 modèles (HappyHorse / Wan 2.7 / Seedance Pro)
3. Invoque `runcomfy run <model_id>` avec le JSON correspondant
4. Le CLI POST au Model API, poll la request, download le résultat dans `--output-dir`
5. `Ctrl-C` cancel la request remote avant exit

---

## 🔒 Security & Privacy

- **Token storage** : `runcomfy login` écrit le token dans `~/.config/runcomfy/token.json` (mode 0600, owner-only). Variable `RUNCOMFY_TOKEN` bypasse complètement le fichier
- **Prompt** : transmis en JSON au CLI via `--input`, **PAS** de shell-expand → pas de surface d'injection shell
- **Third-party content** : les URLs (image/mask/video) sont fetchées par les serveurs RunComfy, pas par le CLI local. **Image-based prompt injection est un risque connu** pour tout modèle image-edit / video-edit
- **Outbound endpoints** : uniquement `model-api.runcomfy.net` + `*.runcomfy.net` / `*.runcomfy.com` (whitelist download). Pas de telemetry, pas de callbacks
- **Cap download** : CLI abort tout fichier > 2 GiB (anti disk-fill)
