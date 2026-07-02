import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Music4 } from 'lucide-react';
import ComeOverVisuals from './components/ComeOverVisuals.jsx';
import { SONG, TRANSLATION_LANGS, RTL_LANGS } from './data/lyrics.js';
import { attachStoryboard } from './data/storyboard.js';
import { buildAllSegments } from './lib/lyricSegments.js';
import { useLyricTimeline } from './hooks/useLyricTimeline.js';
import { useFitSingleLine } from './hooks/useFitSingleLine.js';

const SUNG = '#fcd34d'; // warm amber for the original line
const SUNG_RO = '#67e8f9'; // cool cyan for the romanization
const TOTAL = SONG.lines.length;
// Every translation language (beyond the EN primary row). The list area
// scrolls on small screens, so nothing gets cut — and nothing is deleted.
const GRID_LANGS = TRANSLATION_LANGS.filter((c) => c !== 'EN');

const clampBpm = (v) => Math.min(200, Math.max(40, parseInt(v, 10) || SONG.defaultBpm));

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

// A karaoke word that warms up once it has been "sung".
const Word = ({ text, on, color, dim, reduced }) => (
  <motion.span
    className="lyric-motion inline-block"
    initial={false}
    animate={{
      color: on ? color : dim,
      opacity: on ? 1 : 0.82,
      textShadow: on && !reduced ? `0 0 14px ${color}66` : '0 0 0 rgba(0,0,0,0)',
    }}
    transition={{ duration: reduced ? 0.001 : 0.18, ease: 'easeOut' }}
  >
    {text}
  </motion.span>
);

// A plain, auto-fitted single line (translations + EN).
function FitLine({ text, dir, className, style, minPx, maxPx }) {
  const ref = useFitSingleLine(text, { minPx, maxPx });
  return (
    <div ref={ref} dir={dir} className={`lyric-single-line ${className}`} style={style}>
      {text}
    </div>
  );
}

// A karaoke row (word spans) that also auto-fits to a single line.
function KaraokeLine({ words, upTo, color, dim, reduced, fitKey, className, style, minPx, maxPx, pick }) {
  const ref = useFitSingleLine(fitKey, { minPx, maxPx });
  return (
    <p ref={ref} className={`lyric-single-line ${className}`} style={style}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          {i > 0 ? ' ' : null}
          <Word text={pick(w)} on={i <= upTo} color={color} dim={dim} reduced={reduced} />
        </React.Fragment>
      ))}
    </p>
  );
}

