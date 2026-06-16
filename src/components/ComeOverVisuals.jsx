import React, { useRef, useEffect, useCallback } from 'react';

// --- Pixel-art multi-scene visualizer for "Come Over" ----------------------
// Cuts between 12 distinct scenes (day and night) as the song plays, with a
// fade-through-dark transition. Scenes are intentionally brighter than a plain
// dark night so the art reads clearly.
//   street citywalk day  — getting to you (incl. daytime)
//   room train rooftop    — alone in the city at night
//   house                 — the house, knocking on the glowing door
//   neon storm            — the rap: neon rain, then the dark storm
//   boat sunset dawn       — the bridge and the hopeful ending

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
const TAU = Math.PI * 2;

export default function ComeOverVisuals({ isPlaying, pulse, scene = 'street' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const A = useRef({
    stars: [], drops: [], splashes: [], ripples: [], smoke: [], motes: [], clouds: [], skyline: [],
    wanderer: { x: 0, knockArm: 0, walk: 0 },
    beat: 0, flash: 0, doorGlow: 0.6,
    sceneCur: null, veil: 0,
    layout: null, t: 0,
  }).current;

  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const triggerBeat = useCallback(() => {
    A.beat = 1;
    if (A.layout && A.sceneCur === 'house') {
      A.ripples.push({ r: A.layout.px * 2, life: 1, max: A.layout.w * 0.16 });
      A.wanderer.knockArm = 1;
    }
  }, [A]);

  const prevPulse = useRef(pulse);
  useEffect(() => {
    if (pulse !== prevPulse.current) {
      prevPulse.current = pulse;
      if (playingRef.current) triggerBeat();
    }
  }, [pulse, triggerBeat]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const setup = (w, h) => {
      const px = Math.max(3, Math.floor(h * 0.018));
      A.layout = { w, h, groundY: Math.floor(h * 0.74), px, figW: px * BODY_COLS };
      A.wanderer.x = w * 0.2;
      if (A.sceneCur == null) A.sceneCur = sceneRef.current;
      A.stars = Array.from({ length: Math.floor(w / 6) }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.7,
        r: Math.random() < 0.2 ? 1.6 : 1, ph: Math.random() * TAU, sp: 0.01 + Math.random() * 0.03,
      }));
      A.drops = Array.from({ length: Math.floor((w * h) / 4200) + 30 }, () => ({
        x: Math.random() * (w + 60) - 30, y: Math.random() * h, len: 7 + Math.random() * 9, sp: 5.5 + Math.random() * 4,
      }));
      A.clouds = Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * w, y: h * (0.08 + Math.random() * 0.28), s: px * (3 + Math.random() * 3), sp: 0.1 + Math.random() * 0.2,
      }));
      A.skyline = [];
      let sx = -10;
      while (sx < w) {
        const bw = 22 + Math.random() * 48;
        A.skyline.push({ x: sx, w: bw, h: 30 + Math.random() * 90 });
        sx += bw + 4 + Math.random() * 12;
      }
      A.splashes = []; A.ripples = []; A.smoke = []; A.motes = [];
    };

    // --- shared helpers ---
    const sprite = (s, x, y, p) => {
      for (let r = 0; r < s.length; r++)
        for (let c = 0; c < s[r].length; c++) {
          if (!s[r][c]) continue;
          ctx.fillStyle = s[r][c] === 'r' ? RIM : SIL;
          ctx.fillRect(Math.floor(x + c * p), Math.floor(y + r * p), Math.ceil(p), Math.ceil(p));
        }
    };

    const hooded = (cx, footY, p, { walk = null, knock = 0 } = {}) => {
      const figW = p * BODY_COLS;
      const bodyTop = footY - (BODY_ROWS + 3) * p;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, footY + p, figW * 0.5, p * 1.1, 0, 0, TAU);
      ctx.fill();
      const sw = walk != null ? Math.sin(walk) * p * 1.2 : 0;
      ctx.fillStyle = SIL;
      ctx.fillRect(Math.floor(cx - p * 1.7 + sw), footY - p * 3, Math.ceil(p * 1.4), p * 3);
      ctx.fillRect(Math.floor(cx + p * 0.3 - sw), footY - p * 3, Math.ceil(p * 1.4), p * 3);
      sprite(BODY, cx - figW / 2, bodyTop, p);
      if (knock > 0.04) {
        const reach = knock * p * 2.4;
        const sx = cx + figW * 0.32, sy = bodyTop + p * 2.2;
        ctx.fillStyle = SIL;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), Math.ceil(p + reach), Math.ceil(p));
        ctx.fillStyle = RIM;
        ctx.fillRect(Math.floor(sx + p + reach), Math.floor(sy - p * 0.3), Math.ceil(p * 1.2), Math.ceil(p * 1.4));
      }
    };

    const seated = (cx, footY, p) => {
      ctx.fillStyle = SIL;
      ctx.beginPath();
      ctx.arc(cx, footY - p * 5, p * 2.1, 0, TAU);
      ctx.fill();
      ctx.fillRect(cx - p * 2.4, footY - p * 4, p * 4.8, p * 3);
      ctx.fillRect(cx - p * 0.5, footY - p * 1.2, p * 3, p * 1.2); // legs out
    };

    const stars = (alpha) => {
      A.stars.forEach((s) => {
        s.ph += s.sp;
        ctx.globalAlpha = alpha * (0.4 + 0.45 * (0.5 + 0.5 * Math.sin(s.ph)));
        ctx.fillStyle = '#eef3ff';
        ctx.fillRect(s.x, s.y, s.r, s.r);
      });
      ctx.globalAlpha = 1;
    };

    const moon = (x, y, r) => {
      const halo = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4.5);
      halo.addColorStop(0, 'rgba(226,232,240,0.4)');
      halo.addColorStop(1, 'rgba(226,232,240,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, A.layout.w, A.layout.h);
      ctx.fillStyle = '#f4f7fc';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    };

    const sun = (x, y, r, core = '#fff4cc') => {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      halo.addColorStop(0, 'rgba(255,238,180,0.55)');
      halo.addColorStop(1, 'rgba(255,238,180,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, A.layout.w, A.layout.h);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    };

    const clouds = (playing, color = 'rgba(255,255,255,0.9)') => {
      const { w } = A.layout;
      A.clouds.forEach((c) => {
        if (playing) { c.x += c.sp; if (c.x - c.s * 3 > w) c.x = -c.s * 3; }
        ctx.fillStyle = color;
        [[0, 0, 1], [c.s * 1.3, c.s * 0.2, 0.8], [-c.s * 1.2, c.s * 0.25, 0.75]].forEach(([dx, dy, sc]) => {
          ctx.beginPath();
          ctx.ellipse(c.x + dx, c.y + dy, c.s * sc, c.s * 0.62 * sc, 0, 0, TAU);
          ctx.fill();
        });
      });
    };

    const litSkyline = (baseY, scale, winColor) => {
      A.skyline.forEach((b, bi) => {
        const bh = b.h * scale;
        ctx.fillStyle = '#101938';
        ctx.fillRect(b.x, baseY - bh, b.w, bh);
        for (let wy = baseY - bh + 5; wy < baseY - 4; wy += 8)
          for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 7)
            if ((((wx * 7 + wy * 3 + bi) % 5) < 2)) {
              ctx.fillStyle = winColor;
              ctx.fillRect(wx, wy, 3, 4);
            }
      });
    };

    const rain = (intensity, playing, color = 'rgba(180,200,235,') => {
      const { w, groundY } = A.layout;
      ctx.strokeStyle = `${color}${0.3 * (0.4 + intensity)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      A.drops.forEach((d, i) => {
        if (intensity < 0.4 && i % 2 === 0) return;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.28 * (0.6 + intensity), d.y - d.len * (0.6 + intensity));
        if (playing) {
          d.y += d.sp * (0.5 + intensity);
          d.x += d.sp * 0.28;
          if (d.y > groundY) {
            if (Math.random() < 0.4 * intensity) A.splashes.push({ x: d.x, y: groundY, r: 0, life: 1 });
            d.y = -10;
            d.x = Math.random() * (w + 60) - 30;
          }
        }
      });
      ctx.stroke();
      A.splashes = A.splashes.filter((s) => s.life > 0);
      A.splashes.forEach((s) => {
        if (playing) { s.life -= 0.06; s.r += 0.8; }
        ctx.strokeStyle = `rgba(190,210,240,${s.life * 0.4})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, Math.PI, TAU);
        ctx.stroke();
      });
    };

    const skyGrad = (top, hor, toY) => {
      const g = ctx.createLinearGradient(0, 0, 0, toY);
      g.addColorStop(0, top);
      g.addColorStop(1, hor);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, A.layout.w, toY);
    };

    // --- scenes ---
    const sceneStreet = (playing) => {
      const { w, h, groundY, px, figW } = A.layout;
      skyGrad('#16224e', '#2b3a72', groundY);
      moon(w * 0.16, h * 0.2, Math.max(10, h * 0.055));
      stars(0.85);
      litSkyline(groundY, 0.7, 'rgba(255,210,140,0.75)');
      ctx.fillStyle = '#0e1430';
      ctx.fillRect(0, groundY, w, h - groundY);
      [0.34, 0.66].forEach((lx) => {
        const x = w * lx, lampY = groundY - h * 0.34;
        ctx.fillStyle = '#0a1024';
        ctx.fillRect(x - px * 0.4, lampY, px * 0.8, h * 0.34);
        const cone = ctx.createLinearGradient(x, lampY, x, groundY);
        cone.addColorStop(0, 'rgba(255,219,150,0.4)');
        cone.addColorStop(1, 'rgba(255,219,150,0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(x - px, lampY); ctx.lineTo(x - px * 6, groundY); ctx.lineTo(x + px * 6, groundY); ctx.lineTo(x + px, lampY); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff0c8';
        ctx.fillRect(x - px, lampY - px, px * 2, px * 1.6);
        ctx.fillStyle = 'rgba(255,219,150,0.16)';
        ctx.fillRect(x - px * 4, groundY, px * 8, h - groundY);
      });
      if (playing) { A.wanderer.x += Math.max(1, w * 0.0028); A.wanderer.walk += 0.22; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      hooded(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
      rain(0.6, playing);
    };

    const sceneDay = (playing) => {
      const { w, h, groundY, px, figW } = A.layout;
      skyGrad('#5cb3f2', '#bfe6ff', groundY);
      sun(w * 0.2, h * 0.22, Math.max(12, h * 0.07), '#fff6d0');
      clouds(playing);
      // green field
      ctx.fillStyle = '#5aa05a';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = '#4c9050';
      for (let x = 0; x < w; x += px * 2) ctx.fillRect(x, groundY, px, -px * (1 + ((x * 7) % 3)));
      // bright house
      const hw = w * 0.26, hh = h * 0.34, hx = w * 0.6, hy = groundY - hh;
      ctx.fillStyle = '#f1ede2';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = '#d9533b';
      ctx.beginPath();
      ctx.moveTo(hx - hw * 0.08, hy); ctx.lineTo(hx + hw * 0.5, hy - hh * 0.34); ctx.lineTo(hx + hw * 1.08, hy); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7cc0ec';
      ctx.fillRect(hx + hw * 0.14, hy + hh * 0.2, hw * 0.24, hh * 0.24);
      ctx.fillStyle = '#7a4a2a';
      ctx.fillRect(hx + hw * 0.56, groundY - hh * 0.48, hw * 0.24, hh * 0.48);
      if (playing) { A.wanderer.x += Math.max(1, w * 0.0026); A.wanderer.walk += 0.22; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      hooded(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
    };

    const sceneCitywalk = (playing) => {
      const { w, h, groundY, px, figW } = A.layout;
      skyGrad('#6fb8ef', '#cfe8fb', groundY);
      sun(w * 0.78, h * 0.18, Math.max(11, h * 0.06), '#fff7d6');
      clouds(playing);
      // daytime buildings
      A.skyline.forEach((b, bi) => {
        const bh = b.h * 0.95;
        ctx.fillStyle = bi % 2 ? '#9fb4cf' : '#b6c6dc';
        ctx.fillRect(b.x, groundY - bh, b.w, bh);
        ctx.fillStyle = 'rgba(70,90,120,0.5)';
        for (let wy = groundY - bh + 6; wy < groundY - 6; wy += 9)
          for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 8) ctx.fillRect(wx, wy, 4, 5);
      });
      ctx.fillStyle = '#5b6675';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; // crosswalk
      for (let x = w * 0.1; x < w * 0.9; x += px * 5) ctx.fillRect(x, groundY + px * 2, px * 3, px);
      if (playing) { A.wanderer.x += Math.max(1, w * 0.003); A.wanderer.walk += 0.24; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      hooded(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
    };

    const sceneRoom = (playing) => {
      const { w, h, groundY, px } = A.layout;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1b2440');
      bg.addColorStop(1, '#10162c');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      const wx = w * 0.46, wy = h * 0.12, ww = w * 0.44, wh = h * 0.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx, wy, ww, wh);
      ctx.clip();
      const sg = ctx.createLinearGradient(0, wy, 0, wy + wh);
      sg.addColorStop(0, '#14224a');
      sg.addColorStop(1, '#26386a');
      ctx.fillStyle = sg;
      ctx.fillRect(wx, wy, ww, wh);
      stars(1);
      for (let i = 0; i < 14; i++) {
        const cx = wx + ((i + 0.5) * ww) / 14;
        const cy = wy + wh * (0.6 + 0.32 * (((i * 37) % 10) / 10));
        ctx.fillStyle = `rgba(255,210,140,${0.6 + 0.4 * Math.sin(A.t * 0.05 + i)})`;
        ctx.fillRect(cx, cy, px, px * (1 + (i % 4)));
      }
      ctx.restore();
      ctx.fillStyle = '#2a3354';
      ctx.fillRect(wx - px, wy - px, ww + px * 2, px);
      ctx.fillRect(wx - px, wy + wh, ww + px * 2, px);
      ctx.fillRect(wx - px, wy, px, wh);
      ctx.fillRect(wx + ww, wy, px, wh);
      ctx.fillRect(wx + ww / 2 - px / 2, wy, px, wh);
      ctx.fillRect(wx, wy + wh / 2 - px / 2, ww, px);
      ctx.fillStyle = '#0c1124';
      ctx.fillRect(0, groundY, w, h - groundY);
      const fx = w * 0.2;
      ctx.fillStyle = SIL;
      ctx.beginPath();
      ctx.arc(fx, groundY - px * 7, px * 2.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - px * 4, groundY);
      ctx.quadraticCurveTo(fx - px * 4.5, groundY - px * 6, fx, groundY - px * 6);
      ctx.quadraticCurveTo(fx + px * 4.5, groundY - px * 6, fx + px * 4, groundY);
      ctx.closePath();
      ctx.fill();
      const pg = 0.6 + 0.4 * A.beat;
      const phx = fx + px * 3, phy = groundY - px * 5;
      const glow = ctx.createRadialGradient(phx, phy, 0, phx, phy, px * 7);
      glow.addColorStop(0, `rgba(130,195,255,${0.8 * pg})`);
      glow.addColorStop(1, 'rgba(130,195,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(phx - px * 7, phy - px * 7, px * 14, px * 14);
      ctx.fillStyle = `rgba(200,230,255,${pg})`;
      ctx.fillRect(phx - px * 0.8, phy - px * 1.2, px * 1.6, px * 2.4);
    };

    const sceneTrain = (playing) => {
      const { w, h, groundY, px } = A.layout;
      ctx.fillStyle = '#1c2236';
      ctx.fillRect(0, 0, w, h);
      // warm interior light
      const lg = ctx.createLinearGradient(0, 0, 0, h);
      lg.addColorStop(0, 'rgba(255,224,170,0.12)');
      lg.addColorStop(1, 'rgba(255,224,170,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, w, h);
      // window strip with passing city lights
      const wy = h * 0.16, wh = h * 0.34;
      ctx.fillStyle = '#0a1126';
      ctx.fillRect(w * 0.08, wy, w * 0.84, wh);
      for (let i = 0; i < 26; i++) {
        const x = w * 0.08 + ((i * 53 + A.t * 6) % (w * 0.84));
        ctx.fillStyle = `rgba(${i % 3 ? 255 : 150},${i % 2 ? 210 : 230},${i % 3 ? 150 : 255},0.8)`;
        ctx.fillRect(x, wy + (wh * 0.3) + ((i * 31) % (wh * 0.5)), px, px * (1 + (i % 3)));
      }
      // window frames
      ctx.fillStyle = '#2c3654';
      ctx.fillRect(w * 0.08, wy - px, w * 0.84, px);
      ctx.fillRect(w * 0.08, wy + wh, w * 0.84, px);
      ctx.fillRect(w * 0.5 - px, wy, px * 2, wh);
      // bench
      ctx.fillStyle = '#243150';
      ctx.fillRect(0, groundY - px * 2, w, h - groundY + px * 2);
      // seated figure
      seated(w * 0.32, groundY, px);
    };

    const sceneRooftop = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#101c44', '#243365', h * 0.7);
      moon(w * 0.78, h * 0.18, Math.max(10, h * 0.055));
      stars(0.9);
      litSkyline(h * 0.72, 0.8, 'rgba(255,214,150,0.85)');
      // neon hints in the city
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ['rgba(255,90,160,0.6)', 'rgba(90,220,255,0.6)'][i % 2];
        ctx.fillRect(w * (0.15 + i * 0.22), h * 0.55, px * 4, px);
      }
      // rooftop ledge (foreground)
      ctx.fillStyle = '#0a1024';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = '#111830';
      ctx.fillRect(0, groundY - px, w, px);
      // figure sitting on the ledge, legs dangling
      const fx = w * 0.3;
      ctx.fillStyle = SIL;
      ctx.beginPath();
      ctx.arc(fx, groundY - px * 5, px * 2.1, 0, TAU);
      ctx.fill();
      ctx.fillRect(fx - px * 2.2, groundY - px * 4, px * 4.4, px * 3.2);
      ctx.fillRect(fx - px * 1.6, groundY, px * 1.3, px * 3); // dangling legs
      ctx.fillRect(fx + px * 0.4, groundY, px * 1.3, px * 3);
    };

    const sceneHouse = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#172352', '#2d3d78', groundY);
      moon(w * 0.83, h * 0.2, Math.max(10, h * 0.06));
      stars(0.8);
      litSkyline(groundY, 0.62, 'rgba(255,210,140,0.7)');
      ctx.fillStyle = '#0c1228';
      ctx.fillRect(0, groundY, w, h - groundY);
      // house
      const hw = w * 0.3, hh = h * 0.6, hx = w * 0.5, hy = groundY - hh;
      ctx.fillStyle = '#2a335c';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = '#1b2444';
      ctx.beginPath();
      ctx.moveTo(hx - hw * 0.1, hy); ctx.lineTo(hx + hw * 0.5, hy - hh * 0.2); ctx.lineTo(hx + hw * 1.1, hy); ctx.closePath();
      ctx.fill();
      // bright window (warm, 2x2)
      const winW = hw * 0.26, winH = hh * 0.2, winX = hx + hw * 0.56, winY = hy + hh * 0.22;
      const flick = 0.9 + 0.1 * Math.sin(A.t * 0.06);
      ctx.fillStyle = `rgba(255,206,120,${flick})`;
      ctx.fillRect(winX, winY, winW, winH);
      ctx.fillStyle = '#1b2444';
      ctx.fillRect(winX + winW / 2 - 1, winY, 2, winH);
      ctx.fillRect(winX, winY + winH / 2 - 1, winW, 2);
      // glowing door + knocking figure
      A.doorGlow += ((0.65 + 0.35 * A.beat) - A.doorGlow) * 0.1;
      const g = A.doorGlow;
      const dw = hw * 0.32, dh = hh * 0.46, dx = hx + hw * 0.12, dy = groundY - dh, dcx = dx + dw / 2, dcy = dy + dh * 0.4;
      const spill = ctx.createRadialGradient(dcx, dcy, dw * 0.2, dcx, dcy, dw * 3.2);
      spill.addColorStop(0, `rgba(255,190,100,${0.55 * g})`);
      spill.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = spill;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `rgb(${(150 + 95 * g) | 0},${(105 + 80 * g) | 0},${(55 + 50 * g) | 0})`;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.fillStyle = `rgba(255,230,160,${0.85 * g})`;
      ctx.fillRect(dx + dw * 0.82, dy + dh * 0.46, dw * 0.1, dh * 0.08);
      A.ripples = A.ripples.filter((rp) => rp.life > 0);
      A.ripples.forEach((rp) => {
        if (playing) { rp.life -= 0.04; rp.r += (rp.max - rp.r) * 0.08; }
        ctx.strokeStyle = `rgba(255,220,150,${rp.life * 0.6})`;
        ctx.lineWidth = Math.max(1, px * 0.5);
        ctx.beginPath();
        ctx.arc(dcx, dcy, rp.r, 0, TAU);
        ctx.stroke();
      });
      A.wanderer.knockArm *= 0.86;
      hooded(dx - px * 3, groundY, px * 1.1, { knock: A.wanderer.knockArm });
      rain(0.55, playing);
    };

    const sceneNeon = (playing) => {
      const { w, h, groundY, px, figW } = A.layout;
      skyGrad('#160f2e', '#241640', groundY);
      // buildings with colorful neon signs
      const colors = ['255,70,150', '90,220,255', '255,210,90', '170,110,255'];
      A.skyline.forEach((b, bi) => {
        const bh = b.h * 0.85;
        ctx.fillStyle = '#0e0a1f';
        ctx.fillRect(b.x, groundY - bh, b.w, bh);
        const col = colors[bi % colors.length];
        const sy = groundY - bh + 10 + (bi % 3) * 14;
        const glow = ctx.createRadialGradient(b.x + b.w / 2, sy, 0, b.x + b.w / 2, sy, b.w);
        glow.addColorStop(0, `rgba(${col},0.7)`);
        glow.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(b.x - 10, sy - 14, b.w + 20, 28);
        ctx.fillStyle = `rgba(${col},0.95)`;
        ctx.fillRect(b.x + 6, sy, b.w - 12, px);
      });
      // wet street with colorful reflections
      ctx.fillStyle = '#0c0a1c';
      ctx.fillRect(0, groundY, w, h - groundY);
      A.skyline.forEach((b, bi) => {
        ctx.fillStyle = `rgba(${colors[bi % colors.length]},0.12)`;
        ctx.fillRect(b.x, groundY, b.w, h - groundY);
      });
      if (playing) { A.wanderer.x += Math.max(1, w * 0.0026); A.wanderer.walk += 0.22; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      hooded(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
      rain(0.75, playing, 'rgba(200,180,240,');
    };

    const sceneStorm = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#0c0f1d', '#1b1830', groundY);
      if (playing && Math.random() < 0.02) A.flash = 1;
      if (playing) A.flash *= 0.86;
      if (A.flash > 0.02) {
        ctx.fillStyle = `rgba(205,218,255,${A.flash * 0.55})`;
        ctx.fillRect(0, 0, w, h);
        if (A.flash > 0.6) {
          ctx.strokeStyle = `rgba(240,245,255,${A.flash})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          let lx = w * (0.2 + Math.random() * 0.5), ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < groundY * 0.85) { lx += (Math.random() - 0.5) * 44; ly += 16 + Math.random() * 22; ctx.lineTo(lx, ly); }
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#0a0c18';
      ctx.fillRect(0, groundY, w, h - groundY);
      const cx = w * 0.5;
      const pool = ctx.createRadialGradient(cx, groundY + px, 0, cx, groundY + px, px * 14);
      pool.addColorStop(0, 'rgba(180,30,40,0.7)');
      pool.addColorStop(1, 'rgba(180,30,40,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(cx - px * 14, groundY - px * 3, px * 28, px * 9);
      ctx.fillStyle = SIL;
      ctx.beginPath();
      ctx.ellipse(cx, groundY - px * 2.4, px * 4.6, px * 2.8, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + px * 2.6, groundY - px * 4, px * 2.1, 0, TAU);
      ctx.fill();
      if (playing && A.t % 9 === 0) A.smoke.push({ x: cx + (Math.random() - 0.5) * px * 8, y: groundY - px * 3, r: px * 2, life: 1 });
      A.smoke = A.smoke.filter((s) => s.life > 0);
      A.smoke.forEach((s) => {
        if (playing) { s.y -= 0.6; s.r += 0.5; s.life -= 0.012; }
        ctx.fillStyle = `rgba(80,86,104,${s.life * 0.4})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      });
      rain(1, playing);
    };

    const sceneBoat = (playing) => {
      const { w, h, px } = A.layout;
      const waterY = h * 0.56;
      skyGrad('#0e1740', '#1d2a5e', waterY);
      moon(w * 0.74, h * 0.2, Math.max(11, h * 0.06));
      stars(0.9);
      ctx.fillStyle = '#0c1430';
      ctx.beginPath();
      ctx.moveTo(0, waterY); ctx.lineTo(0, waterY - h * 0.18); ctx.lineTo(w * 0.14, waterY - h * 0.22); ctx.lineTo(w * 0.22, waterY); ctx.closePath();
      ctx.fill();
      const wave = (x) => waterY + Math.sin(x * 0.03 + A.t * 0.05) * 6 + Math.sin(x * 0.07 - A.t * 0.03) * 3;
      const wg = ctx.createLinearGradient(0, waterY, 0, h);
      wg.addColorStop(0, '#1a3260');
      wg.addColorStop(1, '#0b1430');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, wave(x));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(226,232,240,0.16)';
      for (let y = waterY; y < h; y += px * 2) {
        const ww = px * (2 + 3 * Math.abs(Math.sin(y * 0.2 + A.t * 0.08)));
        ctx.fillRect(w * 0.74 - ww / 2, y, ww, px);
      }
      const bx = w * 0.46, by = wave(bx);
      const tilt = (wave(bx + px * 6) - wave(bx - px * 6)) / (px * 12);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan(tilt));
      ctx.fillStyle = '#0a0b16';
      ctx.beginPath();
      ctx.moveTo(-px * 8, 0); ctx.lineTo(px * 8, 0); ctx.lineTo(px * 5, px * 3); ctx.lineTo(-px * 5, px * 3); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -px * 4, px * 1.8, 0, TAU);
      ctx.fill();
      ctx.fillRect(-px * 2.2, -px * 4, px * 4.4, px * 4);
      const stroke = Math.sin(A.t * 0.06) * 0.5;
      ctx.strokeStyle = RIM;
      ctx.lineWidth = Math.max(2, px * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, -px * 2);
      ctx.lineTo(px * 9 * Math.cos(stroke), px * 9 * Math.sin(stroke) + px);
      ctx.stroke();
      ctx.restore();
      rain(0.25, playing);
    };

    const sceneSunset = (playing) => {
      const { w, h, groundY, px } = A.layout;
      const waterY = h * 0.6;
      const g = ctx.createLinearGradient(0, 0, 0, waterY);
      g.addColorStop(0, '#3b2a6b');
      g.addColorStop(0.55, '#e9694e');
      g.addColorStop(1, '#ffc24a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, waterY);
      const sxp = w * 0.5, syp = waterY - h * 0.06;
      sun(sxp, syp, Math.max(16, h * 0.1), '#ffd86b');
      // sea reflecting the sun
      const wg = ctx.createLinearGradient(0, waterY, 0, h);
      wg.addColorStop(0, '#d8623f');
      wg.addColorStop(1, '#6b2f53');
      ctx.fillStyle = wg;
      ctx.fillRect(0, waterY, w, h - waterY);
      ctx.fillStyle = 'rgba(255,216,107,0.5)';
      for (let y = waterY; y < h; y += px * 2) {
        const ww = px * (3 + 5 * Math.abs(Math.sin(y * 0.18 + A.t * 0.06)));
        ctx.fillRect(sxp - ww / 2, y, ww, px);
      }
      // pier + figure silhouette
      ctx.fillStyle = '#241018';
      ctx.fillRect(0, groundY, w, h - groundY);
      hooded(w * 0.3, groundY, px, {});
    };

    const sceneDawn = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#2a3b86', '#f7b06a', groundY);
      const sxp = w * 0.66, syp = groundY - h * 0.04;
      sun(sxp, syp, Math.max(12, h * 0.06), '#ffe6a0');
      const hx = w * 0.56, hy = groundY - h * 0.5, hw = w * 0.32, hh = h * 0.5;
      ctx.fillStyle = '#36406a';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = '#283457';
      ctx.beginPath();
      ctx.moveTo(hx - hw * 0.08, hy); ctx.lineTo(hx + hw * 0.5, hy - hh * 0.24); ctx.lineTo(hx + hw * 1.08, hy); ctx.closePath();
      ctx.fill();
      const dw = hw * 0.34, dh = hh * 0.5, dx = hx + hw * 0.14, dy = groundY - dh;
      ctx.fillStyle = 'rgba(255,238,185,0.97)';
      ctx.fillRect(dx, dy, dw, dh);
      const beam = ctx.createLinearGradient(dx, dy, dx, h);
      beam.addColorStop(0, 'rgba(255,228,165,0.6)');
      beam.addColorStop(1, 'rgba(255,228,165,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(dx, groundY); ctx.lineTo(dx + dw, groundY); ctx.lineTo(dx + dw * 2.4, h); ctx.lineTo(dx - dw * 1.4, h); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(dx - dw * 0.18, dy, dw * 0.18, dh);
      ctx.fillStyle = '#2a2014';
      ctx.fillRect(0, groundY, w, h - groundY);
      hooded(dx + dw / 2, groundY, px, {});
      if (playing && A.t % 14 === 0) A.motes.push({ x: dx + Math.random() * dw, y: groundY, life: 1 });
      A.motes = A.motes.filter((m) => m.life > 0);
      A.motes.forEach((m) => {
        if (playing) { m.y -= 0.5; m.life -= 0.008; }
        ctx.fillStyle = `rgba(255,238,185,${m.life * 0.7})`;
        ctx.fillRect(m.x, m.y, px * 0.8, px * 0.8);
      });
    };

    const SCENES = {
      street: sceneStreet, day: sceneDay, citywalk: sceneCitywalk, room: sceneRoom,
      train: sceneTrain, rooftop: sceneRooftop, house: sceneHouse, neon: sceneNeon,
      storm: sceneStorm, boat: sceneBoat, sunset: sceneSunset, dawn: sceneDawn,
    };

    const draw = () => {
      const L = A.layout;
      if (!L) return;
      A.t += 1;
      const playing = playingRef.current;
      A.beat *= 0.9;
      const target = sceneRef.current;
      if (A.sceneCur !== target) {
        A.veil += (1 - A.veil) * 0.14;
        if (A.veil > 0.92) A.sceneCur = target;
      } else {
        A.veil += (0 - A.veil) * 0.14;
      }
      ctx.clearRect(0, 0, L.w, L.h);
      (SCENES[A.sceneCur] || sceneStreet)(playing);
      if (A.veil > 0.01) {
        ctx.fillStyle = `rgba(2,3,8,${A.veil})`;
        ctx.fillRect(0, 0, L.w, L.h);
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const cw = parent.clientWidth, chh = parent.clientHeight;
      if (!cw || !chh) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cw * dpr;
      canvas.height = chh * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${chh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      setup(cw, chh);
    };

    onResize();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [A]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
