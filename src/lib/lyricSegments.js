// --- Lyric segmentation utilities (pure, unit-testable) --------------------
//
// Splits a single lyric line into 1–3 short "display segments" so that the
// original, romanization and every translation advance together and each
// fragment fits on a single on-screen line. Original and romanization are cut
// on the SAME word ranges; translations are balance-split into the same number
// of parts. Nothing is ever dropped — concatenating the parts reproduces the
// source text (modulo whitespace).

import { buildWords } from '../data/lyrics.js';

// Hangul, Kana, CJK ideographs and Thai — glyphs that render roughly twice as
// wide as Latin letters. Written as explicit code-point ranges for clarity.
const WIDE_CHAR =
  /[ᄀ-ᇿ㄰-㆏가-힯぀-ヿ㐀-鿿฀-๿]/u;

const END_PUNCTUATION = /[,.!?;:…，。！？、]$/u;

// Approximate the rendered width of a string in abstract "units" (a CJK glyph
// is far wider than a Latin letter, whitespace far narrower).
export function visualUnits(text = '') {
  return Array.from(text).reduce((total, char) => {
    if (/\s/u.test(char)) return total + 0.35;
    if (WIDE_CHAR.test(char)) return total + 1.8;
    if (/[A-Z0-9]/u.test(char)) return total + 1.1;
    if (/['"’“”()[\]{},.!?;:…-]/u.test(char)) return total + 0.45;
    return total + 1;
  }, 0);
}

const LOCALE_BY_LANG = { JA: 'ja', ZH: 'zh', TH: 'th', KO: 'ko' };
export const localeForLang = (lang) => LOCALE_BY_LANG[lang] ?? 'en';

function tokenizeText(text, locale = 'en') {
  const value = String(text ?? '').trim();
  if (!value) return { tokens: [], joiner: '' };

  // Space-delimited languages keep whole words.
  if (/\s/u.test(value)) {
    return { tokens: value.split(/\s+/u).filter(Boolean), joiner: ' ' };
  }

  // CJK / Thai etc. — use word segmentation when available.
  if (globalThis.Intl?.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
      const tokens = Array.from(segmenter.segment(value))
        .map(({ segment }) => segment)
        .filter((segment) => segment.trim());
      if (tokens.length > 0) return { tokens, joiner: '' };
    } catch {
      /* fall through to per-character */
    }
  }

  return { tokens: Array.from(value), joiner: '' };
}

// Split arbitrary text into `requestedPartCount` balanced parts without
// cutting a word, preferring to break right after sentence punctuation.
export function splitBalancedText(text, requestedPartCount, locale = 'en') {
  const { tokens, joiner } = tokenizeText(text, locale);

  if (tokens.length === 0) return [];
  if (requestedPartCount <= 1) return [tokens.join(joiner)];

  const partCount = Math.min(requestedPartCount, tokens.length);
  const result = [];
  let start = 0;

  for (let part = 0; part < partCount; part += 1) {
    const remainingParts = partCount - part;

    if (remainingParts === 1) {
      result.push(tokens.slice(start).join(joiner));
      break;
    }

    const maxEnd = tokens.length - (remainingParts - 1);
    const remainingText = tokens.slice(start).join(joiner);
    const targetUnits = visualUnits(remainingText) / remainingParts;

    let bestEnd = start + 1;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let end = start + 1; end <= maxEnd; end += 1) {
      const candidate = tokens.slice(start, end).join(joiner);
      let score = Math.abs(visualUnits(candidate) - targetUnits);

      if (END_PUNCTUATION.test(candidate)) score -= targetUnits * 0.3;
      if (visualUnits(candidate) < targetUnits * 0.45) score += targetUnits;

      if (score < bestScore) {
        bestScore = score;
        bestEnd = end;
      }
    }

    result.push(tokens.slice(start, bestEnd).join(joiner));
    start = bestEnd;
  }

  return result.map((part) => part.trim()).filter(Boolean);
}

// Per-word beat estimate (punctuation = a small breath, long/last word = hold).
export function inferWordBeats(words) {
  return words.map((word, index) => {
    const value = word.o ?? '';
    let beats = 1;
    if (/[,，、]$/u.test(value)) beats += 0.25;
    if (/[.!?。！？…]$/u.test(value)) beats += 0.6;
    if (visualUnits(value) >= 8) beats += 0.25;
    if (index === words.length - 1) beats += 0.75;
    return beats;
  });
}

