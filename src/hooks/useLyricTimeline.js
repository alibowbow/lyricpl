import { useState, useRef, useEffect, useCallback } from 'react';

// Monotonic, BPM-driven lyric clock built on a single requestAnimationFrame
// loop + performance.now deltas (no setTimeout chains). Pausing freezes the
// accumulated beats; resuming continues mid-word; changing BPM only affects
// future accumulation (never resets position). prev/next operate on whole
// lyric LINES even though playback advances by display SEGMENT.
export function useLyricTimeline({ segments, lineToSegments, bpm, initialPlaying = true }) {
  const lineCount = lineToSegments.length;
  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [tl, setTl] = useState({ segIndex: 0, wordIndex: -1, segmentProgress: 0 });

  const segRef = useRef(segments);
  segRef.current = segments;
  const l2sRef = useRef(lineToSegments);
  l2sRef.current = lineToSegments;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  const engine = useRef({ segIndex: 0, segBeats: 0, lastTs: 0 }).current;
  const published = useRef({ segIndex: -1, wordIndex: -2, bucket: -1 }).current;
  const rafRef = useRef(null);

  const segTotal = (seg) => {
    let s = seg.timing.tailBeats || 0;
    for (const b of seg.timing.wordBeats) s += b;
    return s > 0 ? s : 1;
  };
  const wordAt = (seg, beats) => {
    const wb = seg.timing.wordBeats;
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < wb.length; i += 1) {
      if (beats >= acc) idx = i;
      acc += wb[i];
    }
    return Math.min(idx, wb.length - 1);
  };

  const publish = useCallback(
    (segIndex, wordIndex, progress) => {
      const bucket = Math.floor(progress * 12);
      if (
        segIndex === published.segIndex &&
        wordIndex === published.wordIndex &&
        bucket === published.bucket
      ) {
        return;
      }
      published.segIndex = segIndex;
      published.wordIndex = wordIndex;
      published.bucket = bucket;
      setTl({ segIndex, wordIndex, segmentProgress: progress });
    },
    [published],
  );

  useEffect(() => {
    const tick = (now) => {
      const e = engine;
      if (!e.lastTs) e.lastTs = now;
      let dt = now - e.lastTs;
      e.lastTs = now;
      if (dt < 0) dt = 0;
      if (dt > 250) dt = 250; // clamp big jumps (tab was backgrounded)

      const segs = segRef.current;
      if (segs.length) {
        if (e.segIndex >= segs.length) e.segIndex = 0;
        if (playingRef.current) {
          const beatMs = 60000 / Math.max(1, bpmRef.current);
          e.segBeats += dt / beatMs;
          let guard = 0;
          let total = segTotal(segs[e.segIndex]);
          while (e.segBeats >= total && guard < segs.length + 2) {
            e.segBeats -= total;
            e.segIndex = (e.segIndex + 1) % segs.length;
            total = segTotal(segs[e.segIndex]);
            guard += 1;
          }
        }
        const seg = segs[e.segIndex];
        const total = segTotal(seg);
        const progress = Math.max(0, Math.min(1, e.segBeats / total));
        publish(e.segIndex, wordAt(seg, e.segBeats), progress);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [engine, publish]);

  const seekToSeg = useCallback(
    (segIndex) => {
      const len = segRef.current.length || 1;
      engine.segIndex = ((segIndex % len) + len) % len;
      engine.segBeats = 0;
      published.segIndex = -1;
      published.wordIndex = -2;
      published.bucket = -1;
      setTl({ segIndex: engine.segIndex, wordIndex: -1, segmentProgress: 0 });
    },
    [engine, published],
  );

  const seekToLine = useCallback(
    (lineIndex) => {
      const li = ((lineIndex % lineCount) + lineCount) % lineCount;
      seekToSeg(l2sRef.current[li]?.[0] ?? 0);
    },
    [lineCount, seekToSeg],
  );

  const nextLine = useCallback(
    () => seekToLine((segRef.current[engine.segIndex]?.lineIndex ?? 0) + 1),
    [seekToLine, engine],
  );
  const previousLine = useCallback(
    () => seekToLine((segRef.current[engine.segIndex]?.lineIndex ?? 0) - 1),
    [seekToLine, engine],
  );
  const restart = useCallback(() => {
    seekToSeg(0);
    setIsPlaying(true);
  }, [seekToSeg]);

  const segment = segments[tl.segIndex] ?? segments[0];
  const wordIndex = tl.wordIndex;
  const sourceWordIndex = segment?.words?.[wordIndex]?.sourceWordIndex ?? -1;
  const songProgress = segments.length
    ? (tl.segIndex + tl.segmentProgress) / segments.length
    : 0;

  return {
    segments,
    segment,
    segmentIndex: tl.segIndex,
    lineIndex: segment?.lineIndex ?? 0,
    wordIndex,
    sourceWordIndex,
    segmentProgress: tl.segmentProgress,
    songProgress,
    isPlaying,
    setIsPlaying,
    seekToLine,
    nextLine,
    previousLine,
    restart,
  };
}
