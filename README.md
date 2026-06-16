# Come Over · Lyric Player

A beat-driven multilingual karaoke player for **BTS — "Come Over"**, inspired by
a pixel-art ("도트 그래픽") lyric-visualizer concept.

The visualizer matches the mood of the song — *an empty night, a door,
"knockin' on your door"*: a lone hooded wanderer walks through the rain to a
softly glowing door and knocks once per lyric beat.

## Features

- **Pixel-art rainy-night visualizer** rendered on `<canvas>` — twinkling stars,
  a moon, falling rain with splashes, a glowing house/door, and a wanderer who
  knocks in time with the lyrics.
- **Tri-lingual karaoke display** — each line shows the original (Korean/English
  as sung), a token-aligned romanization, and an English translation, with
  word-by-word highlighting.
- **Beat engine** — playback is driven by an adjustable BPM (40–200) rather than
  an audio file, so no copyrighted audio is bundled.
- **Controls** — play/pause, previous/next line, restart, and a BPM field.
  Keyboard: `Space` play/pause, `←`/`→` previous/next line, `R` restart.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  App.jsx                     # layout, karaoke beat engine, controls
  components/
    ComeOverVisuals.jsx       # canvas pixel-art rainy-night visualizer
  data/
    lyrics.js                 # full lyrics: original + romanization + translation
  main.jsx
  index.css
```

## Stack

React + Vite + Tailwind CSS, with `framer-motion` for the highlight animation
and `lucide-react` for the control icons.
