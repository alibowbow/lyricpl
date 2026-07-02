import test from 'node:test';
import assert from 'node:assert/strict';

import { SONG, buildWords } from '../data/lyrics.js';
import {
  STORYBOARD,
  STORYBOARD_CUES,
  attachStoryboard,
} from '../data/storyboard.js';
import {
  buildAllSegments,
  buildDisplaySegments,
  splitBalancedText,
  visualUnits,
} from './lyricSegments.js';

const ALLOWED_SCENES = [
  'street', 'day', 'citywalk', 'room', 'train', 'rooftop',
  'house', 'neon', 'storm', 'boat', 'sunset', 'dawn',
  'phonebooth', 'memory', 'cliff', 'clocktower', 'bench', 'flashbeam',
];
const EXTRA_WORD_CUES = ['beat', 'step', 'door-pulse'];

const LINES = attachStoryboard(SONG.lines);
const { segments, lineToSegments } = buildAllSegments(LINES);
const norm = (s) => String(s ?? '').replace(/\s+/gu, '');

test('1. storyboard has one cue per lyric line', () => {
  assert.equal(STORYBOARD.length, SONG.lines.length);
});

test('2. every line produces at least one display segment', () => {
  LINES.forEach((line, i) => {
    const segs = buildDisplaySegments(line, i);
    assert.ok(segs.length >= 1, `line ${i} produced no segments`);
    assert.ok(segs.length <= 3, `line ${i} produced ${segs.length} segments`);
  });
});

test('3. every segment original text is non-empty', () => {
  for (const seg of segments) {
    assert.ok(seg.o && seg.o.trim().length > 0, `empty segment ${seg.id}`);
  }
});

test('4. original & romanization stay index-aligned across segments', () => {
  LINES.forEach((line, i) => {
    if (line.r == null) return;
    const words = buildWords(line);
    const segs = buildDisplaySegments(line, i);
    const flat = segs.flatMap((s) => s.words);
    assert.equal(flat.length, words.length, `word count drift on line ${i}`);
    flat.forEach((w, idx) => {
      assert.equal(w.sourceWordIndex, idx, `source index drift on line ${i}`);
      assert.equal(w.o, words[idx].o);
      assert.equal(w.r, words[idx].r);
    });
    // each segment's joined o/r matches its own word slice
    for (const s of segs) {
      assert.equal(s.o, s.words.map((w) => w.o).join(' '));
      assert.equal(s.r, s.words.map((w) => w.r).join(' '));
    }
  });
});

test('5. translation parts recombine into the original translation', () => {
  LINES.forEach((line, i) => {
    const segs = buildDisplaySegments(line, i);
    for (const lang of Object.keys(line.t)) {
      const rejoined = norm(segs.map((s) => s.t[lang]).join(''));
      assert.equal(rejoined, norm(line.t[lang]), `${lang} lost on line ${i}`);
    }
  });
});

test('6. no line exceeds the 3-segment maximum', () => {
  for (const segs of lineToSegments) {
    assert.ok(segs.length <= 3);
  }
});

test('7. splitBalancedText never drops words', () => {
  const samples = [
    ["When an empty-feeling night falls, I call out to you again", 3, 'en'],
    ['当空荡荡的夜晚降临，我又这样呼唤你', 2, 'zh'],
    ['がらんとした夜が来ると、こうしてまた君を呼ぶ', 3, 'ja'],
    ['เมื่อค่ำคืนอันว่างเปล่ามาเยือน ฉันก็เรียกหาเธออีกครั้งแบบนี้', 2, 'th'],
  ];
  for (const [text, n, locale] of samples) {
    const parts = splitBalancedText(text, n, locale);
    assert.ok(parts.length >= 1 && parts.length <= n);
    assert.equal(norm(parts.join('')), norm(text), `dropped chars: ${text}`);
  }
});

test('8. RTL (Arabic) translation data is preserved', () => {
  LINES.forEach((line, i) => {
    if (!line.t.AR) return;
    const segs = buildDisplaySegments(line, i);
    assert.equal(norm(segs.map((s) => s.t.AR).join('')), norm(line.t.AR), `AR lost on line ${i}`);
  });
});

test('9. no segment references an unknown scene or cue', () => {
  const knownWordCues = new Set([...STORYBOARD_CUES, ...EXTRA_WORD_CUES]);
  for (const seg of segments) {
    assert.ok(ALLOWED_SCENES.includes(seg.visual.scene), `bad scene ${seg.visual.scene}`);
    assert.ok(STORYBOARD_CUES.includes(seg.visual.cue), `bad cue ${seg.visual.cue}`);
    for (const cue of Object.values(seg.visual.wordCues)) {
      assert.ok(knownWordCues.has(cue), `bad word cue ${cue}`);
    }
  }
});

test('10. visual-event ids are stable and unique per segment/word', () => {
  const ids = new Set();
  for (const seg of segments) {
    const count = Math.max(1, seg.words.length);
    for (let w = 0; w < count; w += 1) {
      const sourceIndex = seg.words[w]?.sourceWordIndex;
      const cue = seg.visual.wordCues[sourceIndex] ?? (w === 0 ? seg.visual.cue : 'beat');
      const id = `${seg.id}:${w}:${cue}`;
      assert.ok(!ids.has(id), `duplicate visual id ${id}`);
      ids.add(id);
    }
  }
  assert.ok(ids.size > 0);
});

test('visualUnits weights wide glyphs heavier than latin', () => {
  assert.ok(visualUnits('한국어') > visualUnits('abc'));
});