export default function App() {
  const [bpm, setBpm] = useState(SONG.defaultBpm);
  const [visualKey, setVisualKey] = useState(0);
  const reduced = usePrefersReducedMotion();

  const lines = useMemo(() => attachStoryboard(SONG.lines), []);
  const { segments, lineToSegments } = useMemo(() => buildAllSegments(lines), [lines]);

  const {
    segment,
    lineIndex,
    wordIndex,
    sourceWordIndex,
    segmentProgress,
    songProgress,
    isPlaying,
    setIsPlaying,
    seekToLine,
    nextLine,
    previousLine,
    restart,
  } = useLyricTimeline({ segments, lineToSegments, bpm, initialPlaying: true });

  // A semantic event for the canvas: word-level cue → line cue (on word 0) →
  // generic "beat". The id changes per segment/word so repeats still register.
  const visualEvent = useMemo(() => {
    if (!segment) return null;
    const cue =
      segment.visual.wordCues?.[sourceWordIndex] ??
      (wordIndex === 0 ? segment.visual.cue : 'beat');
    return {
      id: `${segment.id}:${wordIndex}:${cue}`,
      type: cue,
      intensity: segment.visual.intensity ?? 0.6,
      wordIndex,
      sourceWordIndex,
    };
  }, [segment, wordIndex, sourceWordIndex]);

  const fullRestart = useCallback(() => {
    restart();
    setVisualKey((k) => k + 1);
  }, [restart]);

  // Keyboard: space = play/pause, ←/→ = prev/next LINE, R = restart.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        nextLine();
      } else if (e.code === 'ArrowLeft') {
        previousLine();
      } else if (e.code === 'KeyR') {
        fullRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setIsPlaying, nextLine, previousLine, fullRestart]);

  const onBpmBlur = (e) => setBpm(clampBpm(e.target.value));

  const otherLangs = segment
    ? GRID_LANGS.filter((c) => segment.t[c] && segment.t[c] !== segment.o)
    : [];
  const primaryEn = segment && segment.t.EN && segment.t.EN !== segment.o ? segment.t.EN : null;

  return (
    <div className="player-shell flex w-full items-center justify-center bg-black">
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-slate-950 text-center select-none">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-black" />

        {/* --- Visualizer --- */}
        <div className="relative z-10 h-[40%] w-full flex-shrink-0">
          <ComeOverVisuals
            key={visualKey}
            isPlaying={isPlaying}
            scene={segment?.visual.scene ?? 'street'}
            sceneProgress={segmentProgress}
            transition={segment?.visual.transition ?? 'dissolve'}
            visualEvent={visualEvent}
            reducedMotion={reduced}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-slate-950" />
          <div className="pointer-events-none absolute left-4 top-4 text-left">
            <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {SONG.title}
            </h1>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-200/80">{SONG.artist}</p>
          </div>
        </div>

        {/* --- Lyrics (current display segment only) ---
            One keyed container for karaoke + subtitles: they can never fall out
            of sync, and the enter-only fade stays calm (no exit queueing, no
            upward pop) no matter how fast the user skips around. */}
        <motion.div
          key={segment?.id ?? 'none'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0.001 : 0.3, ease: 'easeOut' }}
          className="relative z-10 flex min-h-0 flex-grow flex-col px-4 pt-2"
        >
          <div className="lyric-segment flex-shrink-0" style={{ textShadow: '0 4px 18px rgba(0,0,0,0.85)' }}>
            <div className="w-full">
                {segment && (
                  <>
                    <KaraokeLine
                      words={segment.words}
                      upTo={wordIndex}
                      color={SUNG}
                      dim="rgba(255,255,255,0.8)"
                      reduced={reduced}
                      fitKey={segment.o}
                      pick={(w) => w.o}
                      className="font-bold tracking-tight"
                      minPx={16}
                      maxPx={30}
                    />
                    {segment.hasR && segment.r && (
                      <KaraokeLine
                        words={segment.words}
                        upTo={wordIndex}
                        color={SUNG_RO}
                        dim="rgba(255,255,255,0.4)"
                        reduced={reduced}
                        fitKey={segment.r}
                        pick={(w) => w.r}
                        className="mt-1 font-medium"
                        minPx={11}
                        maxPx={17}
                      />
                    )}
                    {primaryEn && (
                      <FitLine
                        text={primaryEn}
                        className="mt-1.5 text-white/85"
                        minPx={11}
                        maxPx={16}
                      />
                    )}
                  </>
                )}
            </div>
          </div>

          {/* Other-language subtitles — one fitted, never-truncated line each */}
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-white/10 pt-1.5">
            <ul className="space-y-0.5 text-left">
              {otherLangs.map((code) => (
                <li key={code} className="flex items-baseline gap-2">
                  <span className="w-8 flex-shrink-0 text-right text-[11px] font-bold text-amber-200/70">{code}</span>
                  <FitLine
                    text={segment.t[code]}
                    dir={RTL_LANGS.includes(code) ? 'rtl' : 'ltr'}
                    className="min-w-0 flex-1 text-white/85"
                    style={{ textAlign: RTL_LANGS.includes(code) ? 'right' : 'left' }}
                    minPx={11}
                    maxPx={14}
                  />
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* --- Controls --- */}
        <div className="relative z-20 flex-shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto mb-3 flex max-w-xs items-center gap-2">
            <span className="w-9 text-right text-[11px] font-mono text-white/45">
              {String(lineIndex + 1).padStart(2, '0')}
            </span>
            <div className="h-1 flex-grow overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                animate={{ width: `${songProgress * 100}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
            <span className="w-9 text-left text-[11px] font-mono text-white/45">{String(TOTAL).padStart(2, '0')}</span>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/45 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <button type="button" onClick={previousLine} className="touch-target text-white/70 transition-colors hover:text-white" aria-label="Previous line">
                <SkipBack size={22} />
              </button>
              <button type="button" onClick={() => setIsPlaying((p) => !p)} className="touch-target text-white transition-transform hover:scale-110" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={30} /> : <Play size={30} />}
              </button>
              <button type="button" onClick={nextLine} className="touch-target text-white/70 transition-colors hover:text-white" aria-label="Next line">
                <SkipForward size={22} />
              </button>
              <button type="button" onClick={fullRestart} className="touch-target text-white/70 transition-colors hover:text-white" aria-label="Restart">
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
