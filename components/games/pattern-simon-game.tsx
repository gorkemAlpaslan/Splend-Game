import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/PuzzleHub.module.sass";

let audioCtx: AudioContext | null = null;
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSimonSound = (idx: number, muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const freqs = [329.63, 261.63, 220.00, 164.81]; // E4, C4, A3, E3
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freqs[idx] || 220, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.3);
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const playSpecialSound = (type: "victory" | "defeat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    if (type === "victory") {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.03, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === "defeat") {
      const notes = [180, 150, 120];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.03, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const SIMON_COLORS = [
  "#ff2a6d", // Red (0)
  "#00d2ff", // Cyan (1)
  "#00e676", // Green (2)
  "#ffd54f"  // Yellow (3)
];

export default function PatternSimonGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeFlashIdx, setActiveFlashIdx] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>("Click Start");
  const [muted, setMuted] = useState<boolean>(false);

  const getTargetLength = () => {
    return difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 11;
  };

  const startNewGame = () => {
    setSequence([Math.floor(Math.random() * 4)]);
    setUserSequence([]);
    setStatusText("SCANNING SIGNALS...");
    setGameState("playing");
    setGameSolved(false);
  };

  const [gameSolved, setGameSolved] = useState<boolean>(false);

  // Sequence playback trigger loop
  useEffect(() => {
    if (gameState !== "playing" || sequence.length === 0) return;

    setStatusText("SCANNING SIGNALS...");
    let idx = 0;
    const interval = setInterval(() => {
      const activeVal = sequence[idx];
      setActiveFlashIdx(activeVal);
      playSimonSound(activeVal, muted);
      
      setTimeout(() => {
        setActiveFlashIdx(null);
      }, 400);

      idx++;
      if (idx >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          setStatusText("YOUR TURN: REPLICATE PATTERN");
        }, 500);
      }
    }, 850);

    return () => clearInterval(interval);
  }, [sequence, gameState, muted]);

  const handlePadClick = (padIdx: number) => {
    if (gameState !== "playing" || statusText !== "YOUR TURN: REPLICATE PATTERN") return;

    // Flash local clicked panel
    setActiveFlashIdx(padIdx);
    playSimonSound(padIdx, muted);
    setTimeout(() => setActiveFlashIdx(null), 200);

    const nextUserSeq = [...userSequence, padIdx];
    setUserSequence(nextUserSeq);

    // Verify last clicked item matching sequence
    const currentStepIndex = nextUserSeq.length - 1;
    if (nextUserSeq[currentStepIndex] !== sequence[currentStepIndex]) {
      setGameState("defeat");
      playSpecialSound("defeat", muted);
      updateStats("pattern_simon", 0, false);
      return;
    }

    // Sequence completed successfully
    if (nextUserSeq.length === sequence.length) {
      const targetLength = getTargetLength();
      if (sequence.length >= targetLength) {
        setGameState("victory");
        playSpecialSound("victory", muted);
        const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 70;
        updateStats("pattern_simon", pointsReward, true);
      } else {
        setStatusText("CORRECT! PREPARING NEXT SIGNAL...");
        setTimeout(() => {
          setSequence([...sequence, Math.floor(Math.random() * 4)]);
          setUserSequence([]);
        }, 1000);
      }
    }
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>SIGNAL DECRYPTION TARGET</h2>
        <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={styles.btnAction}
              style={{
                background: difficulty === d ? "var(--primary-color)" : "rgba(255,255,255,0.05)",
                color: difficulty === d ? "#030308" : "#ffffff",
                border: "1px solid var(--primary-color)"
              }}
            >
              {d === "easy" ? "5 STEPS" : d === "medium" ? "8 STEPS" : "11 STEPS"}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          DEPLOY CONSOLE
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Progress: <span>{sequence.length} / {getTargetLength()}</span></div>
        <div>Sector: <span>{difficulty.toUpperCase()}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      <div style={{ margin: "10px 0", height: "20px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "bold", fontFamily: "var(--font-display)" }}>
        {statusText}
      </div>

      {/* Simon Pad Grid */}
      <div className={styles.simonGrid} id="simon-grid">
        {SIMON_COLORS.map((color, idx) => {
          const isFlashed = activeFlashIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => handlePadClick(idx)}
              className={`${styles.simonCell} ${isFlashed ? styles.simonActive : ""}`}
              style={{
                background: isFlashed ? color : `${color}1A`,
                borderColor: color,
                color: color,
                width: "90px",
                height: "90px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isFlashed ? `0 0 20px ${color}` : ""
              }}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Console
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>SIGNAL EXTRACTED</span>
            <p className={styles.winText}>
              All signal frequencies successfully mirrored. Compiler integrity verified.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Database
            </Link>
          </div>
        </div>
      )}

      {gameState === "defeat" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal} style={{ borderColor: "var(--error-color)", boxShadow: "0 0 25px var(--error-glow)" }}>
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>DECRYPTION FAIL</span>
            <p className={styles.winText}>
              Incorrect pattern sequence triggered node lockdown.
            </p>
            <button onClick={startNewGame} className={styles.btnAction} style={{ background: "var(--error-color)", color: "#000" }}>
              Re-Deploy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
