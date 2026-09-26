/**
 * useSoundDesign
 *
 * Tiny, programmatic sound design via the Web Audio API.
 * No audio files — every sound is synthesised at runtime, so the bundle
 * stays lean and there are zero network requests.
 *
 * Sounds:
 *  - click   — soft "tick" for button presses
 *  - hover   — airy "whoosh" for interactive hover
 *  - unlock  — rising arpeggio for protocol stage completion
 *  - collect — soft "chime" when evidence is collected
 *  - ambient — barely-there low hum (ducked under music/content)
 */
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ks_protocol_sound";

export function useSoundDesign() {
  const audioCtxRef = useRef<OscillatorNode | null>(null);
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

  // Initialise AudioContext lazily on first user gesture (browser autoplay policy)
  function ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const win = window as Window & { __ksAudio?: AudioContext };
    if (!win.__ksAudio) {
      try {
        win.__ksAudio = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    const ctx = win.__ksAudio;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function play(
    freqs: number[],
    duration: number,
    type: OscillatorType = "sine",
    gain = 0.08,
    slideTo: number | null = null,
    delay = 0
  ) {
    if (!enabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqs[0], now);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    if (freqs.length > 1) {
      freqs.forEach((f, i) => {
        osc.frequency.setValueAtTime(f, now + duration * (i / freqs.length));
      });
    }

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // Public sound API
  const sounds = {
    click: () => play([880], 0.08, "triangle", 0.05),
    hover: () => play([660, 990], 0.12, "sine", 0.04, 1320),
    collect: () => play([1320, 1650, 1980], 0.22, "triangle", 0.06),
    unlock: () => {
      // Rising arpeggio: C-E-G-C
      play([523.25], 0.18, "triangle", 0.07, 659.25);
      play([659.25], 0.18, "triangle", 0.07, 783.99, 0.09);
      play([783.99], 0.18, "triangle", 0.07, 1046.5, 0.18);
      play([1046.5], 0.35, "triangle", 0.08, 1318.5, 0.27);
    },
    whoosh: () => play([330], 0.25, "sine", 0.05, 80, 0.0),
  };

  // Ambient low hum (very quiet, ducked under content)
  useEffect(() => {
    if (!enabled) {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.stop(); } catch {}
        audioCtxRef.current = null;
      }
      return;
    }

    let mounted = true;
    const win = window as Window & { __ksAudio?: AudioContext };

    const startAmbient = () => {
      const ctx = ensureContext();
      if (!ctx || !mounted) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.value = 0.7;

      g.gain.setValueAtTime(0.004, ctx.currentTime);

      osc.connect(filter).connect(g).connect(ctx.destination);
      osc.start();
      audioCtxRef.current = osc;
    };

    startAmbient();

    return () => {
      mounted = false;
      if (audioCtxRef.current) {
        try { audioCtxRef.current.stop(); } catch {}
        audioCtxRef.current = null;
      }
    };
  }, [enabled]);

  return { enabled, setEnabled, sounds };
}