---
name: remotion-best-practices
description: Best practices Remotion — création de vidéos en React, animations frame-based via useCurrentFrame() + interpolate(), assets via staticFile(), composition via Sequence. À déclencher dès qu'on touche à du code Remotion ou qu'on scaffold un projet vidéo React.
source: https://github.com/remotion-dev/skills (skills/remotion/SKILL.md)
tags: remotion, video, react, animation, composition
---

# Remotion Best Practices — Skill réutilisable

> ✅ **Ce fichier est neutre** — pas de configuration projet requise. À utiliser dès qu'on rencontre du code Remotion.

---

## 🚀 Setup d'un nouveau projet

Dans un dossier vide :

```bash
npx create-video@latest --yes --blank --no-tailwind my-video
```

Remplacer `my-video` par le nom souhaité.

---

## 🚫 Interdits absolus

| ❌ Interdit | Pourquoi |
|---|---|
| **CSS `transition`** | Ne sera pas rendu par Remotion (rendu frame-par-frame, pas de timing browser) |
| **CSS `@keyframes` / `animation`** | Idem — non rendu |
| **Classes d'animation Tailwind** (`animate-*`, `transition-*`) | Idem |

Toute animation doit passer par `useCurrentFrame()` + `interpolate()`.

---

## 🎬 Designer une animation

Pattern de base : lire la frame courante, mapper vers une valeur via `interpolate`.

```tsx
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

- `[0, 2 * fps]` = frame 0 → 2 secondes (2 × fps frames)
- `[0, 1]` = valeur de sortie 0 → 1
- `extrapolateLeft/Right: "clamp"` → ne dépasse pas les bornes
- `Easing.bezier(0.16, 1, 0.3, 1)` = courbe out-expo

---

## 📦 Assets

- Placer dans `public/` à la racine du projet
- Référencer via `staticFile()`
- Ou par URL distante directement

### Image

```tsx
import { Img, staticFile } from "remotion";

<Img src={staticFile("logo.png")} style={{ width: 100, height: 100 }} />
```

### Vidéo

```tsx
import { Video } from "@remotion/media";
import { staticFile } from "remotion";

<Video src={staticFile("video.mp4")} style={{ opacity: 0.5 }} />
```

### Audio

```tsx
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

<Audio src={staticFile("audio.mp3")} />
```

### URL distante

```tsx
<Video src="https://remotion.media/video.mp4" />
```

---

## 🎞️ Séquencer le temps

- `<Sequence>` retarde + limite la durée d'un élément
- `from={N}` → délai en frames
- `durationInFrames={N}` → coupe après N frames
- `<Sequence>` est en `position: absolute fill` par défaut → utiliser `layout="none"` pour du contenu inline

```tsx
import { Sequence, AbsoluteFill, useVideoConfig } from "remotion";

const Main = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Sequence>
        <Background />
      </Sequence>
      <Sequence from={1 * fps} durationInFrames={2 * fps} layout="none">
        <Title />
      </Sequence>
      <Sequence from={2 * fps} durationInFrames={2 * fps} layout="none">
        <Subtitle />
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

## 📐 Définir la composition (`src/Root.tsx`)

```tsx
import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";

export const RemotionRoot = () => {
  return (
    <Composition
      id="MyComposition"
      component={MyComposition}
      durationInFrames={100}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};
```

### Metadata calculée dynamiquement

```tsx
import { Composition, CalculateMetadataFunction } from "remotion";

const calculateMetadata: CalculateMetadataFunction<MyCompositionProps> = async ({
  props,
  abortSignal,
}) => {
  const data = await fetch(`https://api.example.com/video/${props.videoId}`, {
    signal: abortSignal,
  }).then((r) => r.json());

  return {
    durationInFrames: Math.ceil(data.duration * 30),
    props: { ...props, videoUrl: data.url },
    width: 1080,
    height: 1080,
  };
};

<Composition
  id="MyComposition"
  component={MyComposition}
  fps={30}
  width={1080}
  height={1080}
  defaultProps={{ videoId: "abc123" }}
  calculateMetadata={calculateMetadata}
