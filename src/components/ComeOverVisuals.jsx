import React, { useRef, useEffect, useCallback } from 'react';

// --- Pixel-art visualizer for "Come Over" ----------------------------------
// The scene evolves with the song (driven by `progress` 0..1):
//   calm   (verses/choruses) — quiet rainy night, the wanderer knocks.
//   storm  (rap section)     — heavy rain, dark sky, lightning, a cold tint.
//   resolve(final bridge)    — rain eases, sky warms to dawn, the door opens
//                              and the wanderer steps into the light.

const BODY = [
  [0, 0, 'k', 'k', 'k', 0, 0],
  [0, 'k', 'k', 'k', 'k', 'k', 0],
  [0, 'k', 'k', 'k', 'k', 'r', 0],
  [0, 'k', 'k', 'k', 'k', 'r', 0],
  [0, 0, 'k', 'k', 'k', 0, 0],
  ['k', 'k', 'k', 'k', 'k', 'r', 0],
  ['k', 'k', 'k', 'k', 'k', 'r', 0],
  ['k', 'k', 'k', 'k', 'k', 'r', 0],
];
const BODY_COLS = 7;
const BODY_ROWS = BODY.length;
const SIL = '#0a0b16';
const RIM = '#33405f';

// Sky anchor palettes [topRGB, horizonRGB]; blended by mood (-1 storm .. +1 dawn).
const SKY_STORM = [[5, 7, 16], [18, 16, 26]];
const SKY_NIGHT = [[10, 14, 40], [30, 32, 70]];
const SKY_DAWN = [[26, 34, 84], [250, 168, 110]];

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

// Per-phase animation targets (eased toward each frame for smooth transitions).
const PHASES = {
  calm: { mood: 0.0, rain: 0.55, glow: 0.5, doorOpen: 0 },
  storm: { mood: -0.85, rain: 1.0, glow: 0.35, doorOpen: 0 },
  resolve: { mood: 0.95, rain: 0.18, glow: 0.85, doorOpen: 1 },
};

function phaseFor(progress) {
  if (progress >= 0.83) return 'resolve'; // final bridge
  if (progress >= 0.35 && progress < 0.61) return 'storm'; // rap section
  return 'calm';
}

