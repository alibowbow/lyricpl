import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Music4 } from 'lucide-react';
import ComeOverVisuals from './components/ComeOverVisuals.jsx';
import { SONG, buildWords, buildTiming, TRANSLATION_LANGS, RTL_LANGS } from './data/lyrics.js';

const SUNG = '#fcd34d'; // warm amber for the original line
const SUNG_RO = '#67e8f9'; // cool cyan for the romanization
const TOTAL = SONG.lines.length;
// Keep the on-screen subtitle list short so it never pushes the controls off
// the bottom of the screen. EN shows as a primary line; these show below it.
const GRID_LANGS = ['JA', 'ZH', 'ES', 'FR', 'RU', 'AR'].filter((c) => TRANSLATION_LANGS.includes(c));

const clampBpm = (v) => Math.min(200, Math.max(40, parseInt(v, 10) || SONG.defaultBpm));

// Which visualizer scene each lyric line belongs to — 12 distinct scenes
// (day and night) so the song cuts through many different backdrops.
function sceneForLine(i) {
  if (i <= 3) return 'street'; // chorus 1 — rainy night, heading to you
  if (i <= 7) return 'room'; // verse 1 — alone, phone glowing
  if (i <= 11) return 'day'; // daytime — brighter days / time has passed
  if (i <= 15) return 'citywalk'; // daytime city
  if (i <= 19) return 'house'; // "would you open up if I knocked on your door"
  if (i <= 23) return 'neon'; // "knockin' on your door" — neon rain
  if (i <= 27) return 'storm'; // rap — "smoke in black night, we so dead"
  if (i <= 31) return 'rooftop'; // night rooftop over the city
  if (i <= 35) return 'train'; // night train
  if (i <= 39) return 'boat'; // bridge — rowing, "난 노 저어"
  if (i <= 43) return 'sunset'; // warm resolve
  return 'dawn'; // "it's not over" — the door opens
}