/>
```

---

## 👀 Preview & sanity check

### Studio (preview interactive)

```bash
npx remotion studio
```

### Render d'une frame unique (validation rapide)

À utiliser pour vérifier layout/couleurs/timing **sans** lancer un render complet. À skip pour les edits triviaux ou refactos.

```bash
npx remotion still [composition-id] --scale=0.25 --frame=30
```

À 30 fps, `--frame=30` = 1 seconde (`--frame` zero-based).

---

## 📚 Catalogue des rules spécialisées

À charger uniquement quand on en a besoin (depuis le repo source `rules/*.md`).

| Domaine | Rule | Pour quoi |
|---|---|---|
| **Texte** | `subtitles.md` | Captions / sous-titres |
| **Texte** | `text-animations.md` | Typo + animations de texte |
| **Texte** | `measuring-text.md` | Mesurer texte, fit-to-container, overflow |
| **Vidéo** | `videos.md` | Embed avancé, trim, volume, speed, loop, pitch |
| **Vidéo** | `get-video-duration.md` | Durée vidéo via Mediabunny |
| **Vidéo** | `get-video-dimensions.md` | Width/height vidéo via Mediabunny |
| **Vidéo** | `transparent-videos.md` | Render avec transparence |
| **Vidéo** | `trimming.md` | Couper début/fin d'animations |
| **Audio** | `audio.md` | Audio avancé (trim, volume, speed, pitch) |
| **Audio** | `audio-visualization.md` | Bars spectrum, waveforms, bass-reactive |
| **Audio** | `sfx.md` | Sound effects |
| **Audio** | `silence-detection.md` | Détection + trim silence |
| **Audio** | `voiceover.md` | TTS via ElevenLabs |
| **Audio** | `get-audio-duration.md` | Durée audio via Mediabunny |
| **Images** | `images.md` | Sizing, positioning, paths dynamiques, dimensions |
| **Images** | `gifs.md` | GIFs sync timeline |
| **Compo** | `compositions.md` | Stills, folders, default props, nested compos |
| **Compo** | `calculate-metadata.md` | Duration/dimensions/props dynamiques |
| **Compo** | `parameters.md` | Zod schema pour params |
| **Compo** | `sequencing.md` | Patterns avancés de séquençage |
| **Compo** | `transitions.md` | Patterns de transitions de scènes |
| **Compo** | `timing.md` | `interpolate` + Bézier + springs avancés |
| **Style** | `tailwind.md` | TailwindCSS dans Remotion |
| **Style** | `light-leaks.md` | Light leak overlays (`@remotion/light-leaks`) |
| **Style** | `lottie.md` | Animations Lottie embedded |
| **3D** | `3d.md` | Three.js + R3F dans Remotion |
| **Tech** | `ffmpeg.md` | Trimming, silence detection via FFmpeg |
| **Tech** | `html-in-canvas.md` | `<HtmlInCanvas>` pour effets 2D/WebGL |
| **Tech** | `measuring-dom-nodes.md` | Mesurer dimensions DOM |
| **Tech** | `maplibre.md` | Cartes complexes (flyovers, routes animées) |
| **Fonts** | `google-fonts.md` | Charger Google Fonts (recommandé) |
| **Fonts** | `local-fonts.md` | Charger fonts locales |

### Cas particulier maps

- **Simple** (peu de flyovers) → image statique de map
- **Complexe** (routes animées, flyovers) → charger `maplibre.md`

---

## ✅ Checklist rapide

- [ ] Animations via `useCurrentFrame()` + `interpolate()` (jamais CSS transition/animation)
- [ ] Assets dans `public/`, référencés via `staticFile()`
- [ ] Durations exprimées en `frames` (multiplier par `fps` pour secondes)
- [ ] `<Sequence layout="none">` pour du contenu inline (évite l'absolute fill par défaut)
- [ ] Composition définie dans `src/Root.tsx` avec id + duration + fps + width + height
- [ ] Preview via `npx remotion studio` avant render
- [ ] `npx remotion still --scale=0.25` pour valider rapidement une frame avant render complet
