import React, { useRef, useEffect } from 'react';

// --- Animated multi-scene visualizer for "Come Over" -----------------------
// A chibi idol character moves through 12 distinct scenes as the song plays,
// fade-through-dark transition. Scenes are intentionally brighter than a plain
// dark night so the art reads clearly.
//   street citywalk day  — getting to you (incl. daytime)
//   room train rooftop    — alone in the city at night
//   house                 — the house, knocking on the glowing door
//   neon storm            — the rap: neon rain, then the dark storm
//   boat sunset dawn       — the bridge and the hopeful ending

const SIL = '#0a0b16';
const RIM = '#33405f';
const TAU = Math.PI * 2;

// "Come Over" character — a chibi (3-head) idol: black hair, charcoal coat, cream scarf.
const PAL = {
  hair: '#16161e', hairHi: '#3a3a4c', skin: '#f4ceaa',
  coat: '#2a2d38', coatShade: '#191b24', inner: '#33333f',
  pants: '#181820', scarf: '#e8e0d0',
};

export default function ComeOverVisuals({
  isPlaying,
  scene = 'street',
  sceneProgress = 0,
  transition = 'dissolve',
  visualEvent = null,
  reducedMotion = false,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const A = useRef({
    stars: [], drops: [], splashes: [], ripples: [], smoke: [], motes: [], clouds: [], skyline: [],
    ghosts: [], pages: [], dust: [], oarRipples: [],
    wanderer: { x: 0, knockArm: 0, walk: 0 },
    houseApproach: 0, houseHurry: false, knockTimer: 0, mood: 'wist',
    beat: 0, flash: 0,
    doorGlow: 0.65, doorGlowTarget: 0.65, doorOpen: 0, doorOpenTarget: 0,
    dawn: 0, dawnTarget: 0, phoneGlow: 0, beam: 0, redPulse: 0,
    rowStroke: 0, headBow: 0, heartPulse: 0, cameraShake: 0, drift: 0, driftTarget: 0,
    sceneCur: null, veil: 0, transitionType: 'dissolve',
    pendingEvent: null, lastEventId: null,
    layout: null, vig: null, t: 0,
  }).current;

  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const progressRef = useRef(sceneProgress);
  progressRef.current = sceneProgress;
  const transitionRef = useRef(transition);
  transitionRef.current = transition;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  // The newest semantic event is queued; the draw loop dispatches it once.
  useEffect(() => {
    if (visualEvent) A.pendingEvent = visualEvent;
  }, [visualEvent, A]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const setup = (w, h) => {
      const px = Math.max(3, Math.floor(h * 0.018));
      A.layout = { w, h, groundY: Math.floor(h * 0.74), px, figW: px * 6 };
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
      A.ghosts = []; A.pages = []; A.dust = []; A.oarRipples = []; A.vig = null;
    };

    // --- chibi idol character (shared head, standing/walking, knock, seated) ---
    const idolHead = (cx, faceCy, hu) => {
      const topY = faceCy - 0.54 * hu, chinY = faceCy + 0.46 * hu;
      const headRx = 0.46 * hu, headRy = 0.52 * hu;
      // face
      ctx.fillStyle = PAL.skin;
      ctx.beginPath();
      ctx.moveTo(cx - headRx, faceCy);
      ctx.quadraticCurveTo(cx - headRx, faceCy + 0.42 * hu, cx, chinY);
      ctx.quadraticCurveTo(cx + headRx, faceCy + 0.42 * hu, cx + headRx, faceCy);
      ctx.quadraticCurveTo(cx + headRx, faceCy - headRy, cx, faceCy - headRy);
      ctx.quadraticCurveTo(cx - headRx, faceCy - headRy, cx - headRx, faceCy);
      ctx.closePath();
      ctx.fill();
      // ears
      ctx.beginPath(); ctx.ellipse(cx - headRx + 0.01 * hu, faceCy + 0.06 * hu, 0.06 * hu, 0.1 * hu, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + headRx - 0.01 * hu, faceCy + 0.06 * hu, 0.06 * hu, 0.1 * hu, 0, 0, TAU); ctx.fill();
      // subtle blush
      ctx.fillStyle = 'rgba(220,130,120,0.16)';
      ctx.beginPath(); ctx.ellipse(cx - 0.27 * hu, faceCy + 0.23 * hu, 0.075 * hu, 0.04 * hu, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 0.27 * hu, faceCy + 0.23 * hu, 0.075 * hu, 0.04 * hu, 0, 0, TAU); ctx.fill();
      // eyes, brows and mouth follow the current mood; a periodic blink keeps
      // the face alive. moods: 'wist' (lonely), 'sad', 'hope', 'smile', 'neutral'.
      const mood = A.mood || 'neutral';
      const eyeY = faceCy + 0.14 * hu, eyeDx = 0.18 * hu, ew = 0.105 * hu, eh = 0.12 * hu;
      const blink = ((A.t + 37) % 210) < 7;
      [-1, 1].forEach((s) => {
        const ex = cx + s * eyeDx;
        if (blink || mood === 'smile') {
          // closed lids: a happy arch for smiles, a soft line mid-blink
          ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 0.045 * hu; ctx.lineCap = 'round';
          ctx.beginPath();
          if (mood === 'smile' && !blink) ctx.arc(ex, eyeY + eh * 0.4, ew * 0.95, Math.PI * 1.12, Math.PI * 1.88);
          else { ctx.moveTo(ex - ew * 0.8, eyeY); ctx.lineTo(ex + ew * 0.8, eyeY); }
          ctx.stroke();
        } else {
          const droop = mood === 'sad' ? 0.78 : mood === 'wist' ? 0.9 : 1;
          ctx.fillStyle = '#2a2230';
          ctx.beginPath(); ctx.ellipse(ex, eyeY + (1 - droop) * eh * 0.5, ew, eh * droop, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath(); ctx.arc(ex - 0.03 * hu, eyeY - 0.03 * hu * droop, 0.028 * hu, 0, TAU); ctx.fill();
        }
      });
      // brows: worried inner-lift when sad, raised arch when hopeful
      ctx.strokeStyle = PAL.hair; ctx.lineWidth = 0.04 * hu; ctx.lineCap = 'round';
      const bY = eyeY - 0.2 * hu;
      if (mood === 'sad') {
        ctx.beginPath(); ctx.moveTo(cx - eyeDx - 0.1 * hu, bY + 0.02 * hu); ctx.quadraticCurveTo(cx - eyeDx, bY, cx - eyeDx + 0.09 * hu, bY - 0.045 * hu); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + eyeDx - 0.09 * hu, bY - 0.045 * hu); ctx.quadraticCurveTo(cx + eyeDx, bY, cx + eyeDx + 0.1 * hu, bY + 0.02 * hu); ctx.stroke();
      } else if (mood === 'hope') {
        ctx.beginPath(); ctx.moveTo(cx - eyeDx - 0.1 * hu, bY - 0.02 * hu); ctx.quadraticCurveTo(cx - eyeDx, bY - 0.075 * hu, cx - eyeDx + 0.09 * hu, bY - 0.025 * hu); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + eyeDx - 0.09 * hu, bY - 0.025 * hu); ctx.quadraticCurveTo(cx + eyeDx, bY - 0.075 * hu, cx + eyeDx + 0.1 * hu, bY - 0.02 * hu); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(cx - eyeDx - 0.1 * hu, bY); ctx.quadraticCurveTo(cx - eyeDx, bY - 0.03 * hu, cx - eyeDx + 0.09 * hu, bY - 0.005 * hu); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + eyeDx - 0.09 * hu, bY - 0.005 * hu); ctx.quadraticCurveTo(cx + eyeDx, bY - 0.03 * hu, cx + eyeDx + 0.1 * hu, bY); ctx.stroke();
      }
      // nose hint
      ctx.strokeStyle = 'rgba(150,110,90,0.45)'; ctx.lineWidth = 0.022 * hu;
      ctx.beginPath(); ctx.moveTo(cx - 0.01 * hu, faceCy + 0.22 * hu); ctx.lineTo(cx + 0.02 * hu, faceCy + 0.27 * hu); ctx.stroke();
      // mouth per mood
      ctx.strokeStyle = '#9a5b4a'; ctx.lineWidth = 0.03 * hu;
      ctx.beginPath();
      if (mood === 'sad') ctx.arc(cx, faceCy + 0.42 * hu, 0.06 * hu, Math.PI * 1.15, Math.PI * 1.85);
      else if (mood === 'wist') { ctx.moveTo(cx - 0.05 * hu, faceCy + 0.36 * hu); ctx.lineTo(cx + 0.05 * hu, faceCy + 0.36 * hu); }
      else if (mood === 'smile') ctx.arc(cx, faceCy + 0.33 * hu, 0.085 * hu, 0.1 * Math.PI, 0.9 * Math.PI);
      else if (mood === 'hope') { ctx.stroke(); ctx.fillStyle = '#9a5b4a'; ctx.beginPath(); ctx.ellipse(cx, faceCy + 0.36 * hu, 0.035 * hu, 0.045 * hu, 0, 0, TAU); ctx.fill(); }
      else ctx.arc(cx, faceCy + 0.34 * hu, 0.07 * hu, 0.12 * Math.PI, 0.88 * Math.PI);
      if (mood !== 'hope') ctx.stroke();
      // hair with side-swept fringe
      ctx.fillStyle = PAL.hair;
      ctx.beginPath();
      ctx.moveTo(cx - headRx - 0.02 * hu, faceCy + 0.05 * hu);
      ctx.quadraticCurveTo(cx - headRx - 0.06 * hu, topY - 0.02 * hu, cx, topY - 0.06 * hu);
      ctx.quadraticCurveTo(cx + headRx + 0.04 * hu, topY - 0.02 * hu, cx + headRx + 0.03 * hu, faceCy + 0.02 * hu);
      ctx.quadraticCurveTo(cx + headRx - 0.02 * hu, faceCy - 0.06 * hu, cx + headRx - 0.06 * hu, faceCy - 0.04 * hu);
      ctx.quadraticCurveTo(cx + 0.24 * hu, faceCy - 0.18 * hu, cx + 0.05 * hu, faceCy - 0.08 * hu);
      ctx.quadraticCurveTo(cx - 0.14 * hu, faceCy - 0.02 * hu, cx - 0.04 * hu, faceCy - 0.16 * hu);
      ctx.quadraticCurveTo(cx - 0.26 * hu, faceCy - 0.04 * hu, cx - 0.34 * hu, faceCy - 0.2 * hu);
      ctx.quadraticCurveTo(cx - headRx - 0.04 * hu, faceCy - 0.12 * hu, cx - headRx - 0.02 * hu, faceCy + 0.05 * hu);
      ctx.closePath();
      ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = PAL.hairHi;
      ctx.beginPath(); ctx.ellipse(cx + 0.13 * hu, topY + 0.17 * hu, 0.12 * hu, 0.045 * hu, -0.45, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const idol = (cx, footY, p, { walk = null, knock = 0 } = {}) => {
      const H = p * 11, hu = H / 3;
      // gait: hips bob while the feet stay planted; idle gets a breathing sway.
      const bob = walk != null ? Math.abs(Math.sin(walk)) * 0.05 * hu : Math.sin(A.t * 0.045) * 0.016 * hu;
      const topY = footY - H - bob;
      ctx.save();
      if (walk != null) {
        // slight forward lean into the stride
        ctx.translate(cx, footY);
        ctx.rotate(0.045);
        ctx.translate(-cx, -footY);
      }
      const faceCy = topY + 0.54 * hu, chinY = topY + 1.0 * hu, shoulderY = topY + 1.12 * hu;
      const waistY = topY + 1.62 * hu, hipY = topY + 1.95 * hu, coatHemY = topY + 2.15 * hu;
      const shHalf = 0.5 * hu, waistHalf = 0.44 * hu, hemHalf = 0.54 * hu, legHalf = 0.15 * hu;
      const sw = walk != null ? Math.sin(walk) * 0.1 * hu : 0;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath();
      ctx.ellipse(cx, footY + 1, hemHalf * 1.25, 0.12 * hu, 0, 0, TAU); ctx.fill();
      // legs + shoes
      ctx.strokeStyle = PAL.pants; ctx.lineWidth = legHalf * 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 0.17 * hu, hipY); ctx.lineTo(cx - 0.19 * hu + sw, footY - 0.13 * hu); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 0.17 * hu, hipY); ctx.lineTo(cx + 0.19 * hu - sw, footY - 0.13 * hu); ctx.stroke();
      ctx.fillStyle = '#111118';
      ctx.beginPath(); ctx.ellipse(cx - 0.22 * hu + sw, footY - 0.06 * hu, 0.2 * hu, 0.1 * hu, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 0.22 * hu - sw, footY - 0.06 * hu, 0.2 * hu, 0.1 * hu, 0, 0, TAU); ctx.fill();
      // coat
      const cg = ctx.createLinearGradient(cx - shHalf, 0, cx + shHalf, 0);
      cg.addColorStop(0, PAL.coatShade); cg.addColorStop(0.45, PAL.coat); cg.addColorStop(1, PAL.coatShade);
      ctx.fillStyle = cg; ctx.beginPath();
      ctx.moveTo(cx - shHalf, shoulderY);
      ctx.quadraticCurveTo(cx - waistHalf * 0.95, waistY, cx - hemHalf, coatHemY);
      ctx.quadraticCurveTo(cx, coatHemY + 0.16 * hu, cx + hemHalf, coatHemY);
      ctx.quadraticCurveTo(cx + waistHalf * 0.95, waistY, cx + shHalf, shoulderY);
      ctx.quadraticCurveTo(cx, shoulderY - 0.3 * hu, cx - shHalf, shoulderY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = PAL.inner; ctx.beginPath();
      ctx.moveTo(cx - 0.13 * hu, shoulderY + 0.05 * hu); ctx.lineTo(cx + 0.13 * hu, shoulderY + 0.05 * hu);
      ctx.lineTo(cx + 0.1 * hu, coatHemY - 0.08 * hu); ctx.lineTo(cx - 0.1 * hu, coatHemY - 0.08 * hu); ctx.closePath(); ctx.fill();
      ctx.fillStyle = PAL.coatShade; ctx.fillRect(cx - waistHalf * 0.9, waistY - 0.05 * hu, waistHalf * 1.8, 0.11 * hu);
      // arms (left always in pocket; right knocks when knock>0)
      ctx.strokeStyle = PAL.coat; ctx.lineWidth = 0.26 * hu; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - shHalf * 0.85, shoulderY + 0.12 * hu); ctx.quadraticCurveTo(cx - hemHalf * 0.95, waistY, cx - waistHalf * 0.6, hipY - 0.05 * hu); ctx.stroke();
      if (knock > 0.04) {
        const hX = cx + (0.62 + 0.5 * knock) * hu, hY = shoulderY - (0.05 + 0.28 * knock) * hu;
        ctx.beginPath(); ctx.moveTo(cx + shHalf * 0.8, shoulderY + 0.12 * hu); ctx.quadraticCurveTo(cx + 0.66 * hu, shoulderY - 0.05 * hu, hX, hY); ctx.stroke();
        ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.arc(hX, hY, 0.1 * hu, 0, TAU); ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(cx + shHalf * 0.85, shoulderY + 0.12 * hu); ctx.quadraticCurveTo(cx + hemHalf * 0.95, waistY, cx + waistHalf * 0.6, hipY - 0.05 * hu); ctx.stroke();
      }
      // scarf
      ctx.fillStyle = PAL.scarf; ctx.beginPath();
      ctx.moveTo(cx - 0.34 * hu, chinY - 0.05 * hu); ctx.lineTo(cx + 0.34 * hu, chinY - 0.05 * hu);
      ctx.lineTo(cx + 0.22 * hu, shoulderY + 0.2 * hu); ctx.lineTo(cx - 0.22 * hu, shoulderY + 0.2 * hu); ctx.closePath(); ctx.fill();
      ctx.fillRect(cx + 0.02 * hu, shoulderY + 0.05 * hu, 0.16 * hu, 0.5 * hu);
      // neck + head
      ctx.fillStyle = PAL.skin; ctx.fillRect(cx - 0.12 * hu, chinY - 0.12 * hu, 0.24 * hu, 0.22 * hu);
      idolHead(cx, faceCy, hu);
      // cool rim light on the right contour
      ctx.strokeStyle = 'rgba(150,180,230,0.5)'; ctx.lineWidth = 0.045 * hu; ctx.beginPath();
      ctx.moveTo(cx + shHalf * 0.96, shoulderY);
      ctx.quadraticCurveTo(cx + hemHalf * 0.98, waistY, cx + hemHalf * 0.94, coatHemY);
      ctx.stroke();
      ctx.restore();
    };

    const idolSit = (cx, hipY, p, { dangle = false, noLegs = false } = {}) => {
      const hu = p * (11 / 3);
      const shoulderY = hipY - 1.05 * hu;
      const faceCy = shoulderY - 0.62 * hu, chinY = faceCy + 0.46 * hu;
      const shHalf = 0.5 * hu, hipHalf = 0.52 * hu, legHalf = 0.15 * hu;
      if (!noLegs) {
        ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath();
        ctx.ellipse(cx, hipY + (dangle ? 1.5 * hu : 0.62 * hu), 0.75 * hu, 0.12 * hu, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = PAL.pants; ctx.lineWidth = legHalf * 2; ctx.lineCap = 'round';
        if (dangle) {
          ctx.beginPath(); ctx.moveTo(cx - 0.2 * hu, hipY); ctx.lineTo(cx - 0.22 * hu, hipY + 1.35 * hu); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 0.2 * hu, hipY); ctx.lineTo(cx + 0.22 * hu, hipY + 1.35 * hu); ctx.stroke();
          ctx.fillStyle = '#111118';
          ctx.beginPath(); ctx.ellipse(cx - 0.22 * hu, hipY + 1.42 * hu, 0.16 * hu, 0.09 * hu, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + 0.22 * hu, hipY + 1.42 * hu, 0.16 * hu, 0.09 * hu, 0, 0, TAU); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(cx - 0.18 * hu, hipY - 0.05 * hu); ctx.quadraticCurveTo(cx - 0.62 * hu, hipY + 0.2 * hu, cx - 0.64 * hu, hipY + 0.62 * hu); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 0.18 * hu, hipY - 0.05 * hu); ctx.quadraticCurveTo(cx + 0.62 * hu, hipY + 0.2 * hu, cx + 0.64 * hu, hipY + 0.62 * hu); ctx.stroke();
          ctx.fillStyle = '#111118';
          ctx.beginPath(); ctx.ellipse(cx - 0.66 * hu, hipY + 0.64 * hu, 0.18 * hu, 0.09 * hu, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + 0.66 * hu, hipY + 0.64 * hu, 0.18 * hu, 0.09 * hu, 0, 0, TAU); ctx.fill();
        }
      }
      // seated torso
      const cg = ctx.createLinearGradient(cx - shHalf, 0, cx + shHalf, 0);
      cg.addColorStop(0, PAL.coatShade); cg.addColorStop(0.45, PAL.coat); cg.addColorStop(1, PAL.coatShade);
      ctx.fillStyle = cg; ctx.beginPath();
      ctx.moveTo(cx - shHalf, shoulderY);
      ctx.quadraticCurveTo(cx - hipHalf, (shoulderY + hipY) / 2, cx - hipHalf, hipY + 0.08 * hu);
      ctx.quadraticCurveTo(cx, hipY + 0.28 * hu, cx + hipHalf, hipY + 0.08 * hu);
      ctx.quadraticCurveTo(cx + hipHalf, (shoulderY + hipY) / 2, cx + shHalf, shoulderY);
      ctx.quadraticCurveTo(cx, shoulderY - 0.3 * hu, cx - shHalf, shoulderY);
      ctx.closePath(); ctx.fill();
      // arms resting in lap
      ctx.strokeStyle = PAL.coat; ctx.lineWidth = 0.24 * hu; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - shHalf * 0.8, shoulderY + 0.15 * hu); ctx.quadraticCurveTo(cx - hipHalf * 0.95, hipY - 0.25 * hu, cx - 0.08 * hu, hipY - 0.05 * hu); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + shHalf * 0.8, shoulderY + 0.15 * hu); ctx.quadraticCurveTo(cx + hipHalf * 0.95, hipY - 0.25 * hu, cx + 0.08 * hu, hipY - 0.05 * hu); ctx.stroke();
      // scarf
      ctx.fillStyle = PAL.scarf; ctx.beginPath();
      ctx.moveTo(cx - 0.34 * hu, chinY - 0.05 * hu); ctx.lineTo(cx + 0.34 * hu, chinY - 0.05 * hu);
      ctx.lineTo(cx + 0.22 * hu, shoulderY + 0.2 * hu); ctx.lineTo(cx - 0.22 * hu, shoulderY + 0.2 * hu); ctx.closePath(); ctx.fill();
      ctx.fillRect(cx + 0.02 * hu, shoulderY + 0.05 * hu, 0.16 * hu, 0.42 * hu);
      // neck + head (with a soft breathing bob)
      ctx.fillStyle = PAL.skin; ctx.fillRect(cx - 0.12 * hu, chinY - 0.12 * hu, 0.24 * hu, 0.22 * hu);
      idolHead(cx, faceCy + Math.sin(A.t * 0.05) * 0.02 * hu, hu);
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
      halo.addColorStop(0, `rgba(226,232,240,${0.34 + 0.06 * Math.sin(A.t * 0.02)})`);
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
        // soft-edged puffs: radial falloff instead of hard ellipses
        const faded = color.replace(/[\d.]+\)$/u, '0)');
        [[0, 0, 1], [c.s * 1.3, c.s * 0.2, 0.8], [-c.s * 1.2, c.s * 0.25, 0.75]].forEach(([dx, dy, sc]) => {
          const r = c.s * sc;
          const g = ctx.createRadialGradient(c.x + dx, c.y + dy, r * 0.25, c.x + dx, c.y + dy, r * 1.15);
          g.addColorStop(0, color);
          g.addColorStop(1, faded);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(c.x + dx, c.y + dy, r * 1.15, r * 0.72, 0, 0, TAU);
          ctx.fill();
        });
      });
    };

    // A light source reflected on wet ground: a fading vertical streak whose
    // width shimmers slowly, so night streets read as rain-slicked.
    const wetGlow = (x, topY, width, height, colorPrefix, alpha = 0.25, phase = 0) => {
      const g = ctx.createLinearGradient(0, topY, 0, topY + height);
      g.addColorStop(0, `${colorPrefix}${alpha})`);
      g.addColorStop(1, `${colorPrefix}0)`);
      ctx.fillStyle = g;
      const wob = 1 + Math.sin(A.t * 0.04 + phase) * 0.14;
      ctx.fillRect(x - (width * wob) / 2, topY, width * wob, height);
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
      const reduced = reducedRef.current;
      const sway = Math.sin(A.t * 0.011) * 0.14; // slow wind drift in the streak angle
      // two depth layers: far = thin/slow/faint, near = thicker/faster/brighter
      for (let layer = 0; layer < 2; layer += 1) {
        const near = layer === 1;
        ctx.strokeStyle = `${color}${(near ? 0.34 : 0.15) * (0.4 + intensity)})`;
        ctx.lineWidth = near ? 1.4 : 1;
        ctx.beginPath();
        A.drops.forEach((d, i) => {
          if ((i % 2 === 0) !== near) return; // disjoint halves per layer
          if (intensity < 0.4 && i % 4 === 0) return;
          if (reduced && i % 3 !== 0) return; // ~2/3 fewer drops
          const fall = near ? 1 : 0.55;
          const len = d.len * (0.6 + intensity) * fall;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - len * (0.28 + sway), d.y - len);
          if (playing) {
            d.y += d.sp * (0.5 + intensity) * fall;
            d.x += d.sp * (0.28 + sway) * fall;
            if (d.y > groundY) {
              if (near && Math.random() < 0.5 * intensity) A.splashes.push({ x: d.x, y: groundY, r: 0, life: 1 });
              d.y = -10;
              d.x = Math.random() * (w + 60) - 30;
            }
          }
        });
        ctx.stroke();
      }
      if (A.splashes.length > 70) A.splashes.splice(0, A.splashes.length - 70);
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
        const flick = 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(A.t * 0.17 + x));
        ctx.fillStyle = '#0a1024';
        ctx.fillRect(x - px * 0.4, lampY, px * 0.8, h * 0.34);
        const cone = ctx.createLinearGradient(x, lampY, x, groundY);
        cone.addColorStop(0, `rgba(255,219,150,${0.42 * flick})`);
        cone.addColorStop(1, 'rgba(255,219,150,0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(x - px, lampY); ctx.lineTo(x - px * 6, groundY); ctx.lineTo(x + px * 6, groundY); ctx.lineTo(x + px, lampY); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(255,240,200,${0.7 + 0.3 * flick})`;
        ctx.fillRect(x - px, lampY - px, px * 2, px * 1.6);
        wetGlow(x, groundY, px * 9, h - groundY, 'rgba(255,219,150,', 0.2 * flick, x);
      });
      wetGlow(w * 0.16, groundY, px * 7, (h - groundY) * 0.9, 'rgba(226,232,240,', 0.12, 1);
      if (playing) { A.wanderer.x += Math.max(1, w * 0.0028); A.wanderer.walk += 0.22; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
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
      for (let x = 0; x < w; x += px * 2) {
        ctx.fillRect(x, groundY, px, -px * (1 + ((x * 7) % 3) + 0.5 * Math.sin(A.t * 0.05 + x * 0.25)));
      }
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
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
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
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
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
      const fx = w * 0.22;
      idolSit(fx, groundY - px * 0.5, px, {});
      const pg = 0.6 + 0.4 * Math.max(A.beat, A.phoneGlow);
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
        const sp = i % 2 ? 6.5 : 3.2; // near lights streak past faster than far ones
        const x = w * 0.08 + ((i * 53 + A.t * sp) % (w * 0.84));
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
      idolSit(w * 0.32, groundY - px * 2, px, {});
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
      idolSit(w * 0.3, groundY, px, { dangle: true });
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
      // glowing door + knocking figure (doorGlow/doorOpen eased in main loop)
      const g = Math.min(1.4, A.doorGlow + A.heartPulse * 0.3);
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
      // 'door-open' / 'final-open' cue — a warm opening widens from the hinge.
      if (A.doorOpen > 0.01) {
        const ow = dw * Math.min(1, A.doorOpen);
        const og = ctx.createLinearGradient(dx, 0, dx + ow, 0);
        og.addColorStop(0, 'rgba(255,238,180,0.95)');
        og.addColorStop(1, 'rgba(255,205,125,0.45)');
        ctx.fillStyle = og;
        ctx.fillRect(dx, dy, ow, dh);
      }
      wetGlow(dcx, groundY, dw * 1.5, h - groundY, 'rgba(255,190,100,', 0.24 * g + A.doorOpen * 0.14, 2);
      A.ripples = A.ripples.filter((rp) => rp.life > 0);
      A.ripples.forEach((rp) => {
        if (playing) { rp.life -= 0.04; rp.r += (rp.max - rp.r) * 0.08; }
        ctx.strokeStyle = `rgba(255,220,150,${rp.life * 0.6})`;
        ctx.lineWidth = Math.max(1, px * 0.5);
        ctx.beginPath();
        ctx.arc(dcx, dcy, rp.r, 0, TAU);
        ctx.stroke();
      });
      // One slow stroll to the door per house visit. The position is persistent
      // state (not segment progress), so segment changes can never teleport him
      // back; once he arrives he simply stays and knocks gently on cue.
      if (playing && A.houseApproach < 1) {
        A.houseApproach = Math.min(1, A.houseApproach + (A.houseHurry ? 0.011 : 0.0026));
      }
      const ap = A.houseApproach;
      const ease = ap * ap * (3 - 2 * ap); // smoothstep: soft start, soft stop
      const restX = dx - px * 3;
      const startX = Math.max(px * 4, restX - w * 0.24);
      const walkX = startX + (restX - startX) * ease;
      const arriving = ap < 0.985;
      idol(walkX, groundY, px * 1.1, {
        knock: arriving ? 0 : A.wanderer.knockArm,
        walk: arriving ? A.wanderer.walk : null,
      });
      if (playing && arriving) A.wanderer.walk += 0.16;
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
        // every 4th sign is a faulty tube that stutters
        const on = bi % 4 === 2 ? (Math.sin(A.t * 0.31 + bi * 7) > -0.15 ? 1 : 0.25) : 1;
        const glow = ctx.createRadialGradient(b.x + b.w / 2, sy, 0, b.x + b.w / 2, sy, b.w);
        glow.addColorStop(0, `rgba(${col},${0.7 * on})`);
        glow.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(b.x - 10, sy - 14, b.w + 20, 28);
        ctx.fillStyle = `rgba(${col},${0.95 * on})`;
        ctx.fillRect(b.x + 6, sy, b.w - 12, px);
      });
      // wet street with colorful reflections
      ctx.fillStyle = '#0c0a1c';
      ctx.fillRect(0, groundY, w, h - groundY);
      A.skyline.forEach((b, bi) => {
        wetGlow(b.x + b.w / 2, groundY, b.w * 0.9, h - groundY, `rgba(${colors[bi % colors.length]},`, 0.14, bi);
      });
      // 'blood-pulse' cue — wet-floor reflection flushes red briefly.
      if (A.redPulse > 0.01) {
        ctx.fillStyle = `rgba(180,30,46,${A.redPulse * 0.28})`;
        ctx.fillRect(0, groundY, w, h - groundY);
      }
      if (playing) { A.wanderer.x += Math.max(1, w * 0.0026); A.wanderer.walk += 0.22; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
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
      idolSit(cx, groundY - px * 1.5, px, {});
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
      idolSit(0, -px * 0.5, px, { noLegs: true });
      const stroke = Math.sin(A.t * 0.06) * (0.5 + A.rowStroke * 0.6);
      ctx.strokeStyle = RIM;
      ctx.lineWidth = Math.max(2, px * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, -px * 2);
      ctx.lineTo(px * 9 * Math.cos(stroke), px * 9 * Math.sin(stroke) + px);
      ctx.stroke();
      ctx.restore();
      // oar ripples ride the waterline on each row stroke
      if (playing && A.rowStroke > 0.55 && A.t % 5 === 0 && A.oarRipples.length < 8) {
        const tipX = bx + px * 9 * Math.cos(stroke);
        A.oarRipples.push({ x: tipX, y: wave(tipX) + 1, r: px * 0.8, life: 1 });
      }
      A.oarRipples = A.oarRipples.filter((rp) => rp.life > 0);
      A.oarRipples.forEach((rp) => {
        if (playing) { rp.r += 0.7; rp.life -= 0.028; }
        ctx.strokeStyle = `rgba(205,225,255,${Math.max(0, rp.life) * 0.45})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r * 1.7, rp.r * 0.5, 0, 0, TAU);
        ctx.stroke();
      });
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
      idol(w * 0.3, groundY, px, {});
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
      idol(dx + dw / 2, groundY, px, {});
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
    const WALK_SCENES = { street: 1, citywalk: 1, neon: 1, train: 1 };
    const DRIFT_CUES = { 'lost-drift': 1, 'lost-echo': 1, 'ghost-trail': 1, 'cliff-wind': 1 };
    // how each lyric moment reads on the character's face
    const MOOD_BY_CUE = {
      'night-fall': 'wist', 'lost-drift': 'wist', 'lost-echo': 'sad',
      apology: 'sad', 'apology-reflection': 'sad', 'bury-memory': 'sad',
      'phone-glow': 'wist', 'phone-check': 'wist', 'late-clock': 'wist',
      'rewind-restart': 'smile', 'night-window': 'wist', 'return-route': 'hope',
      'approach-door': 'hope', 'arrive-door': 'hope', 'echo-over': 'sad',
      'love-fade': 'sad', 'door-open': 'hope', knock: 'hope', 'heartbeat-knock': 'hope',
      'blood-pulse': 'sad', question: 'sad', 'ghost-trail': 'wist', 'dust-beam': 'wist',
      smoke: 'sad', 'metaphor-distort': 'neutral', 'cliff-wind': 'sad', 'hurt-storm': 'sad',
      'rescue-light': 'smile', 'page-turn': 'smile', 'pain-fade': 'smile',
      'row-forward': 'smile', 'final-open': 'smile',
    };

    // --- particle emitters (all capped) ---
    const pushDoorRipple = (str = 1) => {
      if (!A.layout) return;
      A.ripples.push({ r: A.layout.px * 2, life: 1, max: A.layout.w * 0.16 * (0.7 + str) });
      if (A.ripples.length > 6) A.ripples.shift();
    };
    const emitWarmMotes = (n) => {
      if (!A.layout) return;
      const { w, groundY } = A.layout;
      for (let i = 0; i < n && A.motes.length < 70; i += 1) {
        A.motes.push({ x: w * (0.3 + Math.random() * 0.4), y: groundY * (0.55 + Math.random() * 0.4), life: 1 });
      }
    };
    const emitSmoke = (n) => {
      if (!A.layout) return;
      const { w, groundY, px } = A.layout;
      for (let i = 0; i < n && A.smoke.length < 40; i += 1) {
        A.smoke.push({ x: w * 0.5 + (Math.random() - 0.5) * px * 10, y: groundY - px * 3, r: px * 2, life: 1 });
      }
    };
    const emitDust = (n) => {
      if (!A.layout) return;
      const { w, h } = A.layout;
      for (let i = 0; i < n && A.dust.length < 50; i += 1) {
        A.dust.push({ x: w * (0.4 + Math.random() * 0.28), y: h * (0.2 + Math.random() * 0.5), life: 1, vy: -(0.1 + Math.random() * 0.2) });
      }
    };
    const emitPages = (n) => {
      if (!A.layout) return;
      const { w, h } = A.layout;
      for (let i = 0; i < n && A.pages.length < 16; i += 1) {
        A.pages.push({ x: -20, y: h * (0.18 + Math.random() * 0.5), life: 1, sp: w * (0.01 + Math.random() * 0.014) });
      }
    };
    const pushGhost = () => {
      A.ghosts.push({ x: A.wanderer.x, life: 1 });
      if (A.ghosts.length > 4) A.ghosts.shift();
    };

    // --- semantic event → canvas state (no generic per-word beat actions) ---
    const triggerVisualEvent = (event) => {
      if (!event || event.id === A.lastEventId) return;
      A.lastEventId = event.id;
      const reduced = reducedRef.current;
      const I = event.intensity ?? 0.5;
      A.beat = Math.max(A.beat, I);
      if (event.wordIndex === 0 && !DRIFT_CUES[event.type]) A.driftTarget = 0;
      if (MOOD_BY_CUE[event.type]) A.mood = MOOD_BY_CUE[event.type];

      switch (event.type) {
        case 'knock':
          // arm the gentle-knock loop (soft repeated taps) instead of a jab
          A.knockTimer = Math.max(A.knockTimer, 110); A.houseHurry = true;
          if (!reduced) A.cameraShake = Math.max(A.cameraShake, 0.22);
          pushDoorRipple(0.8); break;
        case 'heartbeat-knock':
          A.knockTimer = Math.max(A.knockTimer, 130); A.houseHurry = true; A.heartPulse = 1;
          if (!reduced) A.cameraShake = Math.max(A.cameraShake, 0.18);
          pushDoorRipple(0.7); break;
        case 'door-open':
          A.doorOpenTarget = Math.max(A.doorOpenTarget, 0.5); A.doorGlowTarget = 1; A.houseHurry = true; break;
        case 'final-open':
          A.doorOpenTarget = 1; A.doorGlowTarget = 1.3; A.dawnTarget = 1; emitWarmMotes(reduced ? 10 : 24); break;
        case 'arrive-door':
          A.doorGlowTarget = 0.9; A.houseHurry = true; break;
        case 'echo-over':
          pushDoorRipple(0.5); break;
        case 'love-fade':
          A.doorGlowTarget = 0.45; break;
        case 'phone-glow':
        case 'phone-check':
          A.phoneGlow = 1; break;
        case 'smoke':
          emitSmoke(reduced ? 6 : 12); break;
        case 'dust-beam':
          A.beam = 1; emitDust(reduced ? 8 : 20); break;
        case 'blood-pulse':
          A.redPulse = 1; break;
        case 'page-turn':
          emitPages(reduced ? 4 : 8); break;
        case 'row-forward':
          A.rowStroke = 1; break;
        case 'apology':
        case 'apology-reflection':
          A.headBow = 1; A.doorGlowTarget = 0.55; break;
        case 'rescue-light':
          A.dawnTarget = Math.max(A.dawnTarget, 0.4); break;
        case 'lost-drift':
          A.driftTarget = 0.6; break;
        case 'lost-echo':
        case 'ghost-trail':
          if (!reduced) pushGhost(); A.driftTarget = 0.8; break;
        case 'cliff-wind':
          A.driftTarget = 0.5; break;
        case 'hurt-storm':
          if (!reduced) A.cameraShake = Math.max(A.cameraShake, 0.3); break;
        case 'metaphor-distort':
          if (!reduced) A.cameraShake = Math.max(A.cameraShake, 0.25); break;
        default:
          break;
      }
    };

    const drawTransitionOverlay = () => {
      const v = A.veil;
      if (v <= 0.01) return;
      const { w, h } = A.layout;
      switch (A.transitionType) {
        case 'flash-cut':
          ctx.fillStyle = `rgba(235,240,255,${Math.min(0.15, v * 0.15)})`;
          ctx.fillRect(0, 0, w, h);
          break;
        case 'warm-fade':
          ctx.fillStyle = `rgba(18,9,4,${v * 0.9})`; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = `rgba(255,180,90,${v * 0.12})`; ctx.fillRect(0, 0, w, h);
          break;
        case 'light-wipe': {
          ctx.fillStyle = `rgba(4,6,16,${v * 0.85})`; ctx.fillRect(0, 0, w, h);
          const cx = w * (1 - v);
          const wipe = ctx.createLinearGradient(cx - w * 0.2, 0, cx + w * 0.1, 0);
          wipe.addColorStop(0, 'rgba(255,235,200,0)');
          wipe.addColorStop(0.6, `rgba(255,235,200,${v * 0.35})`);
          wipe.addColorStop(1, 'rgba(255,235,200,0)');
          ctx.fillStyle = wipe; ctx.fillRect(0, 0, w, h);
          break;
        }
        case 'rain-wipe':
          ctx.fillStyle = `rgba(6,10,22,${v * 0.9})`; ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = `rgba(150,170,210,${v * 0.4})`; ctx.lineWidth = 1; ctx.beginPath();
          for (let i = 0; i < 26; i += 1) { const x = (i * 57) % w; ctx.moveTo(x, 0); ctx.lineTo(x - 14, h); }
          ctx.stroke();
          break;
        default:
          ctx.fillStyle = `rgba(2,3,8,${v})`; ctx.fillRect(0, 0, w, h);
      }
    };

    const draw = () => {
      const L = A.layout;
      if (!L) return;
      A.t += 1;
      const playing = playingRef.current;
      const reduced = reducedRef.current;

      if (A.pendingEvent) triggerVisualEvent(A.pendingEvent);

      // decays + eased targets (clamped, never NaN)
      A.beat *= 0.9;
      A.phoneGlow *= 0.94; A.redPulse *= 0.92; A.rowStroke *= 0.9; A.beam *= 0.95;
      A.heartPulse *= 0.92; A.headBow *= 0.95; A.cameraShake *= reduced ? 0 : 0.86;
      // gentle knocking: while the timer runs, the arm hovers and taps softly;
      // a faint door ripple lands on each contact, then the arm eases down.
      if (A.knockTimer > 0) {
        if (playing) A.knockTimer -= 1;
        A.wanderer.knockArm = 0.5 + 0.32 * Math.sin(A.t * 0.16);
        const s1 = Math.sin(A.t * 0.16), s0 = Math.sin((A.t - 1) * 0.16);
        if (s1 > 0.94 && s0 <= 0.94 && A.sceneCur === 'house') pushDoorRipple(0.4);
      } else {
        A.wanderer.knockArm *= 0.9;
      }
      A.doorGlow += (A.doorGlowTarget - A.doorGlow) * 0.08;
      A.doorOpen += (A.doorOpenTarget - A.doorOpen) * 0.06;
      A.dawn += (A.dawnTarget - A.dawn) * 0.04;
      A.drift += ((reduced ? 0 : A.driftTarget) - A.drift) * 0.05;

      const target = sceneRef.current;
      if (A.sceneCur !== target) {
        if (A.veil < 0.05) A.transitionType = transitionRef.current;
        A.veil += (1 - A.veil) * 0.16;
        if (A.veil > 0.92) {
          // walking in from the street starts fresh on each visit to the house
          if (target === 'house') { A.houseApproach = 0; A.houseHurry = false; A.knockTimer = 0; }
          A.sceneCur = target;
        }
      } else {
        A.veil += (0 - A.veil) * 0.14;
      }

      ctx.clearRect(0, 0, L.w, L.h);
      ctx.save();
      let tx = 0;
      let ty = 0;
      if (A.cameraShake > 0.01) {
        tx += (Math.random() - 0.5) * A.cameraShake * L.px * 2.2;
        ty += (Math.random() - 0.5) * A.cameraShake * L.px * 2.2;
      }
      if (A.drift > 0.01) tx += Math.sin(A.t * 0.03) * A.drift * L.w * 0.02;
      ctx.translate(tx, ty);
      (SCENES[A.sceneCur] || sceneStreet)(playing);

      // ghost-trail echoes for the walking scenes
      if (A.ghosts.length && WALK_SCENES[A.sceneCur]) {
        for (const gh of A.ghosts) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, gh.life) * 0.22;
          idol(gh.x, L.groundY, L.px, {});
          ctx.restore();
          if (playing) gh.life -= 0.018;
        }
        A.ghosts = A.ghosts.filter((gh) => gh.life > 0);
      }
      // drifting paper for the 'page-turn' cue
      if (A.pages.length) {
        ctx.fillStyle = 'rgba(245,240,225,0.8)';
        for (const pg of A.pages) {
          if (playing) { pg.x += pg.sp; pg.life -= 0.004; }
          ctx.save();
          ctx.translate(pg.x, pg.y + Math.sin(pg.x * 0.05) * L.px);
          ctx.globalAlpha = Math.max(0, Math.min(1, pg.life));
          ctx.fillRect(0, 0, L.px * 3, L.px * 2.2);
          ctx.restore();
        }
        A.pages = A.pages.filter((pg) => pg.life > 0 && pg.x < L.w + 30);
      }
      // dust motes in the flashlight beam ('dust-beam')
      if (A.dust.length) {
        ctx.fillStyle = `rgba(255,240,200,0.6)`;
        for (const d of A.dust) {
          if (playing) { d.y += d.vy; d.life -= 0.01; }
          ctx.globalAlpha = Math.max(0, d.life) * 0.6;
          ctx.fillRect(d.x, d.y, L.px * 0.6, L.px * 0.6);
        }
        ctx.globalAlpha = 1;
        A.dust = A.dust.filter((d) => d.life > 0);
      }
      ctx.restore();

      // 'apology' head-bow read as a soft vignette dimming
      if (A.headBow > 0.02) {
        ctx.fillStyle = `rgba(2,4,10,${A.headBow * 0.28})`;
        ctx.fillRect(0, 0, L.w, L.h);
      }
      // 'final-open' dawn warmth wash
      if (A.dawn > 0.02) {
        ctx.fillStyle = `rgba(255,200,130,${A.dawn * 0.12})`;
        ctx.fillRect(0, 0, L.w, L.h);
      }

      // cached edge vignette — cinematic depth at zero per-frame gradient cost
      if (!A.vig || A.vig.w !== L.w || A.vig.h !== L.h) {
        const vg = ctx.createRadialGradient(
          L.w / 2, L.h * 0.55, Math.min(L.w, L.h) * 0.5,
          L.w / 2, L.h * 0.55, Math.max(L.w, L.h) * 0.92,
        );
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(2,4,12,0.34)');
        A.vig = { w: L.w, h: L.h, g: vg };
      }
      ctx.fillStyle = A.vig.g;
      ctx.fillRect(0, 0, L.w, L.h);

      drawTransitionOverlay();
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
