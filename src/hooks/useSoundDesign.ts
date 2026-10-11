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
  attack?: number;
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
    const attack = opts.attack ?? 0.008;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.freq, now);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 20), now + dur);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(opts.gain, now + attack);
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

function playWarmChime(freq: number, gain = 0.03, duration = 0.35, start = 0, harmonic = true) {
  playPureTone({
    freq,
    type: "sine",
    gain,
    start,
    duration,
    attack: 0.008,
  });
  if (harmonic) {
    playPureTone({
      freq: freq * 2,
      type: "sine",
      gain: gain * 0.18,
      start: start + 0.004,
      duration: duration * 0.55,
      attack: 0.006,
    });
  }
}

function playSoftOrganicTap(pitch = 440, weight = 1.0) {
  const env = getAudioEnv();
  if (!env) return;
  const { ctx, master } = env;

  const schedule = () => {
    const now = ctx.currentTime;

    // Gentle tactile body (soft, warm marimba-like resonance)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(pitch * 0.45, 40), now + 0.035);

    oscGain.gain.setValueAtTime(0.035 * weight, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.04);

    // Subtle velvet whisper
    const noise = ctx.createBufferSource();
    noise.buffer = getPrecomputedNoise(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.setValueAtTime(1.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.012 * weight, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.022);
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

function playTexturedClick(pitch = 500, weight = 0.8) {
  playSoftOrganicTap(pitch, weight);
}

// ─── Semantic Sound Library ──────────────────────────────────────────────────

const SOUND_LIBRARY = {
  // Generic UI tap — gentle marimba-like soft pluck
  click: () => {
    playSoftOrganicTap(480, 0.75);
    playWarmChime(960, 0.012, 0.22, 0.005, false);
  },

  // Project/Achievement tab switch — soft two-note chime (C5 → E5 interval)
  tabSwitch: () => {
    playWarmChime(523.25, 0.028, 0.30, 0.0);
    playWarmChime(659.25, 0.022, 0.28, 0.065);
  },

  // Loadout / skill chip equip — warm three-tone ascending (pentatonic, like wind chimes)
  loadoutEquip: () => {
    playWarmChime(392.00, 0.025, 0.32, 0.00);
    playWarmChime(523.25, 0.022, 0.30, 0.07);
    playWarmChime(659.25, 0.018, 0.28, 0.14);
  },

  // GitHub / telemetry stat click — delicate crystal ping with harmonic shimmer
  telemetryScan: () => {
    playWarmChime(1046.5, 0.025, 0.38, 0.0);
    playWarmChime(1318.51, 0.018, 0.32, 0.06);
    playPureTone({
      freq: 880,
      freqEnd: 880,
      type: "sine",
      gain: 0.015,
      start: 0.0,
      duration: 0.48,
      attack: 0.015,
    });
  },

  // Navigate to section — soft two-tone ascending (like a calm door chime)
  navForward: () => {
    playWarmChime(523.25, 0.028, 0.22, 0.0);
    playWarmChime(659.25, 0.022, 0.20, 0.08);
  },

  // Back to top — gentle two-tone descending
  navBack: () => {
    playWarmChime(659.25, 0.026, 0.20, 0.0);
    playWarmChime(523.25, 0.020, 0.22, 0.08);
  },

  // Mobile menu open — gentle unfolding (soft wind-chime arpeggio)
  menuOpen: () => {
    playWarmChime(392.00, 0.022, 0.26, 0.00);
    playWarmChime(523.25, 0.018, 0.24, 0.06);
    playWarmChime(659.25, 0.015, 0.22, 0.12);
  },

  // Mobile menu close — soft single descend
  menuClose: () => {
    playWarmChime(523.25, 0.022, 0.24, 0.0);
    playWarmChime(392.00, 0.016, 0.20, 0.07);
  },

  // Evidence particles collect — sparkle cascade (high harmonic chimes)
  collect: () => {
    const sparkles = [
      { f: 1318.51, delay: 0.00, g: 0.020, dur: 0.28 },
      { f: 1567.98, delay: 0.04, g: 0.018, dur: 0.26 },
      { f: 1760.00, delay: 0.09, g: 0.016, dur: 0.24 },
      { f: 2093.00, delay: 0.14, g: 0.013, dur: 0.22 },
    ];
    sparkles.forEach(({ f, delay, g, dur }) => {
      playPureTone({ freq: f, type: "sine", gain: g, start: delay, duration: dur, attack: 0.006 });
    });
  },

  // Stage unlock (unused in UI but kept) — calm ascending minor chord bloom
  unlock: () => {
    const chord = [
      { f: 392.00, delay: 0.00, dur: 0.50, g: 0.030 },
      { f: 493.88, delay: 0.08, dur: 0.55, g: 0.028 },
      { f: 587.33, delay: 0.16, dur: 0.60, g: 0.025 },
      { f: 783.99, delay: 0.26, dur: 0.70, g: 0.022 },
    ];
    chord.forEach((n) => {
      playPureTone({ freq: n.f, type: "sine", gain: n.g, start: n.delay, duration: n.dur, attack: 0.015 });
    });
  },

  // View resume / dossier reveal — gentle paper-flip shimmer then warm confirmation
  dossierReveal: () => {
    // Soft shimmer of three quick high tones (like pages turning)
    [0, 0.04, 0.08].forEach((delay, i) => {
      playPureTone({ freq: 1200 + i * 160, type: "sine", gain: 0.018, start: delay, duration: 0.06, attack: 0.005 });
    });
    // Warm confirming chord
    playWarmChime(523.25, 0.032, 0.40, 0.14);
    playWarmChime(659.25, 0.024, 0.38, 0.21);
    playWarmChime(783.99, 0.018, 0.36, 0.28);
  },

  // Enter protocol button — grounded, calm engagement (low bowl resonance + ascending shimmer)
  protocolEngage: () => {
    // Soft sub-bass foundation (warm singing bowl)
    playPureTone({ freq: 110, freqEnd: 165, type: "sine", gain: 0.045, duration: 0.60, attack: 0.025 });
    // Gentle ascending harmonic glide
    playWarmChime(440,    0.025, 0.45, 0.08);
    playWarmChime(554.37, 0.020, 0.42, 0.20);
    playWarmChime(659.25, 0.016, 0.38, 0.32);
  },

  // Switch to light theme — airy morning birdsong (bright, sparse, gentle)
  themeLight: () => {
    // Rising breath-like noise sweep
    playAtmosphericSweep({ startFreq: 350, endFreq: 1800, gain: 0.022, duration: 0.75, q: 1.2 });
    // Pentatonic sunrise chime cascade
    const dawn = [
      { f: 523.25, delay: 0.04, dur: 0.55, g: 0.028 },
      { f: 659.25, delay: 0.12, dur: 0.50, g: 0.026 },
      { f: 783.99, delay: 0.20, dur: 0.48, g: 0.024 },
      { f: 1046.5, delay: 0.28, dur: 0.55, g: 0.022 },
      { f: 1318.51, delay: 0.38, dur: 0.60, g: 0.018 },
      { f: 1567.98, delay: 0.46, dur: 0.65, g: 0.014 },
    ];
    dawn.forEach(({ f, delay, dur, g }) => {
      playWarmChime(f, g, dur, delay);
    });
    // Gentle high shimmer finish
    playPureTone({ freq: 2093.00, type: "sine", gain: 0.012, start: 0.55, duration: 0.50, attack: 0.018 });
  },

  // Switch to dark theme — deep tranquil settling (nightfall bowl-like descent)
  themeDark: () => {
    // Downward breath-like noise sweep
    playAtmosphericSweep({ startFreq: 1400, endFreq: 200, gain: 0.025, duration: 0.85, q: 1.5, filterType: "lowpass" });
    // Deep warm bass settle
    playPureTone({ freq: 110, freqEnd: 55,  type: "sine", gain: 0.048, duration: 0.80, attack: 0.030 });
    playPureTone({ freq: 165, freqEnd: 110, type: "sine", gain: 0.032, duration: 0.75, start: 0.06, attack: 0.025 });
    // Distant star-like crystalline pings (sparse, long decay)
    const stars = [
      { f: 659.25,  delay: 0.14, dur: 0.60, g: 0.018 },
      { f: 783.99,  delay: 0.28, dur: 0.65, g: 0.015 },
      { f: 1046.5,  delay: 0.42, dur: 0.70, g: 0.012 },
      { f: 1318.51, delay: 0.55, dur: 0.75, g: 0.009 },
    ];
    stars.forEach(({ f, delay, dur, g }) => {
      playPureTone({ freq: f, type: "sine", gain: g, start: delay, duration: dur, attack: 0.018 });
    });
  },

  // Audio re-enabled confirmation — soft confirmation chime (two-note bell)
  soundOn: () => {
    playWarmChime(523.25, 0.030, 0.28, 0.0);
    playWarmChime(783.99, 0.024, 0.32, 0.09);
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