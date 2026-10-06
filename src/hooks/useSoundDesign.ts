/**
 * useSoundDesign — Precision Psychoacoustic Sound Engine v3
 *
 * Built for zero latency, tactile immersion, and cinematic atmospheric audio.
 *
 * Core Features:
 *  1. Eager AudioContext DAC Wakeup:
 *     - Listens to first user gesture (pointerdown, touchstart, keydown, scroll) to unblock the hardware DAC.
 *     - Master dynamics compressor prevents digital clipping and normalizes master volume.
 *  2. Cinematic Theme Transitions:
 *     - themeLight: Atmospheric golden air gust, radiant C Major 9th chord bloom, cascading sunbeam bells, and crystal shimmer.
 *     - themeDark: Deep nocturnal wind descent, velvet 45Hz sub-bass swell, mystic singing-bowl modal harmonics, and twinkling star chimes.
 *  3. The Loadout Audio (Skills):
 *     - loadoutEquip: Crisp modular cybernetic attachment click, resonant lock tone, and tactile latch body.
 *  4. Public Identity & Telemetry (GitHub & Evidence):
 *     - telemetryScan: High-tech biometric scanner chirp, rapid digital query modulation, and affirmative terminal resolution.
 *  5. Haptic Physical Feedback:
 *     - click / tabSwitch: Dual-layer organic transient (high-frequency bandpassed micro-snap + low-end body thud).
 */

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ks_sound_v2";

type AudioEnv = Window & {
  __ksAudioCtx?: AudioContext;
  __ksCompressor?: DynamicsCompressorNode;
  __ksMasterGain?: GainNode;
};

function getAudioEnv(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === "undefined") return null;
  const win = window as AudioEnv;

  if (!win.__ksAudioCtx) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;

      const ctx = new AudioCtxClass({
        latencyHint: "interactive",
      });

      // Master multiband limiter & compressor
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-14, ctx.currentTime);
      comp.knee.setValueAtTime(10, ctx.currentTime);
      comp.ratio.setValueAtTime(3.5, ctx.currentTime);
      comp.attack.setValueAtTime(0.002, ctx.currentTime);
      comp.release.setValueAtTime(0.12, ctx.currentTime);

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.85, ctx.currentTime);

      comp.connect(master);
      master.connect(ctx.destination);

      win.__ksAudioCtx = ctx;
      win.__ksCompressor = comp;
      win.__ksMasterGain = master;
    } catch {
      return null;
    }
  }

  return win.__ksAudioCtx && win.__ksCompressor
    ? { ctx: win.__ksAudioCtx, master: win.__ksCompressor }
    : null;
}