// A karaoke word that warms up once it has been "sung".
const Word = ({ text, on, color, dim }) => (
  <motion.span
    className="relative inline-block"
    initial={false}
    animate={{ color: on ? color : dim, opacity: on ? 1 : 0.85 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    {text}&nbsp;
  </motion.span>
);

export default function App() {
  const [lineIndex, setLineIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [bpm, setBpm] = useState(SONG.defaultBpm);
  const [visualKey, setVisualKey] = useState(0);

  const timers = useRef([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const line = SONG.lines[lineIndex];
  const words = useMemo(() => buildWords(line), [line]);

  // Translations to show: the EN "primary" row, then the other-language grid.
  // Any translation identical to the original line is hidden (e.g. EN for
  // English-sung lines), avoiding duplicate text.
  const primaryEn = line.t.EN && line.t.EN !== line.o ? line.t.EN : null;
  const otherLangs = useMemo(
    () => GRID_LANGS.filter((c) => line.t[c] && line.t[c] !== line.o),
    [line],
  );

  // Beat-driven karaoke engine: highlight each word, then advance the line.
  useEffect(() => {
    clearTimers();
    if (!isPlaying) return;
    const beatMs = 60000 / clampBpm(bpm);
    const timing = buildTiming(words.length);
    let delay = 0;
    timing.forEach((beats, i) => {
      timers.current.push(setTimeout(() => setWordIndex(i), delay));
      delay += beats * beatMs;
    });
    timers.current.push(
      setTimeout(() => {
        setLineIndex((prev) => (prev + 1) % TOTAL);
        setWordIndex(-1);
      }, delay),
    );
    return clearTimers;
  }, [lineIndex, isPlaying, bpm, words, clearTimers]);

  const goToLine = useCallback(
    (idx) => {
      clearTimers();
      setLineIndex(((idx % TOTAL) + TOTAL) % TOTAL);
      setWordIndex(-1);
    },
    [clearTimers],
  );

  const restart = useCallback(() => {
    clearTimers();
    setLineIndex(0);
    setWordIndex(-1);
    setIsPlaying(true);
    setVisualKey((k) => k + 1);
  }, [clearTimers]);

  // Keyboard: space = play/pause, ←/→ = prev/next line, R = restart.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        goToLine(lineIndex + 1);
      } else if (e.code === 'ArrowLeft') {
        goToLine(lineIndex - 1);
      } else if (e.code === 'KeyR') {
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lineIndex, goToLine, restart]);

  const onBpmBlur = (e) => setBpm(clampBpm(e.target.value));

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-slate-950 text-center select-none">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-black" />

        {/* --- Visualizer --- */}
        <div className="relative z-10 h-[34%] w-full flex-shrink-0">
          <ComeOverVisuals
            key={visualKey}
            isPlaying={isPlaying}
            pulse={lineIndex * 1000 + wordIndex}
            scene={sceneForLine(lineIndex)}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-slate-950" />
          <div className="pointer-events-none absolute left-4 top-4 text-left">
            <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {SONG.title}
            </h1>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-200/80">{SONG.artist}</p>
          </div>
        </div>

        {/* --- Lyrics (karaoke + multilingual subtitles) --- */}
        <div className="relative z-10 flex min-h-0 flex-grow flex-col px-4 pt-2">
          {/* Original + romanization, karaoke-highlighted */}
          <div
            className="flex-shrink-0 pb-2 text-center"
            style={{ textShadow: '0 4px 18px rgba(0,0,0,0.85)' }}
          >
            <p className="text-xl font-bold leading-snug tracking-tight md:text-2xl">
              {words.map((wd, i) => (
                <Word key={`o-${i}`} text={wd.o} on={i <= wordIndex} color={SUNG} dim="rgba(255,255,255,0.8)" />
              ))}
            </p>
            {line.r && (
              <p className="mt-1 text-sm font-medium leading-snug md:text-base">
                {words.map((wd, i) => (
                  <Word key={`r-${i}`} text={wd.r} on={i <= wordIndex} color={SUNG_RO} dim="rgba(255,255,255,0.4)" />
                ))}
              </p>
            )}
            {primaryEn && <p className="mt-1.5 text-sm leading-snug text-white/85">{primaryEn}</p>}
          </div>

          {/* Multilingual subtitles — one clean, truncated line per language */}
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-white/10 pt-1.5">
            <ul className="space-y-0.5 text-left">
              {otherLangs.map((code) => (
                <li key={code} className="flex items-baseline gap-2">
                  <span className="w-8 flex-shrink-0 text-right text-[11px] font-bold text-amber-200/70">{code}</span>
                  <span
                    dir={RTL_LANGS.includes(code) ? 'rtl' : 'ltr'}
                    title={line.t[code]}
                    className="min-w-0 flex-1 truncate text-[13px] leading-relaxed text-white/85"
                  >
                    {line.t[code]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- Controls --- */}
        <div className="relative z-20 flex-shrink-0 px-5 pb-6 pt-2">
          <div className="mx-auto mb-3 flex max-w-xs items-center gap-2">
            <span className="w-9 text-right text-[11px] font-mono text-white/45">
              {String(lineIndex + 1).padStart(2, '0')}
            </span>
            <div className="h-1 flex-grow overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                animate={{ width: `${((lineIndex + 1) / TOTAL) * 100}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
            <span className="w-9 text-left text-[11px] font-mono text-white/45">{String(TOTAL).padStart(2, '0')}</span>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/45 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <button onClick={() => goToLine(lineIndex - 1)} className="text-white/70 transition-colors hover:text-white" aria-label="Previous line">
                <SkipBack size={22} />
              </button>
              <button onClick={() => setIsPlaying((p) => !p)} className="text-white transition-transform hover:scale-110" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={30} /> : <Play size={30} />}
              </button>
              <button onClick={() => goToLine(lineIndex + 1)} className="text-white/70 transition-colors hover:text-white" aria-label="Next line">
                <SkipForward size={22} />
              </button>
              <button onClick={restart} className="text-white/70 transition-colors hover:text-white" aria-label="Restart">
                <RotateCcw size={20} />
              </button>
              <div className="mx-1 h-7 w-px bg-white/15" />
              <div className="flex items-center gap-1.5">
                <Music4 className="text-white/55" size={20} />
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  onBlur={onBpmBlur}
                  className="w-12 bg-transparent text-center font-mono text-base text-white focus:outline-none"
                  aria-label="Beats per minute"
                />
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">bpm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