// Choose word-break points automatically when no manual breakAfter is given.
function autoBreakIndices(words, maxUnits) {
  const breaks = [];
  let acc = 0;
  for (let i = 0; i < words.length; i += 1) {
    acc += visualUnits(words[i].o) + 0.6;
    const isLast = i === words.length - 1;
    const punct = END_PUNCTUATION.test(words[i].o);
    if (!isLast && (acc >= maxUnits || (punct && acc >= maxUnits * 0.62))) {
      breaks.push(i);
      acc = 0;
    }
  }
  return breaks;
}

function originalIsWide(words) {
  const wide = words.filter((w) => WIDE_CHAR.test(w.o)).length;
  return wide >= words.length * 0.3;
}

// Build the ordered display segments for one storyboard-attached line.
export function buildDisplaySegments(line, lineIndex) {
  const words = buildWords(line); // [{ o, r }]
  const hasR = line.r != null;
  const visual = line.visual ?? {};
  const display = visual.display ?? {};
  const timing = visual.timing ?? {};

  // 1. word-break points: manual override wins, else automatic balancing.
  const maxUnits = originalIsWide(words) ? 19 : 30;
  let breaks = Array.isArray(display.breakAfter)
    ? [...display.breakAfter]
    : autoBreakIndices(words, maxUnits);
  breaks = Array.from(new Set(breaks))
    .filter((b) => Number.isInteger(b) && b >= 0 && b < words.length - 1)
    .sort((a, b) => a - b)
    .slice(0, 2); // never more than 3 segments

  // 2. word ranges [start, end] inclusive.
  const ranges = [];
  let start = 0;
  for (const b of breaks) {
    ranges.push([start, b]);
    start = b + 1;
  }
  ranges.push([start, words.length - 1]);
  const segmentCount = ranges.length;

  // 3. balance-split each translation into the same number of parts.
  // For a translation identical to the sung line (English-sung lines), reuse the
  // original's exact word ranges so it stays aligned AND the UI can dedupe it.
  const segOStrings = ranges.map(([f, to]) =>
    words.slice(f, to + 1).map((w) => w.o).join(' '),
  );
  const oNorm = words.map((w) => w.o).join(' ').replace(/\s+/gu, '');
  const langs = Object.keys(line.t ?? {});
  const translationParts = {};
  for (const lang of langs) {
    const manual = display.translationParts?.[lang];
    const matchesOriginal =
      line.t[lang] && String(line.t[lang]).replace(/\s+/gu, '') === oNorm;
    let parts =
      manual ??
      (matchesOriginal
        ? segOStrings.slice()
        : segmentCount === 1
          ? [line.t[lang]]
          : splitBalancedText(line.t[lang], segmentCount, localeForLang(lang)));
    if (parts.length < segmentCount) {
      parts = [...parts, ...Array(segmentCount - parts.length).fill('')];
    } else if (parts.length > segmentCount) {
      // merge any overflow into the final part so nothing is lost.
      parts = [
        ...parts.slice(0, segmentCount - 1),
        parts.slice(segmentCount - 1).join(' '),
      ];
    }
    translationParts[lang] = parts;
  }

  // 4. per-word beats (manual override wins).
  const allBeats = Array.isArray(timing.wordBeats)
    ? timing.wordBeats
    : inferWordBeats(words);
  const tailBeats = timing.tailBeats ?? 0.75;

  return ranges.map(([from, to], segmentIndex) => {
    const segWords = [];
    for (let i = from; i <= to; i += 1) {
      segWords.push({ o: words[i].o, r: words[i].r, sourceWordIndex: i });
    }
    const o = segWords.map((w) => w.o).join(' ');
    const r = hasR ? segWords.map((w) => w.r).join(' ') : null;

    const t = {};
    for (const lang of langs) t[lang] = translationParts[lang][segmentIndex] ?? '';

    const isLast = segmentIndex === segmentCount - 1;
    return {
      id: `${line.id ?? `line-${lineIndex}`}-s${segmentIndex}`,
      lineIndex,
      segmentIndex,
      segmentCount,
      words: segWords,
      o,
      r,
      hasR,
      t,
      visual: {
        scene: visual.scene,
        cue: visual.cue,
        transition: visual.transition ?? 'dissolve',
        intensity: visual.intensity ?? 0.6,
        wordCues: visual.wordCues ?? {},
      },
      timing: {
        wordBeats: allBeats.slice(from, to + 1),
        tailBeats: isLast ? tailBeats : 0.4,
      },
    };
  });
}

// Flatten every line into one ordered segment list, plus a line→segment map.
export function buildAllSegments(lines) {
  const segments = [];
  const lineToSegments = [];
  lines.forEach((line, lineIndex) => {
    const segs = buildDisplaySegments(line, lineIndex);
    lineToSegments[lineIndex] = [];
    for (const seg of segs) {
      lineToSegments[lineIndex].push(segments.length);
      segments.push(seg);
    }
  });
  return { segments, lineToSegments };
}
