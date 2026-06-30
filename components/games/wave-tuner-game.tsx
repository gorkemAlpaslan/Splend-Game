import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./wave-tuner-style.module.sass";

// Web Audio API oscillators for matching pitch feedback
let audioCtx: AudioContext | null = null;
let humOsc: OscillatorNode | null = null;
let humGain: GainNode | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (type: "victory" | "defeat" | "click", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "victory") {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === "defeat") {
      const notes = [220, 180, 140];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.3);
      });
    }
  } catch (e) {
    console.error("Synthesizer sound playback failed:", e);
  }
};

const startHum = (freqVal: number, muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    if (!humOsc) {
      humOsc = audioCtx.createOscillator();
      humGain = audioCtx.createGain();
      humOsc.type = "sine";
      humOsc.frequency.setValueAtTime(200 + freqVal * 300, audioCtx.currentTime);
      humGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      humOsc.connect(humGain);
      humGain.connect(audioCtx.destination);
      humOsc.start();
    } else {
      humOsc.frequency.setValueAtTime(200 + freqVal * 300, audioCtx.currentTime);
    }
  } catch (e) {
    console.error("Start hum failed:", e);
  }
};

const stopHum = () => {
  try {
    if (humOsc) {
      humOsc.stop();
      humOsc.disconnect();
      humOsc = null;
    }
    if (humGain) {
      humGain.disconnect();
      humGain = null;
    }
  } catch (e) {
    console.error("Stop hum failed:", e);
  }
};

