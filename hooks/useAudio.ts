import { useState, useCallback, useEffect, useRef } from 'react';

type SoundType = "click" | "positive" | "negative" | "undo" | "victory" | "defeat";

export const useAudio = () => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("splend_muted");
      if (savedMute) setIsMuted(savedMute === "true");
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("splend_muted", String(next));
      return next;
    });
  }, []);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;
      try {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const now = ctx.currentTime;

        switch (type) {
          case "click": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
            break;
          }
          case "undo": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
          }
          case "positive": {
            const notes = [293.66, 329.63, 392.00, 523.25]; // D4, E4, G4, C5
            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "triangle";
              osc.frequency.setValueAtTime(freq, now + idx * 0.04);

              gain.gain.setValueAtTime(0.0, now + idx * 0.04);
              gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.04 + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + idx * 0.04);
              osc.stop(now + idx * 0.04 + 0.18);
            });
            break;
          }
          case "negative": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.22);

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(450, now);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
            break;
          }
          case "victory": {
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
            let timeAcc = 0;
            notes.forEach((freq) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, now + timeAcc);

              gain.gain.setValueAtTime(0.0, now + timeAcc);
              gain.gain.linearRampToValueAtTime(0.08, now + timeAcc + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, now + timeAcc + 0.25);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + timeAcc);
              osc.stop(now + timeAcc + 0.25);

              timeAcc += 0.07;
            });
            break;
          }
          case "defeat": {
            const notes = [196.00, 185.00, 164.81]; // G3, F#3, E3 sad slides
            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(freq, now + idx * 0.12);
              osc.frequency.linearRampToValueAtTime(freq - 25, now + idx * 0.12 + 0.25);

              const filter = ctx.createBiquadFilter();
              filter.type = "lowpass";
              filter.frequency.setValueAtTime(280, now);

              gain.gain.setValueAtTime(0.06, now + idx * 0.12);
              gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

              osc.connect(filter);
              filter.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + idx * 0.12);
              osc.stop(now + idx * 0.12 + 0.3);
            });
            break;
          }
        }
      } catch (e) {
        console.error("Web Audio error:", e);
      }
    },
    [isMuted, initAudio]
  );

  return { isMuted, toggleMute, playSound };
};
