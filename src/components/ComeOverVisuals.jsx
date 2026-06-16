import React, { useRef, useEffect, useCallback } from 'react';

// --- Pixel-art rainy-night visualizer for "Come Over" ----------------------
// A lone hooded wanderer walks through the rain to a softly glowing door and
// knocks — one knock per lyric beat (driven by the `pulse` prop). The mood
// follows the song: an empty night, a door, "knockin' on your door".

// Hooded torso sprite (7 wide). 'k' = silhouette, 'r' = rim light catching the
// warm glow from the door. Legs and the knocking arm are animated in code.
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

export default function ComeOverVisuals({ isPlaying, bpm, pulse }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const A = useRef({
    stars: [],
    drops: [],
    splashes: [],
    ripples: [],
    skyline: [],
    wanderer: { x: 0, targetX: 0, arrived: false, walk: 0, knockArm: 0 },
    doorGlow: 0.45,
    doorGlowTarget: 0.45,
    layout: null,
    t: 0,
  }).current;

  // Mirror live props into refs so the rAF loop reads fresh values.
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  // Fire a knock: snap the arm out, flash the door, ring a ripple.
  const triggerKnock = useCallback(() => {
    const { layout, wanderer } = A;
    if (!layout || !wanderer.arrived) return;
    wanderer.knockArm = 1;
    A.doorGlowTarget = 1;
    A.ripples.push({ r: layout.doorW * 0.15, life: 1, max: layout.doorW * 1.7 });
  }, [A]);

  // Knock whenever the lyric advances to a new word (only while playing).
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

      const px = Math.max(2, Math.floor(h * 0.012)); // sprite pixel size
      const figW = px * BODY_COLS;
      const figH = px * (BODY_ROWS + 3); // + legs

      A.layout = {
        w, h, groundY, houseX, houseY, houseW, houseH,
        doorX, doorY, doorW, doorH, winX, winY, winW, winH,
        px, figW, figH,
        doorCx: doorX + doorW / 2,
        doorCy: doorY + doorH * 0.4,
      };

      A.wanderer.x = -figW;
      A.wanderer.targetX = doorX - figW * 0.85;
      A.wanderer.arrived = false;
      A.wanderer.walk = 0;
      A.wanderer.knockArm = 0;

      // Twinkling stars in the upper sky.
      A.stars = Array.from({ length: Math.floor(w / 7) }, () => ({
        x: Math.random() * w,
        y: Math.random() * groundY * 0.66,
        r: Math.random() < 0.18 ? 1.6 : 1,
        ph: Math.random() * Math.PI * 2,
        sp: 0.01 + Math.random() * 0.03,
      }));

      // Distant skyline silhouettes for depth.
      A.skyline = [];
      let sx = -10;
      while (sx < w) {
        const bw = 18 + Math.random() * 46;
        const bh = 22 + Math.random() * 80;
        A.skyline.push({ x: sx, w: bw, h: Math.min(bh, houseH * 0.9) });
        sx += bw + 6 + Math.random() * 14;
      }

      // Rain.
      A.drops = Array.from({ length: Math.floor((w * h) / 5200) + 28 }, () => ({
        x: Math.random() * (w + 60) - 30,
        y: Math.random() * h,
        len: 7 + Math.random() * 9,
        sp: 5.5 + Math.random() * 4,
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

    const drawWanderer = () => {
      const L = A.layout;
      const w = A.wanderer;
      const { px, figW } = L;
      const bodyTop = L.groundY - (BODY_ROWS + 3) * px;
      const cx = w.x + figW / 2;

      // Soft shadow on the wet ground.
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, L.groundY + px, figW * 0.5, px * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs (swing while walking, planted once arrived).
      const swing = w.arrived ? 0 : Math.sin(w.walk) * px * 1.2;
      ctx.fillStyle = SIL;
      ctx.fillRect(Math.floor(cx - px * 1.7 + swing), L.groundY - px * 3, Math.ceil(px * 1.4), px * 3);
      ctx.fillRect(Math.floor(cx + px * 0.3 - swing), L.groundY - px * 3, Math.ceil(px * 1.4), px * 3);

      drawSprite(BODY, w.x, bodyTop, px);

      // Knocking arm reaches toward the door on each knock.
      if (w.knockArm > 0.04) {
        const reach = w.knockArm * px * 2.4;
        const shoulderX = cx + figW * 0.32;
        const shoulderY = bodyTop + px * 2.2;
        ctx.fillStyle = SIL;
        ctx.fillRect(Math.floor(shoulderX), Math.floor(shoulderY), Math.ceil(px + reach), Math.ceil(px));
        // Fist.
        const fx = shoulderX + px + reach;
        ctx.fillStyle = RIM;
        ctx.fillRect(Math.floor(fx), Math.floor(shoulderY - px * 0.3), Math.ceil(px * 1.2), Math.ceil(px * 1.4));
      }
    };

    const draw = () => {
      const L = A.layout;
      if (!L) return;
      const { w, h, groundY } = L;
      A.t += 1;
      const playing = playingRef.current;

      ctx.clearRect(0, 0, w, h);

      // Moon + halo, top right.
      const moonX = w * 0.8;
      const moonY = h * 0.2;
      const moonR = Math.max(10, h * 0.06);
      const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 4);
      halo.addColorStop(0, 'rgba(226,232,240,0.35)');
      halo.addColorStop(1, 'rgba(226,232,240,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#eef2f7';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(15,23,42,0.55)';
      ctx.beginPath();
      ctx.arc(moonX + moonR * 0.5, moonY - moonR * 0.35, moonR * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Stars.
      A.stars.forEach((s) => {
        s.ph += s.sp;
        ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(s.ph));
        ctx.fillStyle = '#dbe4f5';
        ctx.fillRect(s.x, s.y, s.r, s.r);
      });
      ctx.globalAlpha = 1;

      // Distant skyline.
      ctx.fillStyle = '#0c1226';
      A.skyline.forEach((b) => ctx.fillRect(b.x, groundY - b.h, b.w, b.h));

      // House body + roof.
      ctx.fillStyle = '#141a30';
      ctx.fillRect(L.houseX, L.houseY, L.houseW, L.houseH);
      ctx.fillStyle = '#0d1124';
      ctx.beginPath();
      ctx.moveTo(L.houseX - L.houseW * 0.08, L.houseY);
      ctx.lineTo(L.houseX + L.houseW * 0.5, L.houseY - L.houseH * 0.22);
      ctx.lineTo(L.houseX + L.houseW * 1.08, L.houseY);
      ctx.closePath();
      ctx.fill();

      // Ease the door glow toward its target, then let the target settle back.
      A.doorGlow += (A.doorGlowTarget - A.doorGlow) * 0.18;
      A.doorGlowTarget += (0.45 - A.doorGlowTarget) * 0.05;
      const g = A.doorGlow;

      // Window — steady warm light with a gentle flicker.
      const flick = 0.85 + 0.15 * Math.sin(A.t * 0.06);
      ctx.fillStyle = `rgba(255,196,112,${0.85 * flick})`;
      ctx.fillRect(L.winX, L.winY, L.winW, L.winH);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(L.winX + L.winW / 2 - 1, L.winY, 2, L.winH);
      ctx.fillRect(L.winX, L.winY + L.winH / 2 - 1, L.winW, 2);

      // Door glow spilling onto the scene.
      const spill = ctx.createRadialGradient(L.doorCx, L.doorCy, L.doorW * 0.2, L.doorCx, L.doorCy, L.doorW * 3.4);
      spill.addColorStop(0, `rgba(255,179,92,${0.5 * g})`);
      spill.addColorStop(1, 'rgba(255,179,92,0)');
      ctx.fillStyle = spill;
      ctx.fillRect(0, 0, w, h);

      // Door.
      ctx.fillStyle = `rgb(${Math.round(120 + 135 * g)},${Math.round(80 + 110 * g)},${Math.round(40 + 60 * g)})`;
      ctx.fillRect(L.doorX, L.doorY, L.doorW, L.doorH);
      ctx.fillStyle = `rgba(255,221,150,${0.7 * g})`;
      ctx.fillRect(L.doorX + L.doorW * 0.78, L.doorY + L.doorH * 0.46, L.doorW * 0.12, L.doorH * 0.1); // knob

      // Knock ripples on the door.
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

      // Wanderer: walk in, then knock.
      if (playing && !A.wanderer.arrived) {
        const speed = Math.max(1.1, w * 0.0035);
        A.wanderer.x += speed;
        A.wanderer.walk += 0.22;
        if (A.wanderer.x >= A.wanderer.targetX) {
          A.wanderer.x = A.wanderer.targetX;
          A.wanderer.arrived = true;
        }
      }
      A.wanderer.knockArm *= 0.86;
      drawWanderer();

      // Rain (keeps falling even when paused, for atmosphere).
      ctx.strokeStyle = 'rgba(170,190,225,0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      A.drops.forEach((d) => {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.28, d.y - d.len);
        d.y += d.sp;
        d.x += d.sp * 0.28;
        if (d.y > groundY) {
          if (Math.random() < 0.5) A.splashes.push({ x: d.x, y: groundY, r: 0, life: 1 });
          d.y = -10;
          d.x = Math.random() * (w + 60) - 30;
        }
      });
      ctx.stroke();

      // Splashes on the wet ground.
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

      // Wet ground with a faint reflection of the door light.
      const gnd = ctx.createLinearGradient(0, groundY, 0, h);
      gnd.addColorStop(0, '#0a0e1c');
      gnd.addColorStop(1, '#05060d');
      ctx.fillStyle = gnd;
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = `rgba(255,179,92,${0.12 * g})`;
      ctx.fillRect(L.doorX - L.doorW * 0.3, groundY, L.doorW * 1.6, h - groundY);

      rafRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const hgt = parent.clientHeight;
      if (w === 0 || hgt === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = hgt * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${hgt}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      setupScene(w, hgt);
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