export default function WaveTunerGame() {
  const { stats, updateStats } = useAuth();
  const gameStats = stats.games.wave_tuner || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup options
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");

  // Player controls
  const [amplitude, setAmplitude] = useState<number>(30); // 10 to 90
  const [frequency, setFrequency] = useState<number>(0.02); // 0.005 to 0.08
  const [phase, setPhase] = useState<number>(0); // 0 to 6.28

  // Target values
  const [targetAmp, setTargetAmp] = useState<number>(50);
  const [targetFreq, setTargetFreq] = useState<number>(0.04);
  const [targetPhase, setTargetPhase] = useState<number>(3.14);

  // Stats
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [pointsWon, setPointsWon] = useState<number>(0);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);
  const [matchPercentage, setMatchPercentage] = useState<number>(0);

  const requestRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeOffsetRef = useRef<number>(0);

  // Apply setups
  const handleDifficultySelection = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    if (diff === "easy") setScoreMultiplier(1.0);
    else if (diff === "medium") setScoreMultiplier(1.5);
    else setScoreMultiplier(2.0);
  };

  const startMission = () => {
    initAudio();
    setGameState("playing");
    setPointsWon(0);
    setAmplitude(30);
    setFrequency(0.02);
    setPhase(0);
    timeOffsetRef.current = 0;

    // Dynamic target creation
    const randAmp = Math.floor(Math.random() * 50) + 30; // 30 to 80
    const randFreq = parseFloat((Math.random() * 0.04 + 0.015).toFixed(4)); // 0.015 to 0.055
    const randPhase = parseFloat((Math.random() * 5 + 0.5).toFixed(2)); // 0.5 to 5.5
    setTargetAmp(randAmp);
    setTargetFreq(randFreq);
    setTargetPhase(randPhase);

    const limitSec = difficulty === "easy" ? 60 : difficulty === "medium" ? 45 : 30;
    setTimeLeft(limitSec);

    // Timer logic
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleGameFailure();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGameFailure = () => {
    setGameState("defeat");
    stopHum();
    playSynthSound("defeat", muted);
    updateStats("wave_tuner", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  const handleAbandon = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleGameFailure();
  };

  // Oscilloscope Animation & Matching
  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      timeOffsetRef.current += 1.5;
      const currentOffset = timeOffsetRef.current;

      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw grid background (cyber grids)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      // Verticals
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontals
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw horizontal center baseline
      ctx.strokeStyle = "rgba(0, 210, 255, 0.2)";
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // 3. Draw Target Wave (Neon Green)
      ctx.strokeStyle = "rgba(0, 230, 118, 0.6)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(0, 230, 118, 0.5)";
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        // scroll wave with currentOffset
        const y = centerY + targetAmp * Math.sin((x + currentOffset) * targetFreq + targetPhase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 4. Draw Player Wave (Neon Blue)
      ctx.strokeStyle = "rgba(0, 210, 255, 0.85)";
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "var(--primary-glow)";
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = centerY + amplitude * Math.sin((x + currentOffset) * frequency + phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reset shadows
      ctx.shadowBlur = 0;

      // 5. Calculate Root-Mean-Square (RMS) alignment difference
      let diffAccumulator = 0;
      const step = 8;
      let checkCount = 0;
      for (let x = 0; x < width; x += step) {
        const targetVal = targetAmp * Math.sin((x + currentOffset) * targetFreq + targetPhase);
        const playerVal = amplitude * Math.sin((x + currentOffset) * frequency + phase);
        diffAccumulator += Math.pow(targetVal - playerVal, 2);
        checkCount++;
      }
      const rmsDiff = Math.sqrt(diffAccumulator / checkCount);

      // Map difference to a matching percentage
      // RMS difference < 5.0 is practically identical
      const matchPct = Math.max(0, Math.min(100, Math.round(100 - (rmsDiff * 1.5))));
      setMatchPercentage(matchPct);

      // Play audio feedback: modulate hum based on frequency alignment
      const alignDev = Math.abs(frequency - targetFreq) / targetFreq;
      startHum(1 - Math.min(1, alignDev), muted);

      // Win Condition Check
      const threshold = difficulty === "easy" ? 90 : difficulty === "medium" ? 93 : 96;
      if (matchPct >= threshold) {
        if (timerRef.current) clearInterval(timerRef.current);
        stopHum();
        setGameState("victory");
        playSynthSound("victory", muted);

        // Score balancing: easy = 1, medium = 2, hard = 3 points
        const basePoints = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
        const totalPoints = Math.round(basePoints * scoreMultiplier);
        setPointsWon(totalPoints);
        updateStats("wave_tuner", totalPoints, true);
        window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
      } else {
        requestRef.current = requestAnimationFrame(render);
      }
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, amplitude, frequency, phase, targetAmp, targetFreq, targetPhase, difficulty, muted]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      stopHum();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSliderChange = (type: "amp" | "freq" | "phase", val: number) => {
    if (type === "amp") setAmplitude(val);
    else if (type === "freq") setFrequency(val);
    else setPhase(val);
  };

  return (
    <div className={styles.playArea} id="wt-play-area">
      {/* Scope visual window */}
      <div className={styles.gameGridWrapper} id="wt-grid-wrapper">
        {gameState === "lobby" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="var(--primary-color)" style={{ filter: "drop-shadow(0 0 15px var(--primary-glow))" }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 13h-2v-2h2v2zm0-4h-2V7h2v4z" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--primary-color)", margin: 0 }}>FREQUENCY MODULATOR</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", maxWidth: "450px", margin: 0 }}>
              Adjust Amplitude (gain), Frequency (wavelength), and Phase (offset) sliders. Superimpose the blue signal directly over the green target encryption wave before memory singularity collapses.
            </p>
          </div>
        ) : (
          <canvas ref={canvasRef} className={styles.canvas} id="wt-wave-canvas" />
        )}
      </div>

      {/* Control console */}
      <div className={styles.sidebar} id="wt-sidebar">
        {/* Game Stats */}
        <div className={styles.gameStatsGroup}>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gameStats.score}</div>
            <div className={styles.lbl}>Total Points</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gameStats.highScore}</div>
            <div className={styles.lbl}>Best Streak</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gameStats.losses}</div>
            <div className={styles.lbl}>Losses</div>
          </div>
        </div>

        {gameState === "lobby" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>TUNING SYSTEM CONFIG</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>TUNING DIFFICULTY</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("easy")}>EASY</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("medium")}>MEDIUM</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("hard")}>HARD</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Singularity Timeout</span>
                <span className={styles.val}>{difficulty === "easy" ? "60s" : difficulty === "medium" ? "45s" : "30s"}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Match Accuracy Goal</span>
                <span className={styles.val}>{difficulty === "easy" ? "90%" : difficulty === "medium" ? "93%" : "96%"}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Sync Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={muted} onChange={() => setMuted(!muted)} />
                  Mute Synthesizer audio
                </label>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Tether Oscilloscope
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>DECRYPTING WAVEFORM</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Singularity Timeout</span>
                <span className={styles.val} style={{ color: timeLeft < 10 ? "var(--error-color)" : "#fff" }}>
                  {timeLeft} Seconds
                </span>
              </div>

              <div className={styles.statRow}>
                <span className={styles.label}>Signal Coincidence</span>
                <span className={styles.val} style={{ color: matchPercentage > 80 ? "var(--success-color)" : "#fff" }}>
                  {matchPercentage}%
                </span>
              </div>

              {/* SLIDERS PANEL */}
              <div className={styles.sliderGroup}>
                <div className={styles.sliderContainer}>
                  <label>
                    AMPLITUDE (Gain) <span>{amplitude} db</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={amplitude}
                    onChange={(e) => handleSliderChange("amp", parseInt(e.target.value))}
                  />
                </div>

                <div className={styles.sliderContainer}>
                  <label>
                    FREQUENCY (Hertz) <span>{(frequency * 1000).toFixed(0)} Hz</span>
                  </label>
                  <input
                    type="range"
                    min="0.005"
                    max="0.08"
                    step="0.0005"
                    value={frequency}
                    onChange={(e) => handleSliderChange("freq", parseFloat(e.target.value))}
                  />
                </div>

                <div className={styles.sliderContainer}>
                  <label>
                    PHASE (Offset) <span>{Math.round((phase / Math.PI) * 180)}°</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="6.28"
                    step="0.02"
                    value={phase}
                    onChange={(e) => handleSliderChange("phase", parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <button className={styles.abandonBtn} onClick={handleAbandon} style={{ marginTop: "15px" }}>
                Disconnect Scope
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>TUNER MATCH SUCCESS</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Oscilloscope resonance matching success. Decrypted sequence loaded to mainframe.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Profile</span>
                <span className={styles.val} style={{ textTransform: "uppercase" }}>{difficulty}</span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Points Transferred</span>
                <span className={styles.val} style={{ color: "var(--success-color)", fontSize: "18px" }}>+{pointsWon}</span>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "15px" }}>
                Match Next Channel
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>COHERENCE RESET</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Timeout. Wave signal collapsed and scrambled. Win streak has reset.
              </p>
              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Re-Tether Scope
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Return to Config
              </button>
            </div>
          </div>
        )}

        {/* Global Exit */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <Link href="/" className={styles.backBtn} style={{ flex: 1, justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: "4px" }}>
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            Lobby Sector
          </Link>
          <Link href="/leaderboard" className={styles.backBtn} style={{ flex: 1, justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: "4px" }}>
              <path d="M7.5 13.5h-3v7.5h3v-7.5zm6-6h-3v13.5h3V7.5zm6 9h-3v4.5h3v-4.5z" />
            </svg>
            High Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}
