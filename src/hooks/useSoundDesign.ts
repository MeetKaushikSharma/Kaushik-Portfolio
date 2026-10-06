/**
 * useSoundDesign — Zero-Latency Psychoacoustic Audio Engine v4
 *
 * Engineered for instant, deterministic playback with:
 *  1. Eager AudioContext unlock on user gestures with async state handling.
 *  2. Keep-alive silent node ensuring browser never suspends the audio engine.
 *  3. Pre-allocated 2-second pink noise buffer (zero CPU allocation on click/theme sweeps).
 *  4. Clean audio on/off toggle that reliably mutes and restores sound.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ks_sound_v2";

type AudioEnv = {
  ctx: AudioContext;
  master: GainNode;
  compressor: DynamicsCompressorNode;
};

let globalEnv: AudioEnv | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let keepAliveOsc: OscillatorNode | null = null;

function getAudioEnv(): AudioEnv | null {
  if (typeof window === "undefined") return null;

  if (!globalEnv) {
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

      globalEnv = { ctx, master, compressor: comp };
    } catch {
      return null;
    }
  }

  return globalEnv;
}

function startKeepAlive(ctx: AudioContext) {
  if (keepAliveOsc) return;
  try {
    // Inaudible sub-bass keep-alive node prevents browser from putting audio thread to sleep
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(10, ctx.currentTime);
    g.gain.setValueAtTime(0.000001, ctx.currentTime);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    keepAliveOsc = osc;
  } catch {}
}

function getPrecomputedNoise(ctx: AudioContext): AudioBuffer {
  if (!cachedNoiseBuffer || cachedNoiseBuffer.sampleRate !== ctx.sampleRate) {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 1.5); // 1.5s reusable buffer
    const buf = ctx.createBuffer(1, length, sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.296516;
      b2 = 0.57000 * b2 + white * 1.052691;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }
    cachedNoiseBuffer = buf;
  }
  return cachedNoiseBuffer;
}

// Global unlock on true user gestures (pointerdown, touchstart, keydown)
function unlockAudioEngine() {
  const env = getAudioEnv();
  if (!env) return;
  const { ctx } = env;

  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      startKeepAlive(ctx);
    }).catch(() => {});
  } else {
    startKeepAlive(ctx);
  }
}

if (typeof window !== "undefined") {
  const opts = { passive: true };
  window.addEventListener("pointerdown", unlockAudioEngine, opts);
  window.addEventListener("touchstart", unlockAudioEngine, opts);
  window.addEventListener("keydown", unlockAudioEngine, opts);
  window.addEventListener("click", unlockAudioEngine, opts);
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

  const schedule = () => {
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

    setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    }, (dur + (opts.start || 0) + 0.1) * 1000);
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(() => schedule()).catch(() => {});
  } else {
    schedule();
  }
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

  const schedule = () => {
    const now = ctx.currentTime + (options.start || 0);
    const dur = options.duration;
    const buffer = getPrecomputedNoise(ctx);

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

    setTimeout(() => {
      try {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    }, (dur + (options.start || 0) + 0.1) * 1000);
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(() => schedule()).catch(() => {});
  } else {
    schedule();
  }
}

function playTexturedClick(pitch = 1800, weight = 1.0) {
  const env = getAudioEnv();
  if (!env) return;
  const { ctx, master } = env;

  const schedule = () => {
    const now = ctx.currentTime;

    // 1. Transient snap from precomputed buffer (instant!)
    const noise = ctx.createBufferSource();
    noise.buffer = getPrecomputedNoise(ctx);

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
    noise.stop(now + 0.02);

    // 2. Tactile thud body
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
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(() => schedule()).catch(() => {});
  } else {
    schedule();
  }
}

// ─── Semantic Sound Library ──────────────────────────────────────────────────

const SOUND_LIBRARY = {
  click: () => {
    playTexturedClick(2200, 1.0);
  },

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

  loadoutEquip: () => {
    playTexturedClick(2800, 0.85);
    playPureTone({
      freq: 720,
      freqEnd: 1080,
      type: "triangle",
      gain: 0.05,
      duration: 0.07,
    });
    playPureTone({
      freq: 1440,
      type: "sine",
      gain: 0.035,
      start: 0.02,
      duration: 0.16,
    });
    playPureTone({
      freq: 180,
      freqEnd: 60,
      type: "sine",
      gain: 0.04,
      duration: 0.05,
    });
  },

  telemetryScan: () => {
    playPureTone({ freq: 1760, type: "square", gain: 0.025, start: 0.00, duration: 0.03 });
    playPureTone({ freq: 2200, type: "triangle", gain: 0.035, start: 0.03, duration: 0.035 });
    playPureTone({
      freq: 880,
      freqEnd: 1568,
      type: "sine",
      gain: 0.04,
      start: 0.05,
      duration: 0.12,
    });
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

  menuOpen: () => {
    playTexturedClick(1200, 0.6);
    playPureTone({ freq: 261.63, freqEnd: 329.63, type: "sine", gain: 0.04, duration: 0.18 });
    playPureTone({ freq: 392.00, freqEnd: 493.88, type: "sine", gain: 0.03, duration: 0.22, start: 0.03 });
    playPureTone({ freq: 523.25, freqEnd: 659.25, type: "triangle", gain: 0.025, duration: 0.25, start: 0.06 });
  },

  menuClose: () => {
    playTexturedClick(800, 0.5);
    playPureTone({ freq: 523.25, freqEnd: 261.63, type: "sine", gain: 0.04, duration: 0.15 });
  },

  collect: () => {
    const notes = [1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((f, i) => {
      playPureTone({
        freq: f,
        freqEnd: f * 1.03,
        type: "sine",
        gain: 0.035 - i * 0.005,
        start: i * 0.045,
        duration: 0.24,
      });
      playPureTone({
        freq: f * 2,
        type: "triangle",
        gain: 0.012,
        start: i * 0.045,
        duration: 0.12,
      });
    });
  },

  unlock: () => {
    const chord = [
      { f: 523.25, delay: 0.00, dur: 0.35, g: 0.05 },
      { f: 659.25, delay: 0.08, dur: 0.40, g: 0.05 },
      { f: 783.99, delay: 0.16, dur: 0.45, g: 0.055 },
      { f: 1046.5, delay: 0.24, dur: 0.55, g: 0.06 },
      { f: 1567.98, delay: 0.34, dur: 0.70, g: 0.04 },
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

  themeLight: () => {
    playAtmosphericSweep({
      startFreq: 280,
      endFreq: 1400,
      gain: 0.035,
      duration: 0.70,
      q: 1.4,
    });

    playPureTone({ freq: 130.81, freqEnd: 164.81, type: "sine", gain: 0.05, duration: 0.55 });
    playPureTone({ freq: 196.00, freqEnd: 246.94, type: "sine", gain: 0.04, start: 0.05, duration: 0.50 });
    playPureTone({ freq: 329.63, freqEnd: 392.00, type: "triangle", gain: 0.035, start: 0.10, duration: 0.48 });
    playPureTone({ freq: 493.88, type: "sine", gain: 0.03, start: 0.16, duration: 0.42 });
    playPureTone({ freq: 587.33, type: "sine", gain: 0.025, start: 0.22, duration: 0.38 });

    const sunChimes = [
      { f: 783.99, delay: 0.12, dur: 0.35, g: 0.04 },
      { f: 1046.50, delay: 0.20, dur: 0.40, g: 0.045 },
      { f: 1318.51, delay: 0.28, dur: 0.45, g: 0.05 },
      { f: 1760.00, delay: 0.36, dur: 0.50, g: 0.04 },
      { f: 2093.00, delay: 0.45, dur: 0.65, g: 0.045 },
      { f: 2637.02, delay: 0.48, dur: 0.60, g: 0.025 },
    ];

    sunChimes.forEach((c) => {
      playPureTone({
        freq: c.f,
        type: "sine",
        gain: c.g,
        start: c.delay,
        duration: c.dur,
      });
      playPureTone({
        freq: c.f * 1.5,
        type: "triangle",
        gain: c.g * 0.28,
        start: c.delay + 0.01,
        duration: c.dur * 0.65,
      });
    });

    playPureTone({
      freq: 3135.96,
      type: "sine",
      gain: 0.02,
      start: 0.48,
      duration: 0.55,
    });
  },

  themeDark: () => {
    playAtmosphericSweep({
      startFreq: 1200,
      endFreq: 160,
      gain: 0.04,
      duration: 0.80,
      q: 1.6,
      filterType: "lowpass",
    });

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

    playPureTone({ freq: 146.83, type: "sine", gain: 0.045, start: 0.08, duration: 0.60 });
    playPureTone({ freq: 220.00, type: "sine", gain: 0.04, start: 0.15, duration: 0.55 });
    playPureTone({ freq: 349.23, type: "triangle", gain: 0.035, start: 0.22, duration: 0.50 });
    playPureTone({ freq: 523.25, type: "sine", gain: 0.03, start: 0.30, duration: 0.48 });
    playPureTone({ freq: 783.99, type: "sine", gain: 0.025, start: 0.38, duration: 0.45 });

    const starPings = [
      { f: 1318.51, delay: 0.22, dur: 0.40, g: 0.03 },
      { f: 1975.53, delay: 0.34, dur: 0.45, g: 0.035 },
      { f: 2637.02, delay: 0.48, dur: 0.60, g: 0.03 },
      { f: 3520.00, delay: 0.52, dur: 0.50, g: 0.018 },
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

  soundOn: () => {
    playTexturedClick(1800, 0.8);
    playPureTone({ freq: 440, freqEnd: 659.25, type: "sine", gain: 0.05, start: 0.03, duration: 0.16 });
  },

  // Aliases
  telemetryClick: () => SOUND_LIBRARY.tabSwitch(),
  warpJump: () => SOUND_LIBRARY.navForward(),
  dossierDecrypted: () => SOUND_LIBRARY.dossierReveal(),
  hover: () => {},
  whoosh: () => SOUND_LIBRARY.navForward(),
  modeSwitch: () => SOUND_LIBRARY.tabSwitch(),
};

export function useSoundDesign() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

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
          if (!enabledRef.current) return;
          unlockAudioEngine();
          (fn as any)(...args);
        },
      ])
    ) as typeof SOUND_LIBRARY
  ).current;

  // Clean, single-source audio toggle
  const toggleSound = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      enabledRef.current = next;
      if (next) {
        unlockAudioEngine();
        setTimeout(() => {
          SOUND_LIBRARY.soundOn();
        }, 10);
      }
      return next;
    });
  }, []);

  return { enabled, setEnabled, sounds, toggleSound };
}