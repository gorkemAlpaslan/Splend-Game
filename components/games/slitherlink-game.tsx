import React, { useState } from "react";
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

const playSound = (type: "victory" | "click" | "error" | "defeat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "error") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.2);
    } else if (type === "defeat") {
      const notes = [200, 160, 120];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.03, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.03, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

interface SlitherlinkPreset {
  clues: (number | null)[][]; // 3x3 cell clues
  solutionH: boolean[][]; // 4x3 horizontal edges
  solutionV: boolean[][]; // 3x4 vertical edges
}

const PRESETS: Record<"easy" | "medium" | "hard", SlitherlinkPreset> = {
  easy: {
    clues: [
      [2, 2, null],
      [null, 3, null],
      [2, null, 1]
    ],
    // solution forms a simple rectangle of 2x3 blocks
    solutionH: [
      [true, true, false],
      [false, false, false],
      [true, false, true],
      [true, true, true]
    ],
    solutionV: [
      [true, false, true, false],
      [true, false, true, false],
      [true, false, false, true]
    ]
  },
  medium: {
    clues: [
      [3, null, 3],
      [null, 2, null],
      [2, null, 2]
    ],
    solutionH: [
      [true, true, true],
      [false, true, false],
      [true, false, true],
      [true, true, true]
    ],
    solutionV: [
      [true, false, false, true],
      [true, true, true, true],
      [true, false, false, true]
    ]
  },
  hard: {
    clues: [
      [2, 3, 2],
      [3, 1, 3],
      [2, 3, 2]
    ],
    solutionH: [
      [true, true, true],
      [true, false, true],
      [true, false, true],
      [true, true, true]
    ],
    solutionV: [
      [true, false, false, true],
      [true, true, true, true],
      [true, false, false, true]
    ]
  }
};

export default function SlitherlinkLoopGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  
  // 4 rows of 3 horizontal edges
  const [hLines, setHLines] = useState<boolean[][]>([]);
  // 3 rows of 4 vertical edges
  const [vLines, setVLines] = useState<boolean[][]>([]);
  
  const [shields, setShields] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    // 4 rows, 3 columns for horizontal edges
    setHLines(Array(4).fill(null).map(() => Array(3).fill(false)));
    // 3 rows, 4 columns for vertical edges
    setVLines(Array(3).fill(null).map(() => Array(4).fill(false)));
    
    setShields(3);
    setErrorMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const toggleHLine = (r: number, c: number) => {
    if (gameState !== "playing") return;
    playSound("click", muted);
    const nextH = hLines.map((row, idx) => idx === r ? row.map((val, colIdx) => colIdx === c ? !val : val) : [...row]);
    setHLines(nextH);
  };

  const toggleVLine = (r: number, c: number) => {
    if (gameState !== "playing") return;
    playSound("click", muted);
    const nextV = vLines.map((row, idx) => idx === r ? row.map((val, colIdx) => colIdx === c ? !val : val) : [...row]);
    setVLines(nextV);
  };

  const verifyLoop = () => {
    if (gameState !== "playing") return;

    const preset = PRESETS[difficulty];
    
    // Check cell clue matches
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const clue = preset.clues[r][c];
        if (clue !== null) {
          // Count active borders around cell (r, c)
          // Top: hLines[r][c]
          // Bottom: hLines[r+1][c]
          // Left: vLines[r][c]
          // Right: vLines[r][c+1]
          let activeBorders = 0;
          if (hLines[r][c]) activeBorders++;
          if (hLines[r+1][c]) activeBorders++;
          if (vLines[r][c]) activeBorders++;
          if (vLines[r][c+1]) activeBorders++;

          if (activeBorders !== clue) {
            setErrorMsg(`SHIELD FAULT: CLUE AT CELL (${r+1}, ${c+1}) NOT SATISFIED.`);
            handleVerifyError();
            return;
          }
        }
      }
    }

    // Direct checking against target solution shape
    const matchesH = hLines.every((row, r) => row.every((val, c) => val === preset.solutionH[r][c]));
    const matchesV = vLines.every((row, r) => row.every((val, c) => val === preset.solutionV[r][c]));

    if (!matchesH || !matchesV) {
      setErrorMsg("SHIELD FAULT: CONTINUOUS LOOP STRUCTURE IS INCOMPLETE OR FRACTURED.");
      handleVerifyError();
      return;
    }

    // Success!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 25 : difficulty === "medium" ? 45 : 75;
    updateStats("slitherlink", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields((s) => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("slitherlink", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>LOOP COMPLEXITY LEVEL</h2>
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
              {d.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          DEPLOY SLITHERLINK
        </button>
      </div>
    );
  }

  const preset = PRESETS[difficulty];

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Shields: <span style={{ color: "var(--error-color)" }}>{"🛡️".repeat(shields)}</span></div>
        <div>Sector: <span>{difficulty.toUpperCase()}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {errorMsg && (
        <div style={{
          background: "rgba(255, 42, 109, 0.1)",
          border: "1px solid var(--error-color)",
          color: "var(--error-color)",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "11px",
          fontFamily: "var(--font-display)",
          marginBottom: "15px",
          textAlign: "center",
          fontWeight: "bold",
          width: "100%"
        }}>
          {errorMsg}
        </div>
      )}

      {/* Slitherlink Grid design */}
      <div
        style={{
          position: "relative",
          width: "220px",
          height: "220px",
          background: "#050510",
          borderRadius: "8px",
          border: "1px solid var(--glass-border)",
          padding: "10px",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="slitherlink-board"
      >
        {/* Draw Clue Numbers inside cell gaps */}
        {preset.clues.map((row, r) =>
          row.map((val, c) => {
            if (val === null) return null;
            return (
              <div
                key={`clue-${r}-${c}`}
                style={{
                  position: "absolute",
                  left: `${25 + c * 60 + 15}px`,
                  top: `${25 + r * 60 + 15}px`,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "var(--font-display)",
                  pointerEvents: "none"
                }}
              >
                {val}
              </div>
            );
          })
        )}

        {/* Draw Dots matrix: 4x4 dots */}
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 4 }).map((__, c) => (
            <div
              key={`dot-${r}-${c}`}
              style={{
                position: "absolute",
                left: `${25 + c * 60}px`,
                top: `${25 + r * 60}px`,
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 0 5px rgba(255,255,255,0.8)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 10
              }}
            />
          ))
        )}

        {/* Toggleable Horizontal Segment Lines */}
        {hLines.map((row, r) =>
          row.map((val, c) => (
            <button
              key={`hline-${r}-${c}`}
              onClick={() => toggleHLine(r, c)}
              style={{
                position: "absolute",
                left: `${25 + c * 60 + 6}px`,
                top: `${25 + r * 60}px`,
                width: "48px",
                height: "10px",
                transform: "translateY(-50%)",
                background: val ? "var(--primary-color)" : "rgba(255,255,255,0.02)",
                border: "none",
                borderRadius: "2px",
                boxShadow: val ? "0 0 8px var(--primary-glow)" : "",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.15s ease",
                zIndex: 5
              }}
            />
          ))
        )}

        {/* Toggleable Vertical Segment Lines */}
        {vLines.map((row, r) =>
          row.map((val, c) => (
            <button
              key={`vline-${r}-${c}`}
              onClick={() => toggleVLine(r, c)}
              style={{
                position: "absolute",
                left: `${25 + c * 60}px`,
                top: `${25 + r * 60 + 6}px`,
                width: "10px",
                height: "48px",
                transform: "translateX(-50%)",
                background: val ? "var(--primary-color)" : "rgba(255,255,255,0.02)",
                border: "none",
                borderRadius: "2px",
                boxShadow: val ? "0 0 8px var(--primary-glow)" : "",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.15s ease",
                zIndex: 5
              }}
            />
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={verifyLoop} className={styles.btnAction}>
          VERIFY LOOP
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>LOOP COMPLETED</span>
            <p className={styles.winText}>
              All clues matched and loop path connected correctly. Database integrity confirmed.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Sector
            </Link>
          </div>
        </div>
      )}

      {gameState === "defeat" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal} style={{ borderColor: "var(--error-color)", boxShadow: "0 0 25px var(--error-glow)" }}>
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>LOOP FRACTURED</span>
            <p className={styles.winText}>
              Loop validation checks failed. Database lockdown sequence triggered.
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