// Global eager unlock for Web Audio policy
function unlockAudioEngine() {
  const env = getAudioEnv();
  if (!env) return;
  const { ctx } = env;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  // Play a 1-sample silent pulse to wake up audio hardware DAC immediately
  try {
    const silentBuf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = silentBuf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
}

if (typeof window !== "undefined") {
  const opts = { once: true, passive: true };
  window.addEventListener("pointerdown", unlockAudioEngine, opts);
  window.addEventListener("touchstart", unlockAudioEngine, opts);
  window.addEventListener("keydown", unlockAudioEngine, opts);
  window.addEventListener("scroll", unlockAudioEngine, opts);
}

// ─── High-Fidelity Synthesis Building Blocks ─────────────────────────────────

interface ToneOptions {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  gain: number;
  start?: number;
  duration: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  q?: number;
}

function playPureTone(opts: ToneOptions) {
  const env = getAudioEnv();
  if (!env) return;
  const { ctx, master } = env;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime + (opts.start || 0);
  const dur = opts.duration;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = opts.type || "sine";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 20), now + dur);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(opts.gain, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || "lowpass";
    filter.frequency.setValueAtTime(opts.filterFreq, now);
    filter.Q.value = opts.q || 1.0;
    osc.connect(gain);
    gain.connect(filter);
    filter.connect(master);
  } else {
    osc.connect(gain);
    gain.connect(master);
  }

  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function playAtmosphericSweep(options: {
  startFreq: number;
  endFreq: number;
  gain: number;
  duration: number;
  start?: number;
  q?: number;
  filterType?: BiquadFilterType;
}) {
  const env = getAudioEnv();
  if (!env) return;
  const { ctx, master } = env;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime + (options.start || 0);
  const dur = options.duration;
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.ceil(sampleRate * (dur + 0.05));
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  // Filtered pink noise generation for lush organic cinematic atmosphere
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < frameCount; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.96300 * b1 + white * 0.296516;
    b2 = 0.57000 * b2 + white * 1.052691;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = options.filterType || "bandpass";
  filter.frequency.setValueAtTime(Math.max(options.startFreq, 20), now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(options.endFreq, 20), now + dur);
  filter.Q.setValueAtTime(options.q || 1.6, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(options.gain, now + dur * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(now);
  source.stop(now + dur + 0.02);
}

function playTexturedClick(pitch = 1800, weight = 1.0) {
  const env = getAudioEnv();
  if (!env) return;
  const { ctx, master } = env;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;

  // 1. Organic transient snap (bandpassed micro-noise)
  const bufferLen = Math.floor(ctx.sampleRate * 0.015);
  const buffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferLen * 0.25));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(pitch, now);
  noiseFilter.Q.setValueAtTime(2.2, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.05 * weight, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);

  // 2. Tactile thud body (gives weight to the user's action)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.035);

  oscGain.gain.setValueAtTime(0.07 * weight, now);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(now);
  osc.stop(now + 0.04);
}

// ─── Semantic Sound Library ──────────────────────────────────────────────────

