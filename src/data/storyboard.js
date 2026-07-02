// --- Storyboard: maps every lyric line (by index) to its staging -----------
//
// Keyed by line index, NOT by lyric text, so the chorus/post-chorus repeats can
// each play through a different scene as the song develops. Each entry carries:
//   scene       — which ComeOverVisuals scene renders
//   cue         — the semantic moment that drives the canvas at line start
//   transition  — how we cut into this scene
//   intensity   — 0..1 strength of the line's events
//   wordCues    — { sourceWordIndex: cueType } for mid-line moments (e.g. knock)
//   display     — { breakAfter, translationParts } segmentation overrides
//   timing      — { wordBeats, tailBeats } pacing overrides (optional)

export const STORYBOARD = [
  // chorus 1 — empty rainy night, calling out, lost
  { scene: 'street', cue: 'night-fall', transition: 'warm-fade', intensity: 0.5, display: { breakAfter: [4] } }, // 0
  { scene: 'alley', cue: 'lost-drift', transition: 'dissolve', intensity: 0.5 }, // 1 — the back alley
  { scene: 'crossroad', cue: 'lost-echo', transition: 'dissolve', intensity: 0.55 }, // 2 — the fork with no answer
  { scene: 'room', cue: 'apology', transition: 'warm-fade', intensity: 0.55, display: { breakAfter: [5] } }, // 3
  { scene: 'overpass', cue: 'lost-drift', transition: 'dissolve', intensity: 0.5 }, // 4 — traffic streaming below
  { scene: 'busstop', cue: 'approach-door', transition: 'light-wipe', intensity: 0.6 }, // 5 — the bus that never comes

  // verse 1 — alone, phone glow, time passed, burying memories
  { scene: 'room', cue: 'phone-glow', transition: 'warm-fade', intensity: 0.55, display: { breakAfter: [5] } }, // 6
  { scene: 'memory', cue: 'bury-memory', transition: 'dissolve', intensity: 0.55, display: { breakAfter: [3] } }, // 7 — burying the keepsake
  { scene: 'clocktower', cue: 'late-clock', transition: 'dissolve', intensity: 0.55, display: { breakAfter: [3] } }, // 8 — beneath the racing clock
  { scene: 'bench', cue: 'rewind-restart', transition: 'warm-fade', intensity: 0.6, display: { breakAfter: [2] } }, // 9 — the two of them, remembered

  // chorus 2 — out walking the city
  { scene: 'citywalk', cue: 'night-fall', transition: 'dissolve', intensity: 0.5, display: { breakAfter: [4] } }, // 10
  { scene: 'store', cue: 'lost-drift', transition: 'dissolve', intensity: 0.5 }, // 11 — the last lit storefront
  { scene: 'platform', cue: 'lost-echo', transition: 'dissolve', intensity: 0.55 }, // 12 — the express passes him by
  { scene: 'window', cue: 'apology', transition: 'warm-fade', intensity: 0.55, display: { breakAfter: [5] } }, // 13 — rain down the glass
  { scene: 'house', cue: 'approach-door', transition: 'light-wipe', intensity: 0.65 }, // 14
  { scene: 'house', cue: 'arrive-door', transition: 'light-wipe', intensity: 0.7 }, // 15

  // post-chorus 1 — "over, over" at the door
  { scene: 'house', cue: 'echo-over', transition: 'dissolve', intensity: 0.6 }, // 16
  { scene: 'house', cue: 'echo-over', transition: 'dissolve', intensity: 0.55 }, // 17
  { scene: 'house', cue: 'love-fade', transition: 'warm-fade', intensity: 0.55, display: { breakAfter: [3] } }, // 18
  { scene: 'house', cue: 'door-open', transition: 'light-wipe', intensity: 0.7, display: { breakAfter: [4] }, wordCues: { 7: 'knock' } }, // 19

  // rap — knocking, blood, neon, smoke
  { scene: 'house', cue: 'knock', transition: 'light-wipe', intensity: 0.9, display: { breakAfter: [2] }, wordCues: { 0: 'knock', 2: 'knock' } }, // 20
  { scene: 'neon', cue: 'blood-pulse', transition: 'flash-cut', intensity: 0.8, wordCues: { 1: 'blood-pulse' } }, // 21
  { scene: 'vigil', cue: 'phone-check', transition: 'dissolve', intensity: 0.55 }, // 22 — watching from across the road
  { scene: 'puddle', cue: 'question', transition: 'rain-wipe', intensity: 0.6, display: { breakAfter: [4] } }, // 23 — asking his reflection
  { scene: 'rooftop', cue: 'ghost-trail', transition: 'dissolve', intensity: 0.6, display: { breakAfter: [2] } }, // 24
  { scene: 'flashbeam', cue: 'dust-beam', transition: 'light-wipe', intensity: 0.6, display: { breakAfter: [3] } }, // 25 — dust in the flashlight
  { scene: 'storm', cue: 'smoke', transition: 'rain-wipe', intensity: 0.65, display: { breakAfter: [3] } }, // 26
  { scene: 'storm', cue: 'metaphor-distort', transition: 'flash-cut', intensity: 0.6 }, // 27

  // chorus 3 — on a night train, reflecting, heading back
  { scene: 'phonebooth', cue: 'phone-glow', transition: 'dissolve', intensity: 0.5, display: { breakAfter: [4] } }, // 28 — calling from the booth
  { scene: 'train', cue: 'lost-drift', transition: 'dissolve', intensity: 0.5 }, // 29
  { scene: 'train', cue: 'lost-echo', transition: 'dissolve', intensity: 0.55 }, // 30
  { scene: 'train', cue: 'apology-reflection', transition: 'warm-fade', intensity: 0.55, display: { breakAfter: [5] } }, // 31
  { scene: 'train', cue: 'return-route', transition: 'light-wipe', intensity: 0.55 }, // 32
  { scene: 'house', cue: 'approach-door', transition: 'light-wipe', intensity: 0.65 }, // 33

  // post-chorus 2 — back at the door
  { scene: 'house', cue: 'echo-over', transition: 'dissolve', intensity: 0.6 }, // 34
  { scene: 'house', cue: 'echo-over', transition: 'dissolve', intensity: 0.55 }, // 35
  { scene: 'house', cue: 'love-fade', transition: 'warm-fade', intensity: 0.55, display: { breakAfter: [3] } }, // 36
  { scene: 'house', cue: 'door-open', transition: 'light-wipe', intensity: 0.7, display: { breakAfter: [4] }, wordCues: { 7: 'knock' } }, // 37

  // bridge / final rap — heartbeat, cliff, hurt, savior
  { scene: 'house', cue: 'heartbeat-knock', transition: 'light-wipe', intensity: 0.95, display: { breakAfter: [4] }, wordCues: { 0: 'heartbeat-knock', 1: 'heartbeat-knock' } }, // 38
  { scene: 'cliff', cue: 'cliff-wind', transition: 'dissolve', intensity: 0.65, display: { breakAfter: [3] } }, // 39 — at the cliff edge
  { scene: 'storm', cue: 'hurt-storm', transition: 'rain-wipe', intensity: 0.75, display: { breakAfter: [3] } }, // 40
  { scene: 'sunset', cue: 'rescue-light', transition: 'warm-fade', intensity: 0.7, display: { breakAfter: [3] } }, // 41
  { scene: 'sunset', cue: 'page-turn', transition: 'warm-fade', intensity: 0.6, display: { breakAfter: [2] } }, // 42
  { scene: 'mirror', cue: 'pain-fade', transition: 'warm-fade', intensity: 0.6, display: { breakAfter: [3] } }, // 43 — the fought self dissolving
  { scene: 'boat', cue: 'row-forward', transition: 'dissolve', intensity: 0.65, display: { breakAfter: [3] }, wordCues: { 5: 'row-forward', 6: 'row-forward' } }, // 44
  { scene: 'dawn', cue: 'final-open', transition: 'warm-fade', intensity: 1.0, display: { breakAfter: [4] } }, // 45
];

// Attach staging to lyric lines (keyed by index) and give every line a stable id.
export function attachStoryboard(lines) {
  if (lines.length !== STORYBOARD.length) {
    throw new Error(
      `Storyboard mismatch: ${STORYBOARD.length} cues for ${lines.length} lyric lines`,
    );
  }

  return lines.map((line, lineIndex) => {
    const entry = STORYBOARD[lineIndex];
    return {
      ...line,
      id: line.id ?? `line-${lineIndex}`,
      visual: {
        transition: 'dissolve',
        intensity: 0.6,
        wordCues: {},
        ...entry,
      },
    };
  });
}

// The set of scenes/cues referenced — used by tests to guard against typos.
export const STORYBOARD_SCENES = [...new Set(STORYBOARD.map((e) => e.scene))];
export const STORYBOARD_CUES = [...new Set(STORYBOARD.map((e) => e.cue))];