export default function ComeOverVisuals({ isPlaying, bpm, pulse, progress }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const A = useRef({
    stars: [], drops: [], splashes: [], ripples: [], skyline: [],
    wanderer: { x: 0, knockArm: 0, walk: 0 },
    cur: { mood: 0, rain: 0.55, glow: 0.5, doorOpen: 0 }, // eased state
    doorGlow: 0.5, flash: 0, atGoal: false,
    layout: null, t: 0,
  }).current;

  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const triggerKnock = useCallback(() => {
    const { layout, wanderer } = A;
    if (!layout || !A.atGoal || phaseFor(progressRef.current) === 'resolve') return;
    wanderer.knockArm = 1;
    A.doorGlow = Math.max(A.doorGlow, 1);
    A.ripples.push({ r: layout.doorW * 0.15, life: 1, max: layout.doorW * 1.7 });
  }, [A]);

  const prevPulse = useRef(pulse);
  useEffect(() => {
    if (pulse !== prevPulse.current) {
      prevPulse.current = pulse;
      if (playingRef.current) triggerKnock();
    }
  }, [pulse, triggerKnock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const setupScene = (w, h) => {
      const groundY = Math.floor(h * 0.82);
      const houseW = Math.floor(w * 0.3);
      const houseH = Math.floor(h * 0.56);
      const houseX = Math.floor(w * 0.6);
      const houseY = groundY - houseH;
      const doorW = Math.floor(houseW * 0.32);
      const doorH = Math.floor(houseH * 0.46);
      const doorX = Math.floor(houseX + houseW * 0.14);
      const doorY = groundY - doorH;
      const winW = Math.floor(houseW * 0.26);
      const winH = Math.floor(houseH * 0.22);
      const winX = Math.floor(houseX + houseW * 0.58);
      const winY = Math.floor(houseY + houseH * 0.22);
      const px = Math.max(2, Math.floor(h * 0.012));
      const figW = px * BODY_COLS;

      A.layout = {
        w, h, groundY, houseX, houseY, houseW, houseH,
        doorX, doorY, doorW, doorH, winX, winY, winW, winH, px, figW,
        knockX: doorX - figW * 0.85, // standing spot, left of the door
        intoX: doorX + doorW / 2 - figW / 2, // inside the doorway (resolve)
        doorCx: doorX + doorW / 2, doorCy: doorY + doorH * 0.4,
      };
      A.wanderer.x = -figW; // start off-screen, walk in

      A.stars = Array.from({ length: Math.floor(w / 7) }, () => ({
        x: Math.random() * w, y: Math.random() * groundY * 0.66,
        r: Math.random() < 0.18 ? 1.6 : 1, ph: Math.random() * Math.PI * 2,
        sp: 0.01 + Math.random() * 0.03,
      }));
      A.skyline = [];
      let sx = -10;
      while (sx < w) {
        const bw = 18 + Math.random() * 46;
        A.skyline.push({ x: sx, w: bw, h: Math.min(22 + Math.random() * 80, houseH * 0.9) });
        sx += bw + 6 + Math.random() * 14;
      }
      A.drops = Array.from({ length: Math.floor((w * h) / 4200) + 30 }, () => ({
        x: Math.random() * (w + 60) - 30, y: Math.random() * h,
        len: 7 + Math.random() * 9, sp: 5.5 + Math.random() * 4,
      }));
      A.splashes = [];
      A.ripples = [];
    };

    const drawSprite = (sprite, x, y, px) => {
      for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[r].length; c++) {
          const v = sprite[r][c];
          if (!v) continue;
          ctx.fillStyle = v === 'r' ? RIM : SIL;
          ctx.fillRect(Math.floor(x + c * px), Math.floor(y + r * px), Math.ceil(px), Math.ceil(px));
        }
      }
    };

    const drawWanderer = (resolve) => {
      const L = A.layout;
      const w = A.wanderer;
      const { px, figW } = L;
      const bodyTop = L.groundY - (BODY_ROWS + 3) * px;
      const cx = w.x + figW / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, L.groundY + px, figW * 0.5, px * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      const swing = A.atGoal ? 0 : Math.sin(w.walk) * px * 1.2;
      ctx.fillStyle = SIL;
      ctx.fillRect(Math.floor(cx - px * 1.7 + swing), L.groundY - px * 3, Math.ceil(px * 1.4), px * 3);
      ctx.fillRect(Math.floor(cx + px * 0.3 - swing), L.groundY - px * 3, Math.ceil(px * 1.4), px * 3);
      drawSprite(BODY, w.x, bodyTop, px);

      if (w.knockArm > 0.04 && !resolve) {
        const reach = w.knockArm * px * 2.4;
        const sx = cx + figW * 0.32;
        const sy = bodyTop + px * 2.2;
        ctx.fillStyle = SIL;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), Math.ceil(px + reach), Math.ceil(px));
        ctx.fillStyle = RIM;
        ctx.fillRect(Math.floor(sx + px + reach), Math.floor(sy - px * 0.3), Math.ceil(px * 1.2), Math.ceil(px * 1.4));
      }
    };

    const draw = () => {
      const L = A.layout;
      if (!L) return;
      const { w, h, groundY } = L;
      A.t += 1;
      const playing = playingRef.current;
      const phase = phaseFor(progressRef.current);
      const target = PHASES[phase];

      // Ease eased-state toward the current phase targets.
      const cur = A.cur;
      cur.mood += (target.mood - cur.mood) * 0.02;
      cur.rain += (target.rain - cur.rain) * 0.03;
      cur.glow += (target.glow - cur.glow) * 0.03;
      cur.doorOpen += (target.doorOpen - cur.doorOpen) * 0.03;
      const m = cur.mood;

      // --- Sky ---
      const top = m < 0 ? mix(SKY_NIGHT[0], SKY_STORM[0], -m) : mix(SKY_NIGHT[0], SKY_DAWN[0], m);
      const hor = m < 0 ? mix(SKY_NIGHT[1], SKY_STORM[1], -m) : mix(SKY_NIGHT[1], SKY_DAWN[1], m);
      const sky = ctx.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, rgb(top));
      sky.addColorStop(1, rgb(hor));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, groundY);

      // --- Moon (fades out toward dawn) / dawn glow ---
      const moonX = w * 0.8, moonY = h * 0.2, moonR = Math.max(10, h * 0.06);
      const moonA = Math.max(0, 1 - Math.max(0, m) * 1.3);
      if (moonA > 0.02) {
        const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 4);
        halo.addColorStop(0, `rgba(226,232,240,${0.35 * moonA})`);
        halo.addColorStop(1, 'rgba(226,232,240,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = `rgba(238,242,247,${moonA})`;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(15,23,42,${0.55 * moonA})`;
        ctx.beginPath();
        ctx.arc(moonX + moonR * 0.5, moonY - moonR * 0.35, moonR * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Stars (bright at night, gone in storm and at dawn) ---
      const starA = Math.max(0, 1 - Math.abs(m));
      if (starA > 0.02) {
        A.stars.forEach((s) => {
          s.ph += s.sp;
          ctx.globalAlpha = starA * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(s.ph)));
          ctx.fillStyle = '#dbe4f5';
          ctx.fillRect(s.x, s.y, s.r, s.r);
        });
        ctx.globalAlpha = 1;
      }

      // --- Lightning during the storm ---
      if (phase === 'storm' && playing && Math.random() < 0.012) A.flash = 1;
      A.flash *= 0.86;
      if (A.flash > 0.02) {
        ctx.fillStyle = `rgba(200,214,255,${A.flash * 0.5})`;
        ctx.fillRect(0, 0, w, h);
        if (A.flash > 0.7) {
          ctx.strokeStyle = `rgba(235,242,255,${A.flash})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          let lx = w * (0.2 + Math.random() * 0.4), ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < groundY * 0.7) { lx += (Math.random() - 0.5) * 40; ly += 18 + Math.random() * 20; ctx.lineTo(lx, ly); }
          ctx.stroke();
        }
      }

      // --- Skyline ---
      ctx.fillStyle = m < 0 ? '#080c18' : rgb(mix([12, 18, 38], [60, 50, 70], Math.max(0, m)));
      A.skyline.forEach((b) => ctx.fillRect(b.x, groundY - b.h, b.w, b.h));

      // --- House + roof ---
      ctx.fillStyle = '#141a30';
      ctx.fillRect(L.houseX, L.houseY, L.houseW, L.houseH);
      ctx.fillStyle = '#0d1124';
      ctx.beginPath();
      ctx.moveTo(L.houseX - L.houseW * 0.08, L.houseY);
      ctx.lineTo(L.houseX + L.houseW * 0.5, L.houseY - L.houseH * 0.22);
      ctx.lineTo(L.houseX + L.houseW * 1.08, L.houseY);
      ctx.closePath();
      ctx.fill();

      // Door glow eases back toward the phase baseline (knocks spike it).
      A.doorGlow += (cur.glow - A.doorGlow) * 0.06;
      const g = A.doorGlow;

      // Window light.
      const flick = 0.85 + 0.15 * Math.sin(A.t * 0.06);
      ctx.fillStyle = `rgba(255,196,112,${0.85 * flick})`;
      ctx.fillRect(L.winX, L.winY, L.winW, L.winH);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(L.winX + L.winW / 2 - 1, L.winY, 2, L.winH);
      ctx.fillRect(L.winX, L.winY + L.winH / 2 - 1, L.winW, 2);

      // Door glow spill.
      const open = cur.doorOpen;
      const spill = ctx.createRadialGradient(L.doorCx, L.doorCy, L.doorW * 0.2, L.doorCx, L.doorCy, L.doorW * (3.4 + open * 2));
      spill.addColorStop(0, `rgba(255,184,96,${(0.5 + open * 0.4) * g})`);
      spill.addColorStop(1, 'rgba(255,184,96,0)');
      ctx.fillStyle = spill;
      ctx.fillRect(0, 0, w, h);

      // Door — swings open as `open` grows, revealing bright warm light behind.
      if (open > 0.02) {
        ctx.fillStyle = `rgba(255,226,160,${0.5 + 0.5 * g})`;
        ctx.fillRect(L.doorX, L.doorY, L.doorW, L.doorH); // light pouring out
        const beam = ctx.createLinearGradient(L.doorCx, L.doorY, L.doorCx, groundY + (h - groundY));
        beam.addColorStop(0, `rgba(255,214,150,${0.5 * open})`);
        beam.addColorStop(1, 'rgba(255,214,150,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(L.doorX, groundY);
        ctx.lineTo(L.doorX + L.doorW, groundY);
        ctx.lineTo(L.doorX + L.doorW * (1.6 + open), h);
        ctx.lineTo(L.doorX - L.doorW * (0.6 + open), h);
        ctx.closePath();
        ctx.fill();
      }
      // Door panel (narrows as it opens, like swinging ajar).
      const panelW = L.doorW * (1 - open * 0.82);
      ctx.fillStyle = `rgb(${(120 + 135 * g) | 0},${(80 + 110 * g) | 0},${(40 + 60 * g) | 0})`;
      ctx.fillRect(L.doorX, L.doorY, Math.max(1, panelW), L.doorH);
      if (open < 0.5) {
        ctx.fillStyle = `rgba(255,221,150,${0.7 * g})`;
        ctx.fillRect(L.doorX + panelW * 0.78, L.doorY + L.doorH * 0.46, Math.max(1, panelW * 0.12), L.doorH * 0.1);
      }

      // Knock ripples.
      A.ripples = A.ripples.filter((rp) => rp.life > 0);
      A.ripples.forEach((rp) => {
        rp.life -= 0.045;
        rp.r += (rp.max - rp.r) * 0.08;
        ctx.strokeStyle = `rgba(255,214,150,${rp.life * 0.6})`;
        ctx.lineWidth = Math.max(1, L.px * 0.5);
        ctx.beginPath();
        ctx.arc(L.doorCx, L.doorCy, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // --- Wanderer movement (walk toward the current goal) ---
      const resolve = phase === 'resolve';
      const goalX = resolve ? L.intoX : L.knockX;
      if (playing) {
        const dx = goalX - A.wanderer.x;
        if (Math.abs(dx) > 1.2) {
          A.wanderer.x += Math.sign(dx) * Math.max(1.1, w * 0.0035);
          A.wanderer.walk += 0.22;
          A.atGoal = false;
        } else {
          A.wanderer.x = goalX;
          A.atGoal = true;
        }
      }
      A.wanderer.knockArm *= 0.86;
      drawWanderer(resolve);

      // --- Rain (intensity, speed and alpha follow the phase) ---
      const intensity = cur.rain;
      ctx.strokeStyle = `rgba(170,190,225,${0.32 * (0.4 + intensity)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      A.drops.forEach((d, i) => {
        if (intensity < 0.4 && i % 2 === 0) return; // drizzle: draw fewer
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.28 * (0.6 + intensity), d.y - d.len * (0.6 + intensity));
        d.y += d.sp * (0.5 + intensity);
        d.x += d.sp * 0.28;
        if (d.y > groundY) {
          if (Math.random() < 0.5 * intensity) A.splashes.push({ x: d.x, y: groundY, r: 0, life: 1 });
          d.y = -10;
          d.x = Math.random() * (w + 60) - 30;
        }
      });
      ctx.stroke();

      A.splashes = A.splashes.filter((s) => s.life > 0);
      A.splashes.forEach((s) => {
        s.life -= 0.06;
        s.r += 0.8;
        ctx.strokeStyle = `rgba(180,200,235,${s.life * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, Math.PI, Math.PI * 2);
        ctx.stroke();
      });

      // --- Wet ground + door reflection ---
      const gnd = ctx.createLinearGradient(0, groundY, 0, h);
      gnd.addColorStop(0, m < 0 ? '#070a14' : rgb(mix([10, 14, 28], [40, 30, 30], Math.max(0, m))));
      gnd.addColorStop(1, '#05060d');
      ctx.fillStyle = gnd;
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = `rgba(255,184,96,${(0.12 + open * 0.18) * g})`;
      ctx.fillRect(L.doorX - L.doorW * 0.3, groundY, L.doorW * (1.6 + open), h - groundY);

      rafRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const cw = parent.clientWidth;
      const chh = parent.clientHeight;
      if (cw === 0 || chh === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cw * dpr;
      canvas.height = chh * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${chh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      setupScene(cw, chh);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [A]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
