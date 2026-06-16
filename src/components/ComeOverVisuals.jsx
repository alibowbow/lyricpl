import React, { useRef, useEffect, useCallback } from 'react';

// --- Pixel-art multi-scene visualizer for "Come Over" ----------------------
// Instead of one scene that only recolors, the canvas cuts between several
// distinct scenes that follow the song (driven by the `scene` prop), with a
// fade-through-dark transition between them:
//   room   — a lone figure in an empty room, calling, phone glowing
//   street — walking through the rain past streetlamps toward a far house
//   door   — close-up at the door, knocking on every beat
//   storm  — slumped on the ground, heavy rain, lightning, smoke ("blood")
//   boat   — rowing a small boat across dark water under the moon
//   dawn   — the door opens, warm light pours out, the rain stops

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
    stars: [], drops: [], splashes: [], ripples: [], smoke: [], motes: [],
    wanderer: { x: 0, knockArm: 0, walk: 0 },
    beat: 0, flash: 0, doorGlow: 0.5,
    sceneCur: null, veil: 0,
    layout: null, t: 0,
  }).current;

  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const triggerBeat = useCallback(() => {
    A.beat = 1;
    if (A.layout && A.sceneCur === 'door') {
      A.ripples.push({ r: A.layout.px * 2, life: 1, max: A.layout.w * 0.2 });
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
      A.splashes = []; A.ripples = []; A.smoke = []; A.motes = [];
    };

    // --- shared drawing helpers ---
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
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
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

    const stars = (alpha) => {
      A.stars.forEach((s) => {
        s.ph += s.sp;
        ctx.globalAlpha = alpha * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(s.ph)));
        ctx.fillStyle = '#dbe4f5';
        ctx.fillRect(s.x, s.y, s.r, s.r);
      });
      ctx.globalAlpha = 1;
    };

    const moon = (x, y, r) => {
      const halo = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4);
      halo.addColorStop(0, 'rgba(226,232,240,0.3)');
      halo.addColorStop(1, 'rgba(226,232,240,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, A.layout.w, A.layout.h);
      ctx.fillStyle = '#eef2f7';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(15,23,42,0.5)';
      ctx.beginPath();
      ctx.arc(x + r * 0.5, y - r * 0.35, r * 0.85, 0, TAU);
      ctx.fill();
    };

    const rain = (intensity, playing) => {
      const { w, groundY } = A.layout;
      ctx.strokeStyle = `rgba(170,190,225,${0.3 * (0.4 + intensity)})`;
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
        ctx.strokeStyle = `rgba(180,200,235,${s.life * 0.4})`;
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
    const sceneRoom = (playing) => {
      const { w, h, groundY, px } = A.layout;
      ctx.fillStyle = '#0a0e1c';
      ctx.fillRect(0, 0, w, h);
      // window
      const wx = w * 0.46, wy = h * 0.12, ww = w * 0.44, wh = h * 0.52;
      skyClip: {
        ctx.save();
        ctx.beginPath();
        ctx.rect(wx, wy, ww, wh);
        ctx.clip();
        const sg = ctx.createLinearGradient(0, wy, 0, wy + wh);
        sg.addColorStop(0, '#0a1738');
        sg.addColorStop(1, '#1b2a55');
        ctx.fillStyle = sg;
        ctx.fillRect(wx, wy, ww, wh);
        stars(1);
        // distant city lights
        for (let i = 0; i < 14; i++) {
          const cx = wx + ((i + 0.5) * ww) / 14;
          const cy = wy + wh * (0.62 + 0.3 * (((i * 37) % 10) / 10));
          ctx.fillStyle = `rgba(255,196,120,${0.5 + 0.4 * Math.sin(A.t * 0.05 + i)})`;
          ctx.fillRect(cx, cy, px, px * (1 + (i % 4)));
        }
        // rain on the glass
        ctx.strokeStyle = 'rgba(150,180,220,0.35)';
        for (let i = 0; i < 18; i++) {
          const rx = wx + ((i * 53 + A.t * 2) % ww);
          const ry = wy + ((i * 71 + A.t * 3) % wh);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 3, ry + 9);
          ctx.stroke();
        }
        ctx.restore();
      }
      // window frame
      ctx.fillStyle = '#04050a';
      ctx.fillRect(wx - px, wy - px, ww + px * 2, px);
      ctx.fillRect(wx - px, wy + wh, ww + px * 2, px);
      ctx.fillRect(wx - px, wy, px, wh);
      ctx.fillRect(wx + ww, wy, px, wh);
      ctx.fillRect(wx + ww / 2 - px / 2, wy, px, wh);
      ctx.fillRect(wx, wy + wh / 2 - px / 2, ww, px);
      // floor
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, groundY, w, h - groundY);
      // seated figure (left), hugging knees
      const fx = w * 0.2;
      ctx.fillStyle = SIL;
      ctx.beginPath();
      ctx.arc(fx, groundY - px * 7, px * 2.4, 0, TAU); // head/hood
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - px * 4, groundY);
      ctx.quadraticCurveTo(fx - px * 4.5, groundY - px * 6, fx, groundY - px * 6);
      ctx.quadraticCurveTo(fx + px * 4.5, groundY - px * 6, fx + px * 4, groundY);
      ctx.closePath();
      ctx.fill();
      // glowing phone in hands, pulsing on the beat
      const pg = 0.55 + 0.45 * A.beat;
      const phx = fx + px * 3, phy = groundY - px * 5;
      const glow = ctx.createRadialGradient(phx, phy, 0, phx, phy, px * 6);
      glow.addColorStop(0, `rgba(120,190,255,${0.7 * pg})`);
      glow.addColorStop(1, 'rgba(120,190,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(phx - px * 6, phy - px * 6, px * 12, px * 12);
      ctx.fillStyle = `rgba(190,225,255,${pg})`;
      ctx.fillRect(phx - px * 0.8, phy - px * 1.2, px * 1.6, px * 2.4);
    };

    const sceneStreet = (playing) => {
      const { w, h, groundY, px, figW } = A.layout;
      skyGrad('#0a0e28', '#1b2148', groundY);
      moon(w * 0.16, h * 0.2, Math.max(9, h * 0.05));
      stars(0.9);
      // distant house with a lit window
      ctx.fillStyle = '#0c1124';
      ctx.fillRect(w * 0.8, groundY - h * 0.22, w * 0.16, h * 0.22);
      ctx.fillStyle = 'rgba(255,196,112,0.85)';
      ctx.fillRect(w * 0.84, groundY - h * 0.16, w * 0.05, h * 0.05);
      // street + streetlamps with light cones
      ctx.fillStyle = '#080b16';
      ctx.fillRect(0, groundY, w, h - groundY);
      [0.32, 0.62].forEach((lx) => {
        const x = w * lx, lampY = groundY - h * 0.34;
        ctx.fillStyle = '#05060c';
        ctx.fillRect(x - px * 0.4, lampY, px * 0.8, h * 0.34);
        const cone = ctx.createLinearGradient(x, lampY, x, groundY);
        cone.addColorStop(0, 'rgba(255,214,150,0.28)');
        cone.addColorStop(1, 'rgba(255,214,150,0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(x - px, lampY);
        ctx.lineTo(x - px * 5, groundY);
        ctx.lineTo(x + px * 5, groundY);
        ctx.lineTo(x + px, lampY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,224,170,0.95)';
        ctx.fillRect(x - px, lampY - px, px * 2, px * 1.6);
        ctx.fillStyle = 'rgba(255,214,150,0.1)'; // puddle reflection
        ctx.fillRect(x - px * 4, groundY, px * 8, h - groundY);
      });
      // wanderer walks across, wrapping around
      if (playing) {
        A.wanderer.x += Math.max(1, w * 0.0028);
        A.wanderer.walk += 0.22;
        if (A.wanderer.x > w + figW) A.wanderer.x = -figW;
      }
      hooded(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
      rain(0.7, playing);
    };

    const sceneDoor = (playing) => {
      const { w, h, groundY, px } = A.layout;
      ctx.fillStyle = '#0b0f1e';
      ctx.fillRect(0, 0, w, h);
      // wall + big door (close-up)
      const dw = w * 0.34, dh = h * 0.66, dx = w * 0.52, dy = h * 0.16;
      const dcx = dx + dw / 2, dcy = dy + dh * 0.4;
      A.doorGlow += ((0.55 + 0.45 * A.beat) - A.doorGlow) * 0.1;
      const g = A.doorGlow;
      // light leaking around the door
      const spill = ctx.createRadialGradient(dcx, dcy, dw * 0.2, dcx, dcy, dw * 2.6);
      spill.addColorStop(0, `rgba(255,184,96,${0.45 * g})`);
      spill.addColorStop(1, 'rgba(255,184,96,0)');
      ctx.fillStyle = spill;
      ctx.fillRect(0, 0, w, h);
      // overhead lamp
      ctx.fillStyle = `rgba(255,220,160,${0.9})`;
      ctx.fillRect(dcx - px, dy - px * 4, px * 2, px * 2);
      // door
      ctx.fillStyle = `rgb(${(110 + 130 * g) | 0},${(74 + 100 * g) | 0},${(38 + 56 * g) | 0})`;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.fillStyle = `rgba(0,0,0,0.25)`;
      ctx.fillRect(dx + dw * 0.12, dy + dh * 0.1, dw * 0.76, dh * 0.34); // panel
      ctx.fillRect(dx + dw * 0.12, dy + dh * 0.52, dw * 0.76, dh * 0.34);
      ctx.fillStyle = `rgba(255,228,160,${0.8 * g})`;
      ctx.fillRect(dx + dw * 0.84, dy + dh * 0.46, dw * 0.08, dh * 0.06); // knob
      // ripples from knocking
      A.ripples = A.ripples.filter((rp) => rp.life > 0);
      A.ripples.forEach((rp) => {
        if (playing) { rp.life -= 0.04; rp.r += (rp.max - rp.r) * 0.08; }
        ctx.strokeStyle = `rgba(255,214,150,${rp.life * 0.6})`;
        ctx.lineWidth = Math.max(1, px * 0.5);
        ctx.beginPath();
        ctx.arc(dcx, dcy, rp.r, 0, TAU);
        ctx.stroke();
      });
      // big wanderer in front, knocking
      A.wanderer.knockArm *= 0.86;
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, groundY, w, h - groundY);
      hooded(w * 0.3, groundY, px * 1.7, { knock: A.wanderer.knockArm });
      rain(0.55, playing);
    };

    const sceneStorm = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#05070f', '#13101c', groundY);
      // lightning
      if (playing && Math.random() < 0.02) A.flash = 1;
      if (playing) A.flash *= 0.86;
      if (A.flash > 0.02) {
        ctx.fillStyle = `rgba(200,214,255,${A.flash * 0.5})`;
        ctx.fillRect(0, 0, w, h);
        if (A.flash > 0.6) {
          ctx.strokeStyle = `rgba(235,242,255,${A.flash})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          let lx = w * (0.2 + Math.random() * 0.5), ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < groundY * 0.8) { lx += (Math.random() - 0.5) * 44; ly += 16 + Math.random() * 22; ctx.lineTo(lx, ly); }
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#04050b';
      ctx.fillRect(0, groundY, w, h - groundY);
      // red pool ("blood on the floor")
      const cx = w * 0.5;
      const pool = ctx.createRadialGradient(cx, groundY + px, 0, cx, groundY + px, px * 12);
      pool.addColorStop(0, 'rgba(150,20,28,0.6)');
      pool.addColorStop(1, 'rgba(150,20,28,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(cx - px * 12, groundY - px * 2, px * 24, px * 8);
      // slumped figure (kneeling, head low)
      ctx.fillStyle = SIL;
      ctx.beginPath();
      ctx.ellipse(cx, groundY - px * 2.2, px * 4.2, px * 2.6, 0, 0, TAU); // body
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + px * 2.4, groundY - px * 3.6, px * 1.9, 0, TAU); // bowed head
      ctx.fill();
      // smoke wisps rising
      if (playing && A.t % 10 === 0) A.smoke.push({ x: cx + (Math.random() - 0.5) * px * 8, y: groundY - px * 3, r: px * 2, life: 1 });
      A.smoke = A.smoke.filter((s) => s.life > 0);
      A.smoke.forEach((s) => {
        if (playing) { s.y -= 0.6; s.r += 0.5; s.life -= 0.012; }
        ctx.fillStyle = `rgba(60,66,80,${s.life * 0.4})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      });
      rain(1, playing);
    };

    const sceneBoat = (playing) => {
      const { w, h, px } = A.layout;
      const waterY = h * 0.58;
      skyGrad('#070b22', '#101840', waterY);
      moon(w * 0.74, h * 0.22, Math.max(10, h * 0.06));
      stars(0.9);
      // distant cliff
      ctx.fillStyle = '#070a16';
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      ctx.lineTo(0, waterY - h * 0.18);
      ctx.lineTo(w * 0.14, waterY - h * 0.22);
      ctx.lineTo(w * 0.22, waterY);
      ctx.closePath();
      ctx.fill();
      // water
      const wave = (x) => waterY + Math.sin(x * 0.03 + A.t * 0.05) * 6 + Math.sin(x * 0.07 - A.t * 0.03) * 3;
      const wg = ctx.createLinearGradient(0, waterY, 0, h);
      wg.addColorStop(0, '#10203f');
      wg.addColorStop(1, '#060a16');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, wave(x));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      // moon reflection shimmer
      ctx.fillStyle = 'rgba(226,232,240,0.12)';
      for (let y = waterY; y < h; y += px * 2) {
        const ww = px * (2 + 3 * Math.abs(Math.sin(y * 0.2 + A.t * 0.08)));
        ctx.fillRect(w * 0.74 - ww / 2, y, ww, px);
      }
      // boat bobbing on the waves, with a rowing oar
      const bx = w * 0.46;
      const by = wave(bx);
      const tilt = (wave(bx + px * 6) - wave(bx - px * 6)) / (px * 12);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan(tilt));
      // hull
      ctx.fillStyle = '#0a0b16';
      ctx.beginPath();
      ctx.moveTo(-px * 8, 0);
      ctx.lineTo(px * 8, 0);
      ctx.lineTo(px * 5, px * 3);
      ctx.lineTo(-px * 5, px * 3);
      ctx.closePath();
      ctx.fill();
      // seated rower
      ctx.beginPath();
      ctx.arc(0, -px * 4, px * 1.8, 0, TAU);
      ctx.fill();
      ctx.fillRect(-px * 2.2, -px * 4, px * 4.4, px * 4);
      // oar sweeping with the beat
      const stroke = Math.sin(A.t * 0.06) * 0.5;
      ctx.strokeStyle = RIM;
      ctx.lineWidth = Math.max(2, px * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, -px * 2);
      ctx.lineTo(px * 9 * Math.cos(stroke), px * 9 * Math.sin(stroke) + px);
      ctx.stroke();
      ctx.restore();
      rain(0.3, playing);
    };

    const sceneDawn = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#1c2b6b', '#f3a460', groundY);
      // sun glow at the horizon
      const sx = w * 0.66, sy = groundY - h * 0.04;
      const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.5);
      sun.addColorStop(0, 'rgba(255,221,150,0.85)');
      sun.addColorStop(1, 'rgba(255,221,150,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
      // house + open door
      const hx = w * 0.56, hy = groundY - h * 0.5, hw = w * 0.32, hh = h * 0.5;
      ctx.fillStyle = '#26304f';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = '#1a2138';
      ctx.beginPath();
      ctx.moveTo(hx - hw * 0.08, hy);
      ctx.lineTo(hx + hw * 0.5, hy - hh * 0.24);
      ctx.lineTo(hx + hw * 1.08, hy);
      ctx.closePath();
      ctx.fill();
      const dw = hw * 0.34, dh = hh * 0.5, dx = hx + hw * 0.14, dy = groundY - dh;
      // bright light pouring out of the open doorway
      ctx.fillStyle = 'rgba(255,236,180,0.95)';
      ctx.fillRect(dx, dy, dw, dh);
      const beam = ctx.createLinearGradient(dx, dy, dx, h);
      beam.addColorStop(0, 'rgba(255,226,160,0.6)');
      beam.addColorStop(1, 'rgba(255,226,160,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(dx, groundY);
      ctx.lineTo(dx + dw, groundY);
      ctx.lineTo(dx + dw * 2.4, h);
      ctx.lineTo(dx - dw * 1.4, h);
      ctx.closePath();
      ctx.fill();
      // open door panel (ajar)
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(dx - dw * 0.18, dy, dw * 0.18, dh);
      // ground
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(0, groundY, w, h - groundY);
      // figure standing in the doorway, silhouetted by the light
      hooded(dx + dw / 2, groundY, px, {});
      // floating light motes
      if (playing && A.t % 14 === 0) A.motes.push({ x: dx + Math.random() * dw, y: groundY, life: 1 });
      A.motes = A.motes.filter((m) => m.life > 0);
      A.motes.forEach((m) => {
        if (playing) { m.y -= 0.5; m.life -= 0.008; }
        ctx.fillStyle = `rgba(255,236,180,${m.life * 0.7})`;
        ctx.fillRect(m.x, m.y, px * 0.8, px * 0.8);
      });
    };

    const SCENES = { room: sceneRoom, street: sceneStreet, door: sceneDoor, storm: sceneStorm, boat: sceneBoat, dawn: sceneDawn };

    const draw = () => {
      const L = A.layout;
      if (!L) return;
      A.t += 1;
      const playing = playingRef.current;
      A.beat *= 0.9;

      // scene transition through a dark veil
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