const SOUND_LIBRARY = {
  /**
   * Tactile Interaction (Buttons, Links, Selectors)
   * Real tactile haptic feel - mechanical precision
   */
  click: () => {
    playTexturedClick(2200, 1.0);
  },

  /**
   * Delicate Selection / Tab Switch / Filter Click
   * Soft organic switch without intrusive high-pitch click
   */
  tabSwitch: () => {
    playTexturedClick(1600, 0.7);
    playPureTone({
      freq: 580,
      freqEnd: 320,
      type: "sine",
      gain: 0.035,
      duration: 0.06,
    });
  },

  /**
   * "THE LOADOUT" (Skills) Equip Sound
   * Crisp modular attachment snap — sounds like equipping a cybernetic upgrade or tactical tool
   */
  loadoutEquip: () => {
    // 1. Dual mechanical latch transient
    playTexturedClick(2800, 0.85);

    // 2. Cybernetic module lock frequency chirp
    playPureTone({
      freq: 720,
      freqEnd: 1080,
      type: "triangle",
      gain: 0.05,
      duration: 0.07,
    });

    // 3. Resonant socket ping
    playPureTone({
      freq: 1440,
      type: "sine",
      gain: 0.035,
      start: 0.02,
      duration: 0.16,
    });

    // 4. Subtle sub click body
    playPureTone({
      freq: 180,
      freqEnd: 60,
      type: "sine",
      gain: 0.04,
      duration: 0.05,
    });
  },

  /**
   * "PUBLIC IDENTITY / GITHUB" Telemetry Scan
   * Cryptographic terminal scan blip & verifiable credential chirp
   */
  telemetryScan: () => {
    // 1. Dual micro chirps
    playPureTone({ freq: 1760, type: "square", gain: 0.025, start: 0.00, duration: 0.03 });
    playPureTone({ freq: 2200, type: "triangle", gain: 0.035, start: 0.03, duration: 0.035 });

    // 2. Terminal frequency sweep
    playPureTone({
      freq: 880,
      freqEnd: 1568,
      type: "sine",
      gain: 0.04,
      start: 0.05,
      duration: 0.12,
    });

    // 3. Verified clear chime
    playPureTone({
      freq: 1046.5,
      type: "sine",
      gain: 0.05,
      start: 0.12,
      duration: 0.28,
    });
    playPureTone({
      freq: 2093.0,
      type: "sine",
      gain: 0.02,
      start: 0.13,
      duration: 0.22,
    });
  },

  /**
   * Navigation Downward / Advancing Forward
   * Smooth low-register spatial glide giving physical sense of travel
   */
  navForward: () => {
    playPureTone({
      freq: 480,
      freqEnd: 180,
      type: "sine",
      gain: 0.045,
      duration: 0.16,
    });
    playPureTone({
      freq: 960,
      freqEnd: 360,
      type: "triangle",
      gain: 0.018,
      duration: 0.12,
      start: 0.01,
    });
  },

  /**
   * Navigation Upward / Return to Base
   * Light lifting sweep returning the user to the origin
   */
  navBack: () => {
    playPureTone({
      freq: 220,
      freqEnd: 540,
      type: "sine",
      gain: 0.045,
      duration: 0.16,
    });
    playPureTone({
      freq: 440,
      freqEnd: 1080,
      type: "triangle",
      gain: 0.018,
      duration: 0.12,
      start: 0.01,
    });
  },

  /**
   * Mobile Menu Open
   * Atmospheric spatial expansion
   */
  menuOpen: () => {
    playTexturedClick(1200, 0.6);
    playPureTone({ freq: 261.63, freqEnd: 329.63, type: "sine", gain: 0.04, duration: 0.18 });
    playPureTone({ freq: 392.00, freqEnd: 493.88, type: "sine", gain: 0.03, duration: 0.22, start: 0.03 });
    playPureTone({ freq: 523.25, freqEnd: 659.25, type: "triangle", gain: 0.025, duration: 0.25, start: 0.06 });
  },

  /**
   * Mobile Menu Close
   * Soft settling closure
   */
  menuClose: () => {
    playTexturedClick(800, 0.5);
    playPureTone({ freq: 523.25, freqEnd: 261.63, type: "sine", gain: 0.04, duration: 0.15 });
  },

  /**
   * Evidence Harvested / XP Collected
   * Radiant crystalline chord cascade — releases positive reinforcement
   */
  collect: () => {
    const notes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7
    notes.forEach((f, i) => {
      playPureTone({
        freq: f,
        freqEnd: f * 1.03,
        type: "sine",
        gain: 0.035 - i * 0.005,
        start: i * 0.045,
        duration: 0.24,
      });
      // Harmonic bell overtone
      playPureTone({
        freq: f * 2,
        type: "triangle",
        gain: 0.012,
        start: i * 0.045,
        duration: 0.12,
      });
    });
  },

  /**
   * Milestone / Stage Clearance Unlocked
   * Uplifting harmonic triumph with golden shimmer
   */
  unlock: () => {
    const chord = [
      { f: 523.25, delay: 0.00, dur: 0.35, g: 0.05 }, // C5
      { f: 659.25, delay: 0.08, dur: 0.40, g: 0.05 }, // E5
      { f: 783.99, delay: 0.16, dur: 0.45, g: 0.055 }, // G5
      { f: 1046.5, delay: 0.24, dur: 0.55, g: 0.06 }, // C6
      { f: 1567.98, delay: 0.34, dur: 0.70, g: 0.04 }, // G6
    ];

    chord.forEach((n) => {
      playPureTone({
        freq: n.f,
        type: "sine",
        gain: n.g,
        start: n.delay,
        duration: n.dur,
      });
      playPureTone({
        freq: n.f * 1.5,
        type: "triangle",
        gain: n.g * 0.3,
        start: n.delay + 0.02,
        duration: n.dur * 0.7,
      });
    });
  },

  /**
   * Secret Dossier / Resume Decryption
   * Fast cinematic high-tech telemetry burst into resonant confirm
   */
  dossierReveal: () => {
    for (let i = 0; i < 4; i++) {
      playPureTone({
        freq: 1800 + i * 220,
        type: "triangle",
        gain: 0.03,
        start: i * 0.03,
        duration: 0.025,
      });
    }
    playPureTone({
      freq: 880,
      freqEnd: 1174.66,
      type: "sine",
      gain: 0.05,
      start: 0.15,
      duration: 0.32,
    });
    playPureTone({
      freq: 1760,
      type: "sine",
      gain: 0.025,
      start: 0.20,
      duration: 0.40,
    });
  },

  /**
   * System Engagement (Main CTA "Enter Protocol")
   * Deep cinematic reactor spool up & resonant locked-in click
   */
  protocolEngage: () => {
    playPureTone({
      freq: 70,
      freqEnd: 240,
      type: "sine",
      gain: 0.08,
      duration: 0.24,
    });
    playPureTone({
      freq: 320,
      freqEnd: 880,
      type: "triangle",
      gain: 0.045,
      start: 0.12,
      duration: 0.22,
    });
    playTexturedClick(2400, 1.2);
  },

  /**
   * DAYBREAK BLOOM / Light Theme Transition
   * Replaced boring beeps with a cinematic dawn awakening:
   *  1. Warm atmospheric air gust sweeping upward through clouds
   *  2. Radiant C Major 9th harmonic swell (C3, G3, E4, B4, D5)
   *  3. Cascading golden sunbeam bells (G5, C6, E6, A6, C7)
   *  4. Golden prism flash ping right as the smiling sun reaches the center!
   */
  themeLight: () => {
    // 1. Atmospheric warm air gust lifting clouds
    playAtmosphericSweep({
      startFreq: 280,
      endFreq: 1400,
      gain: 0.035,
      duration: 0.70,
      q: 1.4,
    });

    // 2. Harmonic warm pad swell (C Major 9th)
    playPureTone({ freq: 130.81, freqEnd: 164.81, type: "sine", gain: 0.05, duration: 0.55 }); // C3
    playPureTone({ freq: 196.00, freqEnd: 246.94, type: "sine", gain: 0.04, start: 0.05, duration: 0.50 }); // G3
    playPureTone({ freq: 329.63, freqEnd: 392.00, type: "triangle", gain: 0.035, start: 0.10, duration: 0.48 }); // E4
    playPureTone({ freq: 493.88, type: "sine", gain: 0.03, start: 0.16, duration: 0.42 }); // B4 (maj7)
    playPureTone({ freq: 587.33, type: "sine", gain: 0.025, start: 0.22, duration: 0.38 }); // D5 (add9)

    // 3. Cascading golden sunbeam bells
    const sunChimes = [
      { f: 783.99, delay: 0.12, dur: 0.35, g: 0.04 }, // G5
      { f: 1046.50, delay: 0.20, dur: 0.40, g: 0.045 }, // C6
      { f: 1318.51, delay: 0.28, dur: 0.45, g: 0.05 }, // E6
      { f: 1760.00, delay: 0.36, dur: 0.50, g: 0.04 }, // A6
      { f: 2093.00, delay: 0.45, dur: 0.65, g: 0.045 }, // C7 (Sun crests!)
      { f: 2637.02, delay: 0.48, dur: 0.60, g: 0.025 }, // E7 shimmer
    ];

    sunChimes.forEach((c) => {
      playPureTone({
        freq: c.f,
        type: "sine",
        gain: c.g,
        start: c.delay,
        duration: c.dur,
      });
      // Glassy bell overtone
      playPureTone({
        freq: c.f * 1.5,
        type: "triangle",
        gain: c.g * 0.28,
        start: c.delay + 0.01,
        duration: c.dur * 0.65,
      });
    });

    // 4. Soft golden prism sparkle right as theme commits swap (+0.48s)
    playPureTone({
      freq: 3135.96,
      type: "sine",
      gain: 0.02,
      start: 0.48,
      duration: 0.55,
    });
  },

  /**
   * NOCTURNE VEIL / Dark Theme Transition
   * Replaced boring beeps with a deep, velvety cinematic nightfall:
   *  1. Cool nocturnal wind sweep descending through the night sky
   *  2. Deep velvet 45Hz sub-bass dive giving relaxing physical weight
   *  3. Ethereal modal singing-bowl harmonics (D3, A3, F4, C5)
   *  4. Delicate crystalline stardust sparkles accompanying the crescent moon
   */
  themeDark: () => {
    // 1. Cool nighttime breeze descending
    playAtmosphericSweep({
      startFreq: 1200,
      endFreq: 160,
      gain: 0.04,
      duration: 0.80,
      q: 1.6,
      filterType: "lowpass",
    });

    // 2. Velvet cinematic sub-bass dive (soothing and deep)
    playPureTone({
      freq: 130,
      freqEnd: 46,
      type: "sine",
      gain: 0.075,
      duration: 0.70,
    });
    playPureTone({
      freq: 65,
      freqEnd: 32,
      type: "triangle",
      gain: 0.035,
      start: 0.05,
      duration: 0.65,
    });

    // 3. Ethereal singing-bowl modal harmonics
    playPureTone({ freq: 146.83, type: "sine", gain: 0.045, start: 0.08, duration: 0.60 }); // D3
    playPureTone({ freq: 220.00, type: "sine", gain: 0.04, start: 0.15, duration: 0.55 }); // A3
    playPureTone({ freq: 349.23, type: "triangle", gain: 0.035, start: 0.22, duration: 0.50 }); // F4
    playPureTone({ freq: 523.25, type: "sine", gain: 0.03, start: 0.30, duration: 0.48 }); // C5
    playPureTone({ freq: 783.99, type: "sine", gain: 0.025, start: 0.38, duration: 0.45 }); // G5

    // 4. Twinkling star pings accompanying the crescent moon & stars
    const starPings = [
      { f: 1318.51, delay: 0.22, dur: 0.40, g: 0.03 }, // E6
      { f: 1975.53, delay: 0.34, dur: 0.45, g: 0.035 }, // B6
      { f: 2637.02, delay: 0.48, dur: 0.60, g: 0.03 }, // E7 (Moon center)
      { f: 3520.00, delay: 0.52, dur: 0.50, g: 0.018 }, // A7 crystal stardust
    ];

    starPings.forEach((s) => {
      playPureTone({
        freq: s.f,
        type: "sine",
        gain: s.g,
        start: s.delay,
        duration: s.dur,
      });
    });
  },

  /**
   * Audio Engine Activated Feedback
   */
  soundOn: () => {
    playTexturedClick(1800, 0.8);
    playPureTone({ freq: 440, freqEnd: 659.25, type: "sine", gain: 0.05, start: 0.03, duration: 0.16 });
  },

  // Backward compatibility aliases
  telemetryClick: () => SOUND_LIBRARY.tabSwitch(),
  warpJump: () => SOUND_LIBRARY.navForward(),
  dossierDecrypted: () => SOUND_LIBRARY.dossierReveal(),
  hover: () => {}, // Zero hover noise for pristine psychological UX
  whoosh: () => SOUND_LIBRARY.navForward(),
  modeSwitch: () => SOUND_LIBRARY.tabSwitch(),
};

export function useSoundDesign() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  }, [enabled]);

  const sounds = useRef(
    Object.fromEntries(
      Object.entries(SOUND_LIBRARY).map(([key, fn]) => [
        key,
        (...args: any[]) => {
          if (!enabled) return;
          unlockAudioEngine();
          (fn as any)(...args);
        },
      ])
    ) as typeof SOUND_LIBRARY
  ).current;

  // Keep references updated when enabled changes
  useEffect(() => {
    Object.keys(SOUND_LIBRARY).forEach((k) => {
      const orig = (SOUND_LIBRARY as any)[k];
      (sounds as any)[k] = (...args: any[]) => {
        if (!enabled) return;
        unlockAudioEngine();
        orig(...args);
      };
    });
  }, [enabled, sounds]);

  const toggleSound = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          unlockAudioEngine();
          SOUND_LIBRARY.soundOn();
        }, 50);
      }
      return next;
    });
  }, []);

  return { enabled, setEnabled, sounds, toggleSound };
}