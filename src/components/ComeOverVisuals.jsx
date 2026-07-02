import React, { useRef, useEffect } from 'react';

// --- Animated multi-scene visualizer for "Come Over" -----------------------
// A chibi idol character moves through 12 distinct scenes as the song plays,
// fade-through-dark transition. Scenes are intentionally brighter than a plain
// dark night so the art reads clearly.
//   street citywalk (dusk) day — getting to you
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

    // soft elliptical ground shadow (radial falloff, no hard edge)
    const softShadow = (cx, y, rx, ry, alpha = 0.36) => {
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
      g.addColorStop(0, `rgba(0,0,0,${alpha})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
      ctx.restore();
    };

    // --- chibi idol character (shared head, standing/walking, knock, seated) ---
    const idolHead = (cx, faceCy, hu, look = 0) => {
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
      // `look` shifts the features toward the walking direction (3/4 view).
      const mood = A.mood || 'neutral';
      const fcx = cx + look * 0.085 * hu;
      const eyeY = faceCy + 0.14 * hu, eyeDx = 0.18 * hu, ew = 0.105 * hu, eh = 0.12 * hu;
      const blink = ((A.t + 37) % 210) < 7;
      [-1, 1].forEach((s) => {
        const ex = fcx + s * eyeDx;
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
        ctx.beginPath(); ctx.moveTo(fcx - eyeDx - 0.1 * hu, bY + 0.02 * hu); ctx.quadraticCurveTo(fcx - eyeDx, bY, fcx - eyeDx + 0.09 * hu, bY - 0.045 * hu); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fcx + eyeDx - 0.09 * hu, bY - 0.045 * hu); ctx.quadraticCurveTo(fcx + eyeDx, bY, fcx + eyeDx + 0.1 * hu, bY + 0.02 * hu); ctx.stroke();
      } else if (mood === 'hope') {
        ctx.beginPath(); ctx.moveTo(fcx - eyeDx - 0.1 * hu, bY - 0.02 * hu); ctx.quadraticCurveTo(fcx - eyeDx, bY - 0.075 * hu, fcx - eyeDx + 0.09 * hu, bY - 0.025 * hu); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fcx + eyeDx - 0.09 * hu, bY - 0.025 * hu); ctx.quadraticCurveTo(fcx + eyeDx, bY - 0.075 * hu, fcx + eyeDx + 0.1 * hu, bY - 0.02 * hu); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(fcx - eyeDx - 0.1 * hu, bY); ctx.quadraticCurveTo(fcx - eyeDx, bY - 0.03 * hu, fcx - eyeDx + 0.09 * hu, bY - 0.005 * hu); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fcx + eyeDx - 0.09 * hu, bY - 0.005 * hu); ctx.quadraticCurveTo(fcx + eyeDx, bY - 0.03 * hu, fcx + eyeDx + 0.1 * hu, bY); ctx.stroke();
      }
      // nose hint
      ctx.strokeStyle = 'rgba(150,110,90,0.45)'; ctx.lineWidth = 0.022 * hu;
      ctx.beginPath(); ctx.moveTo(fcx - 0.01 * hu, faceCy + 0.22 * hu); ctx.lineTo(fcx + 0.02 * hu, faceCy + 0.27 * hu); ctx.stroke();
      // mouth per mood
      ctx.strokeStyle = '#9a5b4a'; ctx.lineWidth = 0.03 * hu;
      ctx.beginPath();
      if (mood === 'sad') ctx.arc(fcx, faceCy + 0.42 * hu, 0.06 * hu, Math.PI * 1.15, Math.PI * 1.85);
      else if (mood === 'wist') { ctx.moveTo(fcx - 0.05 * hu, faceCy + 0.36 * hu); ctx.lineTo(fcx + 0.05 * hu, faceCy + 0.36 * hu); }
      else if (mood === 'smile') ctx.arc(fcx, faceCy + 0.33 * hu, 0.085 * hu, 0.1 * Math.PI, 0.9 * Math.PI);
      else if (mood === 'hope') { ctx.stroke(); ctx.fillStyle = '#9a5b4a'; ctx.beginPath(); ctx.ellipse(fcx, faceCy + 0.36 * hu, 0.035 * hu, 0.045 * hu, 0, 0, TAU); ctx.fill(); }
      else ctx.arc(fcx, faceCy + 0.34 * hu, 0.07 * hu, 0.12 * Math.PI, 0.88 * Math.PI);
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

    const idol = (cx, footY, p, { walk = null, knock = 0, look = null } = {}) => {
      const lookDir = look != null ? look : (walk != null ? 1 : 0);
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
      // shadow
      softShadow(cx, footY + 1, hemHalf * 1.45, 0.14 * hu);
      // legs + shoes — feet stay narrow, under the body. Walking is a scissor
      // stride along the direction of travel with a small lift on the swinging
      // leg, so he steps instead of sliding sideways like a crab.
      ctx.strokeStyle = PAL.pants; ctx.lineWidth = legHalf * 2; ctx.lineCap = 'round';
      const stepA = walk != null ? Math.sin(walk) : 0;
      const stepB = walk != null ? -Math.sin(walk) : 0;
      const liftA = walk != null ? Math.max(0, Math.cos(walk)) * 0.07 * hu : 0;
      const liftB = walk != null ? Math.max(0, -Math.cos(walk)) * 0.07 * hu : 0;
      const fAx = cx - 0.1 * hu + stepA * 0.13 * hu, fAy = footY - 0.11 * hu - liftA;
      const fBx = cx + 0.1 * hu + stepB * 0.13 * hu, fBy = footY - 0.11 * hu - liftB;
      ctx.beginPath(); ctx.moveTo(cx - 0.08 * hu, hipY); ctx.lineTo(fAx, fAy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 0.08 * hu, hipY); ctx.lineTo(fBx, fBy); ctx.stroke();
      ctx.fillStyle = '#111118';
      const toe = walk != null ? 0.05 * hu : 0; // shoes point where he is going
      ctx.beginPath(); ctx.ellipse(fAx + toe, fAy + 0.06 * hu, 0.16 * hu, 0.085 * hu, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(fBx + toe, fBy + 0.06 * hu, 0.16 * hu, 0.085 * hu, 0, 0, TAU); ctx.fill();
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
        ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.arc(hX, hY, 0.085 * hu, 0, TAU); ctx.fill();
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
      idolHead(cx, faceCy, hu, lookDir);
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
        softShadow(cx, hipY + (dangle ? 1.5 * hu : 0.62 * hu), 0.65 * hu, 0.13 * hu, 0.3);
        ctx.strokeStyle = PAL.pants; ctx.lineWidth = legHalf * 2; ctx.lineCap = 'round';
        if (dangle) {
          ctx.beginPath(); ctx.moveTo(cx - 0.2 * hu, hipY); ctx.lineTo(cx - 0.22 * hu, hipY + 1.35 * hu); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 0.2 * hu, hipY); ctx.lineTo(cx + 0.22 * hu, hipY + 1.35 * hu); ctx.stroke();
          ctx.fillStyle = '#111118';
          ctx.beginPath(); ctx.ellipse(cx - 0.22 * hu, hipY + 1.42 * hu, 0.16 * hu, 0.09 * hu, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + 0.22 * hu, hipY + 1.42 * hu, 0.16 * hu, 0.09 * hu, 0, 0, TAU); ctx.fill();
        } else {
          // knees bent gently forward, feet close together — no wide splay
          ctx.beginPath(); ctx.moveTo(cx - 0.13 * hu, hipY - 0.02 * hu); ctx.quadraticCurveTo(cx - 0.3 * hu, hipY + 0.3 * hu, cx - 0.2 * hu, hipY + 0.58 * hu); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 0.13 * hu, hipY - 0.02 * hu); ctx.quadraticCurveTo(cx + 0.3 * hu, hipY + 0.3 * hu, cx + 0.2 * hu, hipY + 0.58 * hu); ctx.stroke();
          ctx.fillStyle = '#111118';
          ctx.beginPath(); ctx.ellipse(cx - 0.21 * hu, hipY + 0.61 * hu, 0.15 * hu, 0.08 * hu, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + 0.21 * hu, hipY + 0.61 * hu, 0.15 * hu, 0.08 * hu, 0, 0, TAU); ctx.fill();
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
      // a rare shooting star (once every ~23s), skipped for reduced motion
      const cyc = A.t % 1400;
      if (cyc < 26 && alpha > 0.5 && !reducedRef.current) {
        const p2 = cyc / 26;
        const sx0 = A.layout.w * (0.72 - p2 * 0.26);
        const sy0 = A.layout.h * (0.09 + p2 * 0.1);
        ctx.strokeStyle = `rgba(240,246,255,${(1 - p2) * 0.65 * alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx0 + 15, sy0 - 6); ctx.stroke();
      }
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
      if (playing) { A.wanderer.x += Math.max(0.45, w * 0.0016); A.wanderer.walk += 0.115; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
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
      if (playing) { A.wanderer.x += Math.max(0.45, w * 0.0015); A.wanderer.walk += 0.115; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
    };

    const sceneCitywalk = (playing) => {
      const { w, h, groundY, px, figW } = A.layout;
      // dusk boulevard — the "empty night falls" reading of the second chorus
      skyGrad('#1a2150', '#54406e', groundY);
      moon(w * 0.22, h * 0.18, Math.max(9, h * 0.05));
      stars(0.55);
      clouds(playing, 'rgba(96,84,128,0.5)');
      A.skyline.forEach((b, bi) => {
        const bh = b.h * 0.95;
        ctx.fillStyle = bi % 2 ? '#222a4e' : '#2a3358';
        ctx.fillRect(b.x, groundY - bh, b.w, bh);
        for (let wy = groundY - bh + 6; wy < groundY - 6; wy += 9)
          for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 8)
            if (((wx * 5 + wy * 7 + bi) % 7) < 2) {
              ctx.fillStyle = 'rgba(255,206,140,0.8)';
              ctx.fillRect(wx, wy, 4, 5);
            }
      });
      ctx.fillStyle = '#1d2338';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = 'rgba(210,220,255,0.28)'; // crosswalk under the moon
      for (let x = w * 0.1; x < w * 0.9; x += px * 5) ctx.fillRect(x, groundY + px * 2, px * 3, px);
      if (playing) { A.wanderer.x += Math.max(0.45, w * 0.0017); A.wanderer.walk += 0.12; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
      rain(0.3, playing);
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
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fillRect(0, groundY, w, px * 0.5);
      // a potted plant by the window, leaves nodding faintly
      const plx = w * 0.87;
      ctx.fillStyle = '#1a2140';
      ctx.fillRect(plx - px * 1.3, groundY - px * 2.2, px * 2.6, px * 2.2);
      ctx.strokeStyle = '#22305a'; ctx.lineWidth = Math.max(1, px * 0.35); ctx.lineCap = 'round';
      [[-1.4, 5.2], [0, 6.2], [1.4, 5.0]].forEach(([dx3, len]) => {
        ctx.beginPath();
        ctx.moveTo(plx, groundY - px * 2);
        ctx.quadraticCurveTo(plx + dx3 * px, groundY - px * (2 + len * 0.6), plx + dx3 * px * 1.6 + Math.sin(A.t * 0.02 + dx3) * px * 0.3, groundY - px * (2 + len * 0.9));
        ctx.stroke();
      });
      // a small framed photo on the wall
      ctx.fillStyle = '#232c50';
      ctx.fillRect(w * 0.18, h * 0.28, px * 3.2, px * 2.4);
      ctx.fillStyle = '#111830';
      ctx.fillRect(w * 0.18 + px * 0.4, h * 0.28 + px * 0.4, px * 2.4, px * 1.6);
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
        const sp = i % 2 ? 4.2 : 2.2; // near lights streak past faster than far ones
        const x = w * 0.08 + ((i * 53 + A.t * sp) % (w * 0.84));
        ctx.fillStyle = `rgba(${i % 3 ? 255 : 150},${i % 2 ? 210 : 230},${i % 3 ? 150 : 255},0.8)`;
        ctx.fillRect(x, wy + (wh * 0.3) + ((i * 31) % (wh * 0.5)), px, px * (1 + (i % 3)));
      }
      // window frames
      ctx.fillStyle = '#2c3654';
      ctx.fillRect(w * 0.08, wy - px, w * 0.84, px);
      ctx.fillRect(w * 0.08, wy + wh, w * 0.84, px);
      ctx.fillRect(w * 0.5 - px, wy, px * 2, wh);
      // hanging straps swaying with the carriage
      ctx.strokeStyle = '#2c3654'; ctx.lineWidth = Math.max(1, px * 0.3); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.08); ctx.lineTo(w * 0.9, h * 0.08); ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const hx2 = w * (0.2 + i * 0.2);
        const ang = Math.sin(A.t * 0.026 + i * 1.7) * 0.16;
        const ex2 = hx2 + Math.sin(ang) * px * 3.4, ey2 = h * 0.08 + Math.cos(ang) * px * 3.4;
        ctx.beginPath(); ctx.moveTo(hx2, h * 0.08); ctx.lineTo(ex2, ey2); ctx.stroke();
        ctx.beginPath(); ctx.arc(ex2, ey2 + px * 0.8, px * 0.8, 0, TAU); ctx.stroke();
      }
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
      // rooftop furniture: water tank on stilts, an AC unit, a safety rail
      ctx.fillStyle = '#0d142c';
      ctx.fillRect(w * 0.72, groundY - px * 7.5, px * 6.5, px * 5.5);
      ctx.beginPath(); ctx.ellipse(w * 0.72 + px * 3.25, groundY - px * 7.5, px * 3.25, px, 0, 0, TAU); ctx.fill();
      ctx.fillRect(w * 0.73, groundY - px * 2, px * 0.8, px * 2);
      ctx.fillRect(w * 0.72 + px * 5, groundY - px * 2, px * 0.8, px * 2);
      ctx.fillStyle = '#101838';
      ctx.fillRect(w * 0.55, groundY - px * 3, px * 4.5, px * 3);
      ctx.strokeStyle = '#0a1024'; ctx.lineWidth = Math.max(1, px * 0.25);
      for (let i2 = 1; i2 < 4; i2 += 1) {
        ctx.beginPath();
        ctx.moveTo(w * 0.55 + px * 0.5, groundY - px * 3 + (px * 3 * i2) / 4);
        ctx.lineTo(w * 0.55 + px * 4, groundY - px * 3 + (px * 3 * i2) / 4);
        ctx.stroke();
      }
      ctx.strokeStyle = '#141c3a'; ctx.lineWidth = Math.max(1.5, px * 0.3);
      ctx.beginPath(); ctx.moveTo(w * 0.48, groundY - px * 4.6); ctx.lineTo(w, groundY - px * 4.6); ctx.stroke();
      for (let rx2 = w * 0.5; rx2 < w; rx2 += px * 4) {
        ctx.beginPath(); ctx.moveTo(rx2, groundY - px * 4.6); ctx.lineTo(rx2, groundY); ctx.stroke();
      }
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
        look: 1, // he keeps facing the door
      });
      if (playing && arriving) A.wanderer.walk += 0.1;
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
      if (playing) { A.wanderer.x += Math.max(0.45, w * 0.0015); A.wanderer.walk += 0.115; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
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
      // a small bow lantern, glowing against the dark water
      ctx.fillStyle = '#0a0b16';
      ctx.fillRect(px * 6.4, -px * 4.6, px * 0.5, px * 2.6);
      const lg4 = ctx.createRadialGradient(px * 6.65, -px * 5.2, 0, px * 6.65, -px * 5.2, px * 4);
      lg4.addColorStop(0, 'rgba(255,206,120,0.5)');
      lg4.addColorStop(1, 'rgba(255,206,120,0)');
      ctx.fillStyle = lg4;
      ctx.fillRect(px * 2.5, -px * 9.2, px * 8.5, px * 8);
      ctx.fillStyle = `rgba(255,226,150,${0.75 + 0.25 * Math.sin(A.t * 0.09)})`;
      ctx.fillRect(px * 6.3, -px * 5.7, px * 0.8, px);
      const stroke = Math.sin(A.t * 0.06) * (0.5 + A.rowStroke * 0.6);
      ctx.strokeStyle = RIM;
      ctx.lineWidth = Math.max(2, px * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, -px * 2);
      ctx.lineTo(px * 9 * Math.cos(stroke), px * 9 * Math.sin(stroke) + px);
      ctx.stroke();
      ctx.restore();
      // the lantern's warm shimmer on the water below the bow
      ctx.fillStyle = 'rgba(255,206,120,0.16)';
      for (let y2 = by + px; y2 < h * 0.92; y2 += px * 2) {
        const ww2 = px * (1 + 2 * Math.abs(Math.sin(y2 * 0.25 + A.t * 0.05)));
        ctx.fillRect(bx + px * 6.5 - ww2 / 2, y2, ww2, px * 0.7);
      }
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
      // a soft ray reaching from the sun toward him — the rescue light
      const rayA = 0.08 + A.dawn * 0.3;
      const rg2 = ctx.createLinearGradient(sxp, syp, w * 0.3, groundY);
      rg2.addColorStop(0, `rgba(255,216,120,${rayA})`);
      rg2.addColorStop(1, 'rgba(255,216,120,0)');
      ctx.fillStyle = rg2;
      ctx.beginPath();
      ctx.moveTo(sxp - px * 2, syp);
      ctx.lineTo(sxp + px * 2, syp);
      ctx.lineTo(w * 0.3 + px * 7, groundY);
      ctx.lineTo(w * 0.3 - px * 7, groundY);
      ctx.closePath(); ctx.fill();
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


    // --- lyric cutscenes ---

    // "이렇게 또 너를 불러" — calling you from a rainy phone booth
    const scenePhonebooth = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#111a3e', '#26325e', groundY);
      moon(w * 0.14, h * 0.16, Math.max(9, h * 0.05));
      stars(0.7);
      litSkyline(groundY, 0.55, 'rgba(255,210,140,0.6)');
      ctx.fillStyle = '#0d1226';
      ctx.fillRect(0, groundY, w, h - groundY);

      const bx = w * 0.55, bw = px * 9, bh = px * 14.5, bl = bx - bw / 2, bt = groundY - bh;
      const glow = 0.5 + 0.35 * Math.max(A.phoneGlow, 0.25 + 0.15 * Math.sin(A.t * 0.04));
      // booth back panel + warm interior light
      ctx.fillStyle = '#1b2547';
      ctx.fillRect(bl, bt, bw, bh);
      const ig = ctx.createRadialGradient(bx, bt + bh * 0.45, 0, bx, bt + bh * 0.45, bw * 1.1);
      ig.addColorStop(0, `rgba(255,214,140,${0.35 * glow})`);
      ig.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = ig;
      ctx.fillRect(bl, bt, bw, bh);
      // wall phone box
      ctx.fillStyle = '#0e1430';
      ctx.fillRect(bx + bw * 0.16, bt + bh * 0.3, px * 1.4, px * 2);
      // the caller
      const pb = px * 0.92;
      idol(bx - px * 0.6, groundY, pb, { look: 1 });
      // receiver held to the ear, cord swaying gently to the wall box
      const hu = (pb * 11) / 3;
      const topY = groundY - pb * 11;
      const earX = bx - px * 0.6 + 0.5 * hu, earY = topY + 0.62 * hu;
      ctx.strokeStyle = PAL.coat; ctx.lineWidth = 0.24 * hu; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx - px * 0.6 + 0.38 * hu, topY + 1.3 * hu);
      ctx.quadraticCurveTo(earX + 0.28 * hu, earY + 0.5 * hu, earX + 0.05 * hu, earY + 0.1 * hu);
      ctx.stroke();
      ctx.fillStyle = '#10162e';
      ctx.fillRect(earX - 0.06 * hu, earY - 0.3 * hu, 0.18 * hu, 0.55 * hu);
      ctx.strokeStyle = 'rgba(16,22,46,0.9)'; ctx.lineWidth = Math.max(1, px * 0.26);
      ctx.beginPath();
      ctx.moveTo(earX + 0.08 * hu, earY + 0.28 * hu);
      ctx.quadraticCurveTo(bx + bw * 0.08, bt + bh * 0.66 + Math.sin(A.t * 0.05) * px, bx + bw * 0.2, bt + bh * 0.44);
      ctx.stroke();
      // glass tint + frame + roof sign lamp
      ctx.fillStyle = 'rgba(170,200,255,0.07)';
      ctx.fillRect(bl, bt, bw, bh);
      ctx.strokeStyle = '#0a1024'; ctx.lineWidth = Math.max(2, px * 0.6);
      ctx.strokeRect(bl, bt, bw, bh);
      ctx.beginPath();
      ctx.moveTo(bl, bt + bh * 0.5); ctx.lineTo(bl + bw, bt + bh * 0.5);
      ctx.stroke();
      ctx.fillStyle = '#0e1839';
      ctx.fillRect(bl - px * 0.5, bt - px * 1.8, bw + px, px * 1.8);
      ctx.fillStyle = `rgba(255,206,120,${0.4 + 0.5 * glow})`;
      ctx.fillRect(bx - px * 1.5, bt - px * 1.3, px * 3, px * 0.8);
      wetGlow(bx, groundY, bw * 1.4, h - groundY, 'rgba(255,214,140,', 0.2 * glow, 3);
      rain(0.6, playing);
    };

    // "각자 이야긴 묻어 둘까" — burying the story under a bare tree
    const sceneMemory = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#131a3c', '#2b3160', groundY);
      moon(w * 0.2, h * 0.18, Math.max(8, h * 0.045));
      stars(0.75);
      ctx.fillStyle = '#10142a';
      ctx.fillRect(0, groundY, w, h - groundY);
      // bare tree on the right
      ctx.strokeStyle = '#0a0f22'; ctx.lineCap = 'round';
      ctx.lineWidth = px * 1.6;
      ctx.beginPath(); ctx.moveTo(w * 0.78, groundY + px); ctx.quadraticCurveTo(w * 0.77, groundY - h * 0.28, w * 0.74, groundY - h * 0.42); ctx.stroke();
      ctx.lineWidth = px * 0.8;
      ctx.beginPath(); ctx.moveTo(w * 0.765, groundY - h * 0.24); ctx.quadraticCurveTo(w * 0.85, groundY - h * 0.34, w * 0.9, groundY - h * 0.31); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.755, groundY - h * 0.33); ctx.quadraticCurveTo(w * 0.68, groundY - h * 0.44, w * 0.63, groundY - h * 0.43); ctx.stroke();
      ctx.lineWidth = px * 0.45;
      ctx.beginPath(); ctx.moveTo(w * 0.74, groundY - h * 0.42); ctx.quadraticCurveTo(w * 0.72, groundY - h * 0.5, w * 0.76, groundY - h * 0.54); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.9, groundY - h * 0.31); ctx.quadraticCurveTo(w * 0.95, groundY - h * 0.36, w * 0.97, groundY - h * 0.34); ctx.stroke();
      // the keepsake, half in the earth, softly glowing
      const kx = w * 0.52, ky = groundY - px * 0.6;
      const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, px * 6);
      kg.addColorStop(0, `rgba(255,214,150,${0.4 + 0.15 * A.beat})`);
      kg.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = kg;
      ctx.fillRect(kx - px * 6, ky - px * 6, px * 12, px * 12);
      ctx.fillStyle = '#c9a06a';
      ctx.fillRect(kx - px * 1.2, ky - px * 0.9, px * 2.4, px * 0.9);
      ctx.fillStyle = '#1a2140';
      ctx.fillRect(kx - px * 1.6, ky, px * 3.2, px * 1);
      ctx.fillStyle = '#0c1126';
      ctx.beginPath(); ctx.ellipse(kx + px * 3.4, groundY + px * 0.2, px * 1.6, px * 0.7, 0, 0, TAU); ctx.fill();
      // light motes sinking into the ground — memories settling
      for (let i = 0; i < 7; i += 1) {
        const ph = ((A.t * 0.006) + i / 7) % 1;
        const mx = kx + Math.sin(i * 2.7) * px * 5;
        const my = ky - px * 7 * (1 - ph);
        ctx.fillStyle = `rgba(255,224,160,${(1 - ph) * 0.55})`;
        ctx.fillRect(mx, my, px * 0.6, px * 0.6);
      }
      // he kneels beside it
      idolSit(w * 0.4, groundY - px * 0.4, px * 0.95, {});
    };

    // "벼랑 끝 그 앞" — at the wind-blown cliff edge over a dark sea
    const sceneCliff = (playing) => {
      const { w, h, px } = A.layout;
      const seaY = h * 0.62;
      skyGrad('#0f1a40', '#27406b', seaY);
      moon(w * 0.74, h * 0.15, Math.max(9, h * 0.05));
      stars(0.85);
      // wind streaks racing across the sky
      ctx.strokeStyle = 'rgba(200,215,245,0.14)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 14; i += 1) {
        const wx = ((i * 97 + A.t * 3.2) % (w + 80)) - 40;
        const wy = h * (0.08 + ((i * 53) % 45) / 100);
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + px * 5, wy - px * 0.8, wx + px * 10, wy);
      }
      ctx.stroke();
      // dark sea with moon glitter
      const sg = ctx.createLinearGradient(0, seaY, 0, h);
      sg.addColorStop(0, '#12264c'); sg.addColorStop(1, '#080f22');
      ctx.fillStyle = sg;
      ctx.fillRect(0, seaY, w, h - seaY);
      ctx.fillStyle = 'rgba(226,232,240,0.14)';
      for (let y = seaY + px; y < h; y += px * 2) {
        const ww = px * (1.5 + 3 * Math.abs(Math.sin(y * 0.22 + A.t * 0.06)));
        ctx.fillRect(w * 0.74 - ww / 2, y, ww, px * 0.8);
      }
      // the cliff, jagged face dropping to the water
      const cliffY = h * 0.56;
      ctx.fillStyle = '#131a33';
      ctx.beginPath();
      ctx.moveTo(0, cliffY);
      ctx.lineTo(w * 0.56, cliffY);
      ctx.lineTo(w * 0.6, cliffY + px * 3);
      ctx.lineTo(w * 0.55, seaY + px * 4);
      ctx.lineTo(w * 0.58, h * 0.8);
      ctx.lineTo(w * 0.5, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      // grass flattening in the gusts
      const lean = 1.6 + 0.9 * Math.sin(A.t * 0.07);
      ctx.strokeStyle = '#1d2947'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = px; gx < w * 0.55; gx += px * 1.6) {
        const tall = 2.5 + ((gx * 7) % 3);
        ctx.moveTo(gx, cliffY);
        ctx.quadraticCurveTo(gx + lean * 2, cliffY - px * tall * 0.7, gx + lean * 3.2, cliffY - px * tall * 0.45);
      }
      ctx.stroke();
      // he stands at the edge, looking out over the drop
      idol(w * 0.47, cliffY, px, { look: 1 });
      rain(0.25, playing);
    };


    // A soft feminine silhouette — the "you" of the song, kept faceless like
    // a memory. Seated (bench) and standing (crossing the flashlight beam).
    const girlSit = (cx, hipY, p) => {
      const hu = (p * 11) / 3;
      const HAIR = '#4a3040', HAIR_HI = '#6b4a5c', SKIN = '#f6d3b3', DRESS = '#b56a76', DRESS_SH = '#96525f';
      // long hair, back layer, falling to the seat
      ctx.fillStyle = HAIR;
      ctx.beginPath();
      ctx.moveTo(cx - 0.5 * hu, hipY - 1.15 * hu);
      ctx.quadraticCurveTo(cx - 0.62 * hu, hipY - 0.2 * hu, cx - 0.42 * hu, hipY + 0.26 * hu);
      ctx.lineTo(cx + 0.42 * hu, hipY + 0.26 * hu);
      ctx.quadraticCurveTo(cx + 0.62 * hu, hipY - 0.2 * hu, cx + 0.5 * hu, hipY - 1.15 * hu);
      ctx.closePath(); ctx.fill();
      // legs over the bench edge + little shoes
      ctx.strokeStyle = SKIN; ctx.lineWidth = 0.14 * hu; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 0.13 * hu, hipY + 0.1 * hu); ctx.lineTo(cx - 0.15 * hu, hipY + 1.12 * hu); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 0.13 * hu, hipY + 0.1 * hu); ctx.lineTo(cx + 0.11 * hu, hipY + 1.12 * hu); ctx.stroke();
      ctx.fillStyle = '#7a3d4a';
      ctx.beginPath(); ctx.ellipse(cx - 0.16 * hu, hipY + 1.2 * hu, 0.13 * hu, 0.075 * hu, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 0.12 * hu, hipY + 1.2 * hu, 0.13 * hu, 0.075 * hu, 0, 0, TAU); ctx.fill();
      // dress: rounded shoulders, gently flaring over the seat
      const shoulderY = hipY - 0.95 * hu;
      const dg = ctx.createLinearGradient(cx - 0.4 * hu, 0, cx + 0.4 * hu, 0);
      dg.addColorStop(0, DRESS_SH); dg.addColorStop(0.5, DRESS); dg.addColorStop(1, DRESS_SH);
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.moveTo(cx - 0.32 * hu, shoulderY);
      ctx.quadraticCurveTo(cx - 0.44 * hu, hipY - 0.2 * hu, cx - 0.4 * hu, hipY + 0.16 * hu);
      ctx.quadraticCurveTo(cx, hipY + 0.3 * hu, cx + 0.4 * hu, hipY + 0.16 * hu);
      ctx.quadraticCurveTo(cx + 0.44 * hu, hipY - 0.2 * hu, cx + 0.32 * hu, shoulderY);
      ctx.quadraticCurveTo(cx, shoulderY - 0.22 * hu, cx - 0.32 * hu, shoulderY);
      ctx.closePath(); ctx.fill();
      // arms resting together in her lap
      ctx.strokeStyle = DRESS; ctx.lineWidth = 0.17 * hu; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 0.28 * hu, shoulderY + 0.15 * hu); ctx.quadraticCurveTo(cx - 0.34 * hu, hipY - 0.3 * hu, cx - 0.05 * hu, hipY - 0.1 * hu); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 0.28 * hu, shoulderY + 0.15 * hu); ctx.quadraticCurveTo(cx + 0.34 * hu, hipY - 0.3 * hu, cx + 0.05 * hu, hipY - 0.1 * hu); ctx.stroke();
      ctx.fillStyle = SKIN;
      ctx.beginPath(); ctx.arc(cx, hipY - 0.1 * hu, 0.07 * hu, 0, TAU); ctx.fill();
      // neck + chibi face
      const faceCy = shoulderY - 0.6 * hu, chinY = faceCy + 0.44 * hu;
      const headRx = 0.42 * hu, headRy = 0.48 * hu;
      ctx.fillStyle = SKIN;
      ctx.fillRect(cx - 0.1 * hu, chinY - 0.1 * hu, 0.2 * hu, 0.2 * hu);
      ctx.beginPath();
      ctx.moveTo(cx - headRx, faceCy);
      ctx.quadraticCurveTo(cx - headRx, faceCy + 0.38 * hu, cx, chinY);
      ctx.quadraticCurveTo(cx + headRx, faceCy + 0.38 * hu, cx + headRx, faceCy);
      ctx.quadraticCurveTo(cx + headRx, faceCy - headRy, cx, faceCy - headRy);
      ctx.quadraticCurveTo(cx - headRx, faceCy - headRy, cx - headRx, faceCy);
      ctx.closePath(); ctx.fill();
      // blush + gentle closed-happy eyes + a small smile (a warm memory)
      ctx.fillStyle = 'rgba(235,140,130,0.35)';
      ctx.beginPath(); ctx.ellipse(cx - 0.23 * hu, faceCy + 0.2 * hu, 0.08 * hu, 0.045 * hu, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 0.23 * hu, faceCy + 0.2 * hu, 0.08 * hu, 0.045 * hu, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3a2a34'; ctx.lineWidth = 0.045 * hu; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx - 0.16 * hu, faceCy + 0.17 * hu, 0.085 * hu, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 0.16 * hu, faceCy + 0.17 * hu, 0.085 * hu, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      ctx.strokeStyle = '#a35a52'; ctx.lineWidth = 0.03 * hu;
      ctx.beginPath(); ctx.arc(cx, faceCy + 0.32 * hu, 0.055 * hu, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      // front hair: crown + scalloped fringe + sidelocks framing the face
      ctx.fillStyle = HAIR;
      ctx.beginPath();
      ctx.moveTo(cx - headRx - 0.02 * hu, faceCy + 0.14 * hu);
      ctx.quadraticCurveTo(cx - headRx - 0.08 * hu, faceCy - headRy, cx, faceCy - headRy - 0.05 * hu);
      ctx.quadraticCurveTo(cx + headRx + 0.08 * hu, faceCy - headRy, cx + headRx + 0.02 * hu, faceCy + 0.14 * hu);
      ctx.quadraticCurveTo(cx + headRx - 0.05 * hu, faceCy + 0.02 * hu, cx + 0.3 * hu, faceCy - 0.08 * hu);
      ctx.quadraticCurveTo(cx + 0.18 * hu, faceCy - 0.3 * hu, cx + 0.06 * hu, faceCy - 0.1 * hu);
      ctx.quadraticCurveTo(cx - 0.05 * hu, faceCy - 0.3 * hu, cx - 0.16 * hu, faceCy - 0.1 * hu);
      ctx.quadraticCurveTo(cx - 0.25 * hu, faceCy - 0.28 * hu, cx - 0.3 * hu, faceCy - 0.08 * hu);
      ctx.quadraticCurveTo(cx - headRx + 0.05 * hu, faceCy + 0.02 * hu, cx - headRx - 0.02 * hu, faceCy + 0.14 * hu);
      ctx.closePath(); ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = HAIR_HI;
      ctx.beginPath(); ctx.ellipse(cx + 0.1 * hu, faceCy - headRy * 0.7, 0.14 * hu, 0.05 * hu, -0.4, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const girlStand = (cx, footY, p, col = '#aab6d8') => {
      const hu = (p * 11) / 3;
      const sway = Math.sin(A.t * 0.04) * 0.05 * hu;
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
      const hy = footY - 2.42 * hu; // head center
      // hair, back layer, drifting slightly
      ctx.beginPath();
      ctx.moveTo(cx - 0.38 * hu, hy - 0.05 * hu);
      ctx.quadraticCurveTo(cx - 0.52 * hu + sway, footY - 1.4 * hu, cx - 0.32 * hu + sway, footY - 0.92 * hu);
      ctx.lineTo(cx + 0.32 * hu + sway, footY - 0.92 * hu);
      ctx.quadraticCurveTo(cx + 0.52 * hu + sway, footY - 1.4 * hu, cx + 0.38 * hu, hy - 0.05 * hu);
      ctx.closePath(); ctx.fill();
      // legs
      ctx.lineWidth = 0.13 * hu;
      ctx.beginPath(); ctx.moveTo(cx - 0.09 * hu, footY - 0.9 * hu); ctx.lineTo(cx - 0.12 * hu, footY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 0.09 * hu, footY - 0.9 * hu); ctx.lineTo(cx + 0.12 * hu, footY); ctx.stroke();
      // dress with shoulders and a waist
      const hipY2 = footY - 0.85 * hu, waistY2 = footY - 1.5 * hu, shY = footY - 1.92 * hu;
      ctx.beginPath();
      ctx.moveTo(cx - 0.4 * hu, hipY2);
      ctx.quadraticCurveTo(cx - 0.28 * hu, waistY2 + 0.12 * hu, cx - 0.18 * hu, waistY2);
      ctx.lineTo(cx - 0.24 * hu, shY);
      ctx.quadraticCurveTo(cx, shY - 0.15 * hu, cx + 0.24 * hu, shY);
      ctx.lineTo(cx + 0.18 * hu, waistY2);
      ctx.quadraticCurveTo(cx + 0.28 * hu, waistY2 + 0.12 * hu, cx + 0.4 * hu, hipY2);
      ctx.quadraticCurveTo(cx, hipY2 + 0.14 * hu, cx - 0.4 * hu, hipY2);
      ctx.closePath(); ctx.fill();
      // neck + head
      ctx.fillRect(cx - 0.07 * hu, hy + 0.28 * hu, 0.14 * hu, 0.24 * hu);
      ctx.beginPath(); ctx.arc(cx, hy, 0.38 * hu, 0, TAU); ctx.fill();
    };

    // "좀 늦었지" — hurrying beneath the station clock, hands racing
    const sceneClocktower = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#141c42', '#2b3668', groundY);
      stars(0.8);
      litSkyline(groundY, 0.5, 'rgba(255,210,140,0.6)');
      ctx.fillStyle = '#0e1428';
      ctx.fillRect(0, groundY, w, h - groundY);
      const tx = w * 0.62, tw = px * 7, th = h * 0.62, tt = groundY - th;
      ctx.fillStyle = '#1a2348';
      ctx.fillRect(tx - tw / 2, tt, tw, th);
      ctx.fillStyle = '#131b3a';
      ctx.beginPath();
      ctx.moveTo(tx - tw * 0.7, tt); ctx.lineTo(tx, tt - px * 4); ctx.lineTo(tx + tw * 0.7, tt);
      ctx.closePath(); ctx.fill();
      // glowing clock face
      const cy = tt + px * 5, cr = px * 2.6;
      const cg = ctx.createRadialGradient(tx, cy, 0, tx, cy, cr * 3);
      cg.addColorStop(0, 'rgba(255,230,170,0.5)');
      cg.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(tx - cr * 3, cy - cr * 3, cr * 6, cr * 6);
      ctx.fillStyle = '#f6e7c0';
      ctx.beginPath(); ctx.arc(tx, cy, cr, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a2340'; ctx.lineWidth = Math.max(1, px * 0.35);
      ctx.beginPath(); ctx.arc(tx, cy, cr, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#3a2f50';
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * TAU;
        ctx.fillRect(tx + Math.cos(a) * cr * 0.82 - px * 0.17, cy + Math.sin(a) * cr * 0.82 - px * 0.17, px * 0.35, px * 0.35);
      }
      // hands — the minute hand races: time has already run on
      const ma = A.t * 0.028, ha = A.t * 0.0023 + 2;
      ctx.strokeStyle = '#241c38'; ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.5, px * 0.4);
      ctx.beginPath(); ctx.moveTo(tx, cy); ctx.lineTo(tx + Math.cos(ma) * cr * 0.72, cy + Math.sin(ma) * cr * 0.72); ctx.stroke();
      ctx.lineWidth = Math.max(2, px * 0.5);
      ctx.beginPath(); ctx.moveTo(tx, cy); ctx.lineTo(tx + Math.cos(ha) * cr * 0.45, cy + Math.sin(ha) * cr * 0.45); ctx.stroke();
      wetGlow(tx, groundY, tw * 1.3, h - groundY, 'rgba(255,230,170,', 0.12, 5);
      // he hurries past, a beat quicker than his usual stroll
      if (playing) { A.wanderer.x += Math.max(0.5, w * 0.0019); A.wanderer.walk += 0.135; if (A.wanderer.x > w + px * 6) A.wanderer.x = -px * 6; }
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
      rain(0.4, playing);
    };

    // "다시 시작하는 우리" — a golden remembered evening on the park bench
    const sceneBench = (playing) => {
      const { w, h, groundY, px } = A.layout;
      const g = ctx.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, '#3c2a55'); g.addColorStop(0.6, '#b0586a'); g.addColorStop(1, '#e8a05e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, groundY);
      sun(w * 0.24, groundY - h * 0.16, Math.max(12, h * 0.07), '#ffd9a0');
      // leafy tree over the bench
      ctx.strokeStyle = '#241a30'; ctx.lineWidth = px * 1.3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w * 0.72, groundY); ctx.quadraticCurveTo(w * 0.71, groundY - h * 0.22, w * 0.68, groundY - h * 0.3); ctx.stroke();
      [[0.68, 0.34, 7], [0.61, 0.3, 6], [0.76, 0.31, 6.5], [0.7, 0.26, 5]].forEach(([fx, fy, r]) => {
        const cg2 = ctx.createRadialGradient(w * fx, groundY - h * fy, px, w * fx, groundY - h * fy, px * r);
        cg2.addColorStop(0, 'rgba(80,46,64,0.95)');
        cg2.addColorStop(1, 'rgba(80,46,64,0)');
        ctx.fillStyle = cg2;
        ctx.beginPath(); ctx.arc(w * fx, groundY - h * fy, px * r, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = '#31203a';
      ctx.fillRect(0, groundY, w, h - groundY);
      // the bench
      const bxc = w * 0.45, seatY = groundY - px * 3.4, bw2 = px * 10;
      ctx.fillStyle = '#1d1426';
      ctx.fillRect(bxc - bw2 / 2, seatY - px * 3.4, bw2, px * 0.7);
      ctx.fillRect(bxc - bw2 / 2, seatY, bw2, px * 0.9);
      ctx.fillRect(bxc - bw2 / 2 + px, seatY + px * 0.9, px * 0.7, px * 2.5);
      ctx.fillRect(bxc + bw2 / 2 - px * 1.7, seatY + px * 0.9, px * 0.7, px * 2.5);
      // the two of them, close together
      idolSit(bxc - px * 2.2, seatY - px * 0.3, px * 0.95, { dangle: true });
      girlSit(bxc + px * 2.3, seatY - px * 0.3, px * 0.95);
      // remembered fireflies drifting up
      for (let i = 0; i < 9; i += 1) {
        const ph = ((A.t * 0.004) + i / 9) % 1;
        const mx = w * (0.2 + ((i * 37) % 60) / 100) + Math.sin(A.t * 0.02 + i) * px * 2;
        const my = groundY - h * 0.08 - ph * h * 0.3;
        ctx.fillStyle = `rgba(255,214,140,${(1 - ph) * 0.5})`;
        ctx.fillRect(mx, my, px * 0.6, px * 0.6);
      }
    };

    // "you pass like dust in a flashlight" — she crosses the beam, half dust
    const sceneFlashbeam = (playing) => {
      const { w, h, groundY, px } = A.layout;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#07091a'); g.addColorStop(1, '#0c0f22');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#080a18';
      ctx.fillRect(0, groundY, w, h - groundY);
      // him, torch in hand
      const hx = w * 0.18;
      idol(hx, groundY, px, { look: 1 });
      const hu = (px * 11) / 3;
      const handX = hx + 0.55 * hu, handY = groundY - px * 11 + 1.5 * hu;
      ctx.strokeStyle = PAL.coat; ctx.lineWidth = 0.24 * hu; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx + 0.38 * hu, groundY - px * 11 + 1.25 * hu);
      ctx.lineTo(handX, handY);
      ctx.stroke();
      ctx.fillStyle = '#0d1226';
      ctx.fillRect(handX - 0.08 * hu, handY - 0.12 * hu, 0.46 * hu, 0.24 * hu);
      // the beam breathes with the dust-beam cue
      const bI = 0.15 + 0.2 * A.beam + 0.03 * Math.sin(A.t * 0.05);
      const bg2 = ctx.createLinearGradient(handX, handY, w * 0.98, groundY - h * 0.18);
      bg2.addColorStop(0, `rgba(235,240,255,${bI * 1.5})`);
      bg2.addColorStop(1, 'rgba(235,240,255,0)');
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.moveTo(handX + 0.4 * hu, handY - 0.12 * hu);
      ctx.lineTo(w * 0.98, groundY - h * 0.36);
      ctx.lineTo(w * 0.98, groundY - h * 0.02);
      ctx.lineTo(handX + 0.4 * hu, handY + 0.16 * hu);
      ctx.closePath(); ctx.fill();
      // she crosses the light and thins into dust
      const ph = (A.t * 0.0035) % 1;
      const gx = w * (0.42 + 0.36 * ph);
      const fade = Math.sin(ph * Math.PI);
      ctx.save();
      ctx.globalAlpha = fade * 0.5;
      girlStand(gx, groundY, px * 0.96);
      ctx.restore();
      for (let i = 0; i < 14; i += 1) {
        const dph = ((A.t * 0.004) + i / 14) % 1;
        const dx = gx - dph * px * 8 + Math.sin(i * 5) * px * 1.5;
        const dy = groundY - px * 4 - (((i * 29) % 36) / 6) * px + Math.sin(A.t * 0.03 + i) * px * 0.6;
        ctx.fillStyle = `rgba(230,236,255,${(1 - dph) * fade * 0.5})`;
        ctx.fillRect(dx, dy, px * 0.5, px * 0.5);
      }
    };


    // "Just checkin' on your door" — watching her window from across the road
    const sceneVigil = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#101736', '#232c58', groundY);
      moon(w * 0.4, h * 0.14, Math.max(8, h * 0.045));
      stars(0.75);
      litSkyline(groundY, 0.42, 'rgba(255,210,140,0.5)');
      ctx.fillStyle = '#0c1124';
      ctx.fillRect(0, groundY, w, h - groundY);
      // her house, far across the road
      const hw = w * 0.2, hh = h * 0.3, hx = w * 0.74, hy = groundY - hh;
      ctx.fillStyle = '#232c50';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = '#161d3c';
      ctx.beginPath();
      ctx.moveTo(hx - hw * 0.1, hy); ctx.lineTo(hx + hw * 0.5, hy - hh * 0.28); ctx.lineTo(hx + hw * 1.1, hy);
      ctx.closePath(); ctx.fill();
      // one warm window, breathing softly — someone is home
      const flick2 = 0.75 + 0.25 * (0.5 + 0.5 * Math.sin(A.t * 0.03));
      ctx.fillStyle = `rgba(255,206,120,${flick2})`;
      ctx.fillRect(hx + hw * 0.58, hy + hh * 0.3, hw * 0.2, hh * 0.22);
      // a dark door — he is not knocking tonight
      ctx.fillStyle = '#141a36';
      ctx.fillRect(hx + hw * 0.14, groundY - hh * 0.42, hw * 0.22, hh * 0.42);
      wetGlow(hx + hw * 0.68, groundY, hw * 0.3, h - groundY, 'rgba(255,206,120,', 0.16, 7);
      // the road between them
      ctx.fillStyle = 'rgba(210,220,255,0.12)';
      for (let x = w * 0.06; x < w * 0.94; x += px * 5) ctx.fillRect(x, groundY + px * 2.4, px * 2.6, px * 0.7);
      // him, way over here under the lamp, just watching
      const lx = w * 0.16, lampY = groundY - h * 0.32;
      const fl = 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(A.t * 0.19));
      ctx.fillStyle = '#0a1024';
      ctx.fillRect(lx - px * 0.4, lampY, px * 0.8, h * 0.32);
      const cone = ctx.createLinearGradient(lx, lampY, lx, groundY);
      cone.addColorStop(0, `rgba(255,219,150,${0.4 * fl})`);
      cone.addColorStop(1, 'rgba(255,219,150,0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(lx - px, lampY); ctx.lineTo(lx - px * 5.5, groundY); ctx.lineTo(lx + px * 5.5, groundY); ctx.lineTo(lx + px, lampY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,240,200,${0.7 + 0.3 * fl})`;
      ctx.fillRect(lx - px, lampY - px, px * 2, px * 1.6);
      wetGlow(lx, groundY, px * 8, h - groundY, 'rgba(255,219,150,', 0.18 * fl, 8);
      idol(lx + px * 3, groundY, px, { look: 1 });
      rain(0.5, playing);
    };

    // "what the hell am I doin' this for?" — questioning his own reflection
    const scenePuddle = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#0d1226', '#1c2244', groundY);
      stars(0.4);
      litSkyline(groundY, 0.45, 'rgba(200,190,150,0.4)');
      ctx.fillStyle = '#0b0f20';
      ctx.fillRect(0, groundY, w, h - groundY);
      const standX = w * 0.45;
      const puX = w * 0.52, puY = groundY + (h - groundY) * 0.45;
      const puRx = w * 0.21, puRy = (h - groundY) * 0.32;
      // still water
      const pg = ctx.createLinearGradient(0, puY - puRy, 0, puY + puRy);
      pg.addColorStop(0, '#1b2b55'); pg.addColorStop(1, '#0e1530');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.ellipse(puX, puY, puRx, puRy, 0, 0, TAU); ctx.fill();
      // his upside-down self, wavering in the water
      ctx.save();
      ctx.beginPath(); ctx.ellipse(puX, puY, puRx * 0.96, puRy * 0.92, 0, 0, TAU); ctx.clip();
      ctx.translate(Math.sin(A.t * 0.05) * px * 0.4, 0);
      ctx.translate(0, 2 * groundY);
      ctx.scale(1, -1);
      ctx.globalAlpha = 0.32;
      idol(standX, groundY, px, {});
      ctx.restore();
      // raindrop rings on the surface
      for (let i = 0; i < 3; i += 1) {
        const ph = ((A.t * 0.012) + i / 3) % 1;
        ctx.strokeStyle = `rgba(180,200,240,${(1 - ph) * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(
          puX + Math.sin(i * 9) * puRx * 0.4,
          puY + Math.cos(i * 7) * puRy * 0.3,
          puRx * 0.5 * ph, puRy * 0.5 * ph, 0, 0, TAU,
        );
        ctx.stroke();
      }
      // him at the water's edge, head down over the question
      idol(standX, groundY, px, {});
      rain(0.7, playing);
    };

    // "매일 나와 싸운 이유인지" — the self he fought, finally dissolving
    const sceneMirror = (playing) => {
      const { w, h, groundY, px } = A.layout;
      const g = ctx.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, '#432a5e'); g.addColorStop(0.65, '#c96a52'); g.addColorStop(1, '#f0a95e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, groundY);
      sun(w * 0.5, groundY - h * 0.06, Math.max(10, h * 0.05), '#ffd98f');
      ctx.fillStyle = '#241322';
      ctx.fillRect(0, groundY, w, h - groundY);
      // him, facing what is left of the fight
      idol(w * 0.36, groundY, px, { look: 1 });
      // the other self: mirrored, dark, already thinning
      const sx = w * 0.64;
      const fade = 0.45 + 0.12 * Math.sin(A.t * 0.03);
      ctx.save();
      ctx.translate(sx * 2, 0);
      ctx.scale(-1, 1);
      ctx.globalAlpha = fade;
      ctx.filter = 'brightness(0.3) saturate(0.4)';
      idol(sx, groundY, px, { look: 1 });
      ctx.restore();
      // he breaks up into embers drifting off on the evening air
      for (let i = 0; i < 10; i += 1) {
        const ph = ((A.t * 0.005) + i / 10) % 1;
        const ex = sx + Math.sin(i * 3.3) * px * 3 + ph * px * 6;
        const ey = groundY - px * (2 + ((i * 17) % 8)) - ph * px * 7;
        ctx.fillStyle = `rgba(64,38,54,${(1 - ph) * 0.7})`;
        ctx.fillRect(ex, ey, px * 0.7, px * 0.7);
      }
    };


    // "I'm lost" — a fork in the night road, and no sign says which way
    const sceneCrossroad = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#111a3e', '#283260', groundY);
      moon(w * 0.8, h * 0.16, Math.max(9, h * 0.05));
      stars(0.8);
      litSkyline(groundY, 0.4, 'rgba(255,210,140,0.45)');
      ctx.fillStyle = '#0d1226';
      ctx.fillRect(0, groundY, w, h - groundY);
      // two pale roads diverging from the fork
      const fx = w * 0.5, fy = groundY + (h - groundY) * 0.6;
      ctx.fillStyle = '#222b4a';
      ctx.beginPath();
      ctx.moveTo(fx - px * 1.5, fy);
      ctx.lineTo(w * 0.02, groundY + px * 1.6);
      ctx.lineTo(w * 0.17, groundY + px * 0.4);
      ctx.lineTo(fx + px * 0.5, fy - px * 3.2);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx + px * 1.5, fy);
      ctx.lineTo(w * 0.98, groundY + px * 1.6);
      ctx.lineTo(w * 0.83, groundY + px * 0.4);
      ctx.lineTo(fx - px * 0.5, fy - px * 3.2);
      ctx.closePath(); ctx.fill();
      // faded centre dashes running down each road
      ctx.fillStyle = 'rgba(210,220,255,0.13)';
      for (let t2 = 0.16; t2 < 0.9; t2 += 0.18) {
        const dl = px * (2.2 - t2 * 1.4);
        const lxx = fx - px * 0.5 + (w * 0.09 - fx) * t2, lyy = fy - px * 1.6 + (groundY + px - fy) * t2;
        ctx.fillRect(lxx, lyy, dl, px * 0.5);
        const rxx = fx + px * 0.5 + (w * 0.91 - fx) * t2;
        ctx.fillRect(rxx - dl, lyy, dl, px * 0.5);
      }
      // signpost with two blank arrows, pointing apart
      const sx2 = fx + px * 5, spTop = groundY - px * 9;
      ctx.fillStyle = '#0a1024';
      ctx.fillRect(sx2 - px * 0.35, spTop, px * 0.7, groundY - spTop);
      ctx.fillStyle = '#233054';
      ctx.beginPath();
      ctx.moveTo(sx2 - px * 4.4, spTop + px * 1.1);
      ctx.lineTo(sx2 - px * 5.5, spTop + px * 1.85);
      ctx.lineTo(sx2 - px * 4.4, spTop + px * 2.6);
      ctx.lineTo(sx2 + px * 0.45, spTop + px * 2.6);
      ctx.lineTo(sx2 + px * 0.45, spTop + px * 1.1);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx2 + px * 4.4, spTop + px * 3.3);
      ctx.lineTo(sx2 + px * 5.5, spTop + px * 4.05);
      ctx.lineTo(sx2 + px * 4.4, spTop + px * 4.8);
      ctx.lineTo(sx2 - px * 0.45, spTop + px * 4.8);
      ctx.lineTo(sx2 - px * 0.45, spTop + px * 3.3);
      ctx.closePath(); ctx.fill();
      // him at the fork, unable to choose
      idol(fx - px * 5, groundY, px, {});
      rain(0.45, playing);
    };

    // lost in the city flow — car-light trails stream under the overpass
    const sceneOverpass = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#101836', '#242e5c', h * 0.55);
      moon(w * 0.18, h * 0.13, Math.max(8, h * 0.045));
      stars(0.8);
      litSkyline(h * 0.55, 0.5, 'rgba(255,210,140,0.5)');
      // the road below, seen past the railing
      ctx.fillStyle = '#0a0e20';
      ctx.fillRect(0, h * 0.55, w, groundY - h * 0.55);
      const laneY1 = h * 0.6, laneY2 = h * 0.665;
      for (let i = 0; i < 7; i += 1) {
        const sp = 5.5 + (i % 3) * 1.8;
        const lx = ((i * 83 + A.t * sp) % (w + 120)) - 60;
        const tg = ctx.createLinearGradient(lx - px * 10, 0, lx + px * 2, 0);
        tg.addColorStop(0, 'rgba(255,236,180,0)');
        tg.addColorStop(1, 'rgba(255,236,180,0.85)');
        ctx.fillStyle = tg;
        ctx.fillRect(lx - px * 10, laneY1 + (i % 2) * px * 1.4, px * 12, px * 0.8);
      }
      for (let i = 0; i < 7; i += 1) {
        const sp = 5 + (i % 3) * 1.8;
        const lx = w - (((i * 97 + A.t * sp) % (w + 120)) - 60);
        const tg = ctx.createLinearGradient(lx + px * 12, 0, lx, 0);
        tg.addColorStop(0, 'rgba(255,90,90,0)');
        tg.addColorStop(1, 'rgba(255,90,90,0.8)');
        ctx.fillStyle = tg;
        ctx.fillRect(lx, laneY2 + (i % 2) * px * 1.4, px * 12, px * 0.8);
      }
      // the walkway deck
      ctx.fillStyle = '#141b38';
      ctx.fillRect(0, groundY, w, px * 3);
      ctx.fillStyle = '#0c1228';
      ctx.fillRect(0, groundY + px * 3, w, h - groundY - px * 3);
      // him on the bridge
      idol(w * 0.42, groundY, px, {});
      // railing in front of him for depth
      ctx.strokeStyle = '#1c2648'; ctx.lineWidth = Math.max(2, px * 0.5);
      ctx.beginPath(); ctx.moveTo(0, groundY - px * 4.5); ctx.lineTo(w, groundY - px * 4.5); ctx.stroke();
      ctx.lineWidth = Math.max(1.5, px * 0.35);
      for (let x = px; x < w; x += px * 4) {
        ctx.beginPath(); ctx.moveTo(x, groundY - px * 4.5); ctx.lineTo(x, groundY + px * 0.5); ctx.stroke();
      }
      rain(0.4, playing);
    };

    // the late express blasts through the empty platform without stopping
    const scenePlatform = (playing) => {
      const { w, h, groundY, px } = A.layout;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0d1226'); g.addColorStop(1, '#141a34');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // ceiling + humming lamps
      ctx.fillStyle = '#0a0e20';
      ctx.fillRect(0, 0, w, h * 0.14);
      for (let i = 0; i < 3; i += 1) {
        const lx = w * (0.2 + i * 0.3);
        const flick = 0.8 + 0.2 * Math.sin(A.t * 0.11 + i * 5);
        ctx.fillStyle = '#0a0e20';
        ctx.fillRect(lx - px * 0.3, h * 0.14, px * 0.6, px * 2);
        ctx.fillStyle = `rgba(235,240,255,${0.75 * flick})`;
        ctx.fillRect(lx - px * 2, h * 0.14 + px * 2, px * 4, px * 0.8);
        const cone = ctx.createLinearGradient(lx, h * 0.14, lx, groundY);
        cone.addColorStop(0, `rgba(220,230,255,${0.1 * flick})`);
        cone.addColorStop(1, 'rgba(220,230,255,0)');
        ctx.fillStyle = cone;
        ctx.fillRect(lx - px * 5, h * 0.14, px * 10, groundY - h * 0.14);
      }
      // the express: a horizontal blur of window light
      const bandTop = groundY - px * 9.5, bandH = px * 7;
      ctx.fillStyle = '#0e1430';
      ctx.fillRect(0, bandTop, w, bandH);
      for (let i = 0; i < 18; i += 1) {
        const lx = ((i * 61 + A.t * 14) % (w + 90)) - 45;
        ctx.fillStyle = `rgba(${i % 3 ? '255,224,160' : '180,210,255'},${0.5 + (i % 2) * 0.3})`;
        ctx.fillRect(lx, bandTop + px * 1.2 + (i % 3) * px * 1.7, px * (5 + (i % 3) * 3), px * 1.1);
      }
      ctx.fillStyle = `rgba(210,225,255,${0.05 + 0.03 * Math.sin(A.t * 0.3)})`;
      ctx.fillRect(0, bandTop, w, bandH);
      // platform edge + safety line
      ctx.fillStyle = '#161d3a';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = 'rgba(250,210,110,0.7)';
      ctx.fillRect(0, groundY + px * 0.8, w, px * 0.7);
      // him alone behind the line
      idol(w * 0.36, groundY, px, {});
    };

    // "이런 내가 너무 싫어" — rain tracing down the glass over city bokeh
    const sceneWindow = (playing) => {
      const { w, h, groundY, px } = A.layout;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0e1226'); g.addColorStop(1, '#131730');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const wx = w * 0.3, wy = h * 0.1, ww = w * 0.62, wh = h * 0.58;
      ctx.save();
      ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
      const sg = ctx.createLinearGradient(0, wy, 0, wy + wh);
      sg.addColorStop(0, '#131c40'); sg.addColorStop(1, '#232b52');
      ctx.fillStyle = sg;
      ctx.fillRect(wx, wy, ww, wh);
      // out-of-focus city lights
      for (let i = 0; i < 12; i += 1) {
        const bx = wx + ((i * 73) % ww);
        const by = wy + wh * (0.45 + ((i * 37) % 50) / 100);
        const r = px * (1 + (i % 3));
        const bok = ctx.createRadialGradient(bx, by, 0, bx, by, r * 2.4);
        const col = i % 4 === 0 ? '255,170,150' : '255,214,140';
        bok.addColorStop(0, `rgba(${col},0.5)`);
        bok.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = bok;
        ctx.beginPath(); ctx.arc(bx, by, r * 2.4, 0, TAU); ctx.fill();
      }
      // droplets trickling down the pane
      for (let i = 0; i < 10; i += 1) {
        const ph = ((A.t * (0.002 + (i % 4) * 0.0012)) + i / 10) % 1;
        const dx2 = wx + ((i * 89) % ww) + Math.sin(ph * 9 + i) * px * 0.5;
        const dy2 = wy + ph * wh;
        ctx.strokeStyle = 'rgba(200,220,255,0.28)';
        ctx.lineWidth = Math.max(1, px * 0.22);
        ctx.beginPath(); ctx.moveTo(dx2, dy2 - px * 4); ctx.lineTo(dx2, dy2); ctx.stroke();
        ctx.fillStyle = 'rgba(220,235,255,0.6)';
        ctx.beginPath(); ctx.arc(dx2, dy2, px * 0.35, 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = '#2a3354'; ctx.lineWidth = Math.max(2, px * 0.7);
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
      ctx.fillStyle = '#0c1124';
      ctx.fillRect(0, groundY, w, h - groundY);
      // a small lamp keeps the room barely warm
      const lx2 = w * 0.12;
      const lg2 = ctx.createRadialGradient(lx2, groundY - px * 6, 0, lx2, groundY - px * 6, px * 8);
      lg2.addColorStop(0, 'rgba(255,206,130,0.3)');
      lg2.addColorStop(1, 'rgba(255,206,130,0)');
      ctx.fillStyle = lg2;
      ctx.fillRect(lx2 - px * 8, groundY - px * 14, px * 16, px * 16);
      ctx.fillStyle = '#c9a06a';
      ctx.fillRect(lx2 - px * 1.2, groundY - px * 7.2, px * 2.4, px * 1.4);
      ctx.fillStyle = '#0a1024';
      ctx.fillRect(lx2 - px * 0.3, groundY - px * 5.8, px * 0.6, px * 5.8);
      // him at the glass
      idol(w * 0.52, groundY, px, { look: 1 });
    };


    // a narrow back alley — a swaying bulb, vent steam, nowhere in particular
    const sceneAlley = (playing) => {
      const { w, h, groundY, px, figW } = A.layout;
      // sliver of night sky above the wall
      skyGrad('#101a3e', '#1e2850', h * 0.3);
      stars(0.5);
      // long brick wall
      ctx.fillStyle = '#181f3c';
      ctx.fillRect(0, h * 0.18, w, groundY - h * 0.18);
      ctx.fillStyle = 'rgba(10,14,32,0.5)';
      for (let y = h * 0.2; y < groundY; y += px * 2.2) {
        for (let x = ((y / (px * 2.2)) % 2) * px * 2; x < w; x += px * 4) {
          ctx.fillRect(x, y, px * 3.6, px * 0.14);
        }
      }
      // barred windows
      [0.14, 0.55, 0.86].forEach((fx) => {
        const wx2 = w * fx, wy2 = h * 0.3;
        ctx.fillStyle = '#0c1228';
        ctx.fillRect(wx2 - px * 2, wy2, px * 4, px * 3);
        ctx.strokeStyle = '#181f3c'; ctx.lineWidth = Math.max(1, px * 0.25);
        for (let b = 1; b < 4; b += 1) {
          ctx.beginPath();
          ctx.moveTo(wx2 - px * 2 + (px * 4 * b) / 4, wy2);
          ctx.lineTo(wx2 - px * 2 + (px * 4 * b) / 4, wy2 + px * 3);
          ctx.stroke();
        }
      });
      // swaying bulb on a wire
      const bx2 = w * 0.5, wireY = h * 0.16;
      const swayA = Math.sin(A.t * 0.02) * 0.12;
      const bulbX = bx2 + Math.sin(swayA) * px * 6, bulbY = wireY + Math.cos(swayA) * px * 5;
      ctx.strokeStyle = '#0a1024'; ctx.lineWidth = Math.max(1, px * 0.22);
      ctx.beginPath(); ctx.moveTo(bx2, wireY); ctx.lineTo(bulbX, bulbY); ctx.stroke();
      const bg3 = ctx.createRadialGradient(bulbX, bulbY, 0, bulbX, bulbY, px * 9);
      bg3.addColorStop(0, 'rgba(255,214,140,0.45)');
      bg3.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = bg3;
      ctx.fillRect(bulbX - px * 9, bulbY - px * 2, px * 18, px * 16);
      ctx.fillStyle = '#ffe9b8';
      ctx.beginPath(); ctx.arc(bulbX, bulbY, px * 0.7, 0, TAU); ctx.fill();
      // ground + wet pool under the bulb
      ctx.fillStyle = '#0c1124';
      ctx.fillRect(0, groundY, w, h - groundY);
      wetGlow(bulbX, groundY, px * 8, h - groundY, 'rgba(255,214,140,', 0.16, 4);
      // dumpster + boxes
      ctx.fillStyle = '#131b36';
      ctx.fillRect(w * 0.8, groundY - px * 4.4, px * 7, px * 4.4);
      ctx.fillRect(w * 0.79, groundY - px * 5, px * 7.4, px * 0.9);
      ctx.fillRect(w * 0.08, groundY - px * 2.6, px * 3.4, px * 2.6);
      ctx.fillRect(w * 0.14, groundY - px * 4.2, px * 2.8, px * 1.8);
      // vent steam drifting up
      for (let i = 0; i < 5; i += 1) {
        const ph = ((A.t * 0.004) + i / 5) % 1;
        const sx3 = w * 0.68 + Math.sin(ph * 5 + i) * px * 1.6;
        const sy3 = groundY - ph * px * 12;
        ctx.fillStyle = `rgba(150,165,200,${(1 - ph) * 0.16})`;
        ctx.beginPath(); ctx.arc(sx3, sy3, px * (1 + ph * 2.2), 0, TAU); ctx.fill();
      }
      if (playing) { A.wanderer.x += Math.max(0.45, w * 0.0015); A.wanderer.walk += 0.115; if (A.wanderer.x > w + figW) A.wanderer.x = -figW; }
      idol(A.wanderer.x, groundY, px, { walk: A.wanderer.walk });
      rain(0.3, playing);
    };

    // the last bus that never comes — waiting alone under the shelter light
    const sceneBusstop = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#101836', '#252f5c', groundY);
      moon(w * 0.82, h * 0.14, Math.max(8, h * 0.045));
      stars(0.8);
      litSkyline(groundY, 0.45, 'rgba(255,210,140,0.5)');
      ctx.fillStyle = '#0c1124';
      ctx.fillRect(0, groundY, w, h - groundY);
      // road edge stripe
      ctx.fillStyle = 'rgba(210,220,255,0.1)';
      ctx.fillRect(0, groundY + px * 2.6, w, px * 0.6);
      // headlights far down the road that never get here
      const far = 0.5 + 0.5 * Math.sin(A.t * 0.015);
      const hlx = w * 0.97, hly = groundY - px * 2;
      const hg = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, px * (6 + far * 3));
      hg.addColorStop(0, `rgba(255,240,200,${0.12 + far * 0.08})`);
      hg.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(hlx - px * 10, hly - px * 8, px * 20, px * 16);
      // the shelter
      const shx = w * 0.4, shw = px * 12, roofY = groundY - px * 10.5;
      // glass back panel
      ctx.fillStyle = 'rgba(150,180,235,0.09)';
      ctx.fillRect(shx - shw / 2, roofY + px, shw, groundY - roofY - px);
      // bench inside
      ctx.fillStyle = '#131b36';
      ctx.fillRect(shx - shw * 0.32, groundY - px * 2.6, shw * 0.64, px * 0.8);
      ctx.fillRect(shx - shw * 0.28, groundY - px * 1.8, px * 0.7, px * 1.8);
      ctx.fillRect(shx + shw * 0.22, groundY - px * 1.8, px * 0.7, px * 1.8);
      // posts + roof
      ctx.fillStyle = '#0e1530';
      ctx.fillRect(shx - shw / 2, roofY, px * 0.8, groundY - roofY);
      ctx.fillRect(shx + shw / 2 - px * 0.8, roofY, px * 0.8, groundY - roofY);
      ctx.fillRect(shx - shw / 2 - px, roofY - px * 1.1, shw + px * 2, px * 1.4);
      // soft light under the roof
      const lg3 = ctx.createLinearGradient(0, roofY, 0, groundY);
      lg3.addColorStop(0, 'rgba(235,240,255,0.16)');
      lg3.addColorStop(1, 'rgba(235,240,255,0)');
      ctx.fillStyle = lg3;
      ctx.fillRect(shx - shw / 2, roofY, shw, groundY - roofY);
      // glowing route sign on its own pole
      const pgx = shx + shw / 2 + px * 4;
      ctx.fillStyle = '#0a1024';
      ctx.fillRect(pgx - px * 0.35, groundY - px * 9, px * 0.7, px * 9);
      const sg2 = 0.8 + 0.2 * Math.sin(A.t * 0.05);
      ctx.fillStyle = `rgba(255,206,120,${0.75 * sg2})`;
      ctx.fillRect(pgx - px * 1.8, groundY - px * 11.2, px * 3.6, px * 2.4);
      wetGlow(pgx, groundY, px * 5, h - groundY, 'rgba(255,206,120,', 0.14 * sg2, 6);
      wetGlow(shx, groundY, shw * 0.9, h - groundY, 'rgba(220,230,255,', 0.08, 9);
      // him under the shelter, watching the empty road
      idol(shx - px * 1.5, groundY, px, { look: 1 });
      rain(0.5, playing);
    };

    // the only thing still lit — a convenience store spilling light on the wet street
    const sceneStore = (playing) => {
      const { w, h, groundY, px } = A.layout;
      skyGrad('#0f1734', '#222b54', groundY);
      stars(0.7);
      litSkyline(groundY, 0.4, 'rgba(255,210,140,0.4)');
      ctx.fillStyle = '#0b1022';
      ctx.fillRect(0, groundY, w, h - groundY);
      // storefront
      const stx = w * 0.56, stw = w * 0.4, sth = h * 0.34, sty = groundY - sth;
      ctx.fillStyle = '#141b38';
      ctx.fillRect(stx, sty - px * 3, stw, sth + px * 3);
      // sign band: glowing color blocks, one stutters
      const on2 = Math.sin(A.t * 0.23) > -0.4 ? 1 : 0.3;
      [['80,200,255', 0.02, 1], ['255,120,140', 0.3, on2], ['255,214,120', 0.58, 1]].forEach(([col, off, o2]) => {
        ctx.fillStyle = `rgba(${col},${0.85 * o2})`;
        ctx.fillRect(stx + stw * off + px, sty - px * 2.2, stw * 0.24, px * 1.6);
      });
      // big bright window with shelf bands
      const wgx = stx + px, wgy = sty + px * 1.5, wgw = stw - px * 5.5, wgh = sth - px * 3.5;
      ctx.fillStyle = 'rgba(255,238,190,0.92)';
      ctx.fillRect(wgx, wgy, wgw, wgh);
      ctx.fillStyle = 'rgba(190,150,90,0.55)';
      for (let r2 = 1; r2 < 4; r2 += 1) {
        ctx.fillRect(wgx + px * 0.8, wgy + (wgh * r2) / 4, wgw - px * 1.6, px * 0.5);
      }
      // little products on the shelves
      for (let i = 0; i < 12; i += 1) {
        const cols2 = ['110,170,220', '220,120,120', '120,190,140', '230,180,90'];
        ctx.fillStyle = `rgba(${cols2[i % 4]},0.9)`;
        ctx.fillRect(wgx + px * 1.2 + (i % 4) * (wgw / 4.4), wgy + (wgh * (1 + Math.floor(i / 4))) / 4 - px * 1.4, px * 1.5, px * 1.2);
      }
      // door
      ctx.fillStyle = 'rgba(255,228,170,0.85)';
      ctx.fillRect(stx + stw - px * 4, sty + px * 1.5, px * 3, sth - px * 1.5);
      // light spilling onto the pavement
      const spill = ctx.createLinearGradient(0, groundY, 0, groundY + (h - groundY) * 0.9);
      spill.addColorStop(0, 'rgba(255,236,180,0.22)');
      spill.addColorStop(1, 'rgba(255,236,180,0)');
      ctx.fillStyle = spill;
      ctx.beginPath();
      ctx.moveTo(wgx, groundY);
      ctx.lineTo(wgx + wgw, groundY);
      ctx.lineTo(wgx + wgw + px * 6, h);
      ctx.lineTo(wgx - px * 6, h);
      ctx.closePath(); ctx.fill();
      wetGlow(wgx + wgw / 2, groundY, wgw, h - groundY, 'rgba(255,236,180,', 0.12, 2);
      // him in the light, looking in
      idol(stx - px * 4, groundY, px, { look: 1 });
      rain(0.4, playing);
    };

    const SCENES = {
      street: sceneStreet, day: sceneDay, citywalk: sceneCitywalk, room: sceneRoom,
      train: sceneTrain, rooftop: sceneRooftop, house: sceneHouse, neon: sceneNeon,
      storm: sceneStorm, boat: sceneBoat, sunset: sceneSunset, dawn: sceneDawn,
      phonebooth: scenePhonebooth, memory: sceneMemory, cliff: sceneCliff,
      clocktower: sceneClocktower, bench: sceneBench, flashbeam: sceneFlashbeam,
      vigil: sceneVigil, puddle: scenePuddle, mirror: sceneMirror,
      crossroad: sceneCrossroad, overpass: sceneOverpass, platform: scenePlatform, window: sceneWindow,
      alley: sceneAlley, busstop: sceneBusstop, store: sceneStore,
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
      'rescue-light': 'hope', 'page-turn': 'wist', 'pain-fade': 'wist',
      'row-forward': 'neutral', 'final-open': 'smile',
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
          // arm the tok-tok loop (light wrist taps) — no screen shake
          A.knockTimer = Math.max(A.knockTimer, 110); A.houseHurry = true;
          pushDoorRipple(0.4); break;
        case 'heartbeat-knock':
          A.knockTimer = Math.max(A.knockTimer, 130); A.houseHurry = true; A.heartPulse = 1;
          if (!reduced) A.cameraShake = Math.max(A.cameraShake, 0.08);
          pushDoorRipple(0.35); break;
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
        // hold the taps until he has actually reached the door
        const waiting = A.sceneCur === 'house' && A.houseApproach < 0.985;
        if (playing && !waiting) A.knockTimer -= 1;
        // "tok, tok" — the hand hovers by the door and gives two light wrist
        // taps, then rests a beat. Small motion, soft ripples, no thumping.
        const kc = A.t % 84;
        let tap = 0;
        if (kc < 7) tap = Math.sin((kc / 7) * Math.PI);
        else if (kc >= 12 && kc < 19) tap = Math.sin(((kc - 12) / 7) * Math.PI);
        A.wanderer.knockArm = 0.66 + tap * 0.12;
        if (!waiting && (kc === 2 || kc === 14) && A.sceneCur === 'house') pushDoorRipple(0.3);
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
        A.veil += (1 - A.veil) * 0.13;
        if (A.veil > 0.92) {
          // walking in from the street starts fresh on each visit to the house
          if (target === 'house') { A.houseApproach = 0; A.houseHurry = false; A.knockTimer = 0; }
          A.sceneCur = target;
        }
      } else {
        A.veil += (0 - A.veil) * 0.11;
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

      // whisper-thin ambient motes drifting through the air
      if (!reduced) {
        for (let i = 0; i < 8; i += 1) {
          const ph = ((A.t * 0.0012) + i / 8) % 1;
          const ax = ((i * 127) % L.w) + Math.sin(A.t * 0.008 + i * 2.1) * L.px * 3;
          const ay = L.h * (0.15 + ((i * 61) % 55) / 100) - ph * L.h * 0.08;
          ctx.fillStyle = `rgba(220,230,255,${0.045 + 0.035 * Math.sin(A.t * 0.02 + i)})`;
          ctx.fillRect(ax, ay, L.px * 0.4, L.px * 0.4);
        }
      }

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
