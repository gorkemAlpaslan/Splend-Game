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

type ItemState = "empty" | "tent" | "tree";

interface TentPreset {
  trees: [number, number][];
  rowTargets: number[];
  colTargets: number[];
  solution: [number, number][]; // coordinates of correct tents
}

const PRESETS: Record<"easy" | "medium" | "hard", TentPreset> = {
  easy: {
    rowTargets: [1, 1, 1, 1, 1],
    colTargets: [1, 1, 1, 1, 1],
    trees: [
      [0, 1], [1, 3], [2, 3], [3, 0], [4, 2]
    ],
    solution: [
      [0, 0], [1, 2], [2, 4], [3, 1], [4, 3]
    ]
  },
  medium: {
    rowTargets: [2, 0, 1, 1, 1],
    colTargets: [1, 1, 1, 1, 1],
    trees: [
      [0, 1], [0, 3], [2, 3], [3, 0], [4, 2]
    ],
    solution: [
      [0, 0], [0, 2], [2, 4], [3, 1], [4, 3]
    ]
  },
  hard: {
    rowTargets: [2, 1, 0, 1, 1],
    colTargets: [1, 1, 1, 1, 1],
    trees: [
      [0, 1], [0, 3], [1, 2], [3, 0], [4, 4]
    ],
    solution: [
      [0, 0], [0, 4], [1, 2], [3, 1], [4, 3]
    ]
  }
};

export default function TentPlacementGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  
  // 5x5 board state: "empty" or "tent"
  const [userTents, setUserTents] = useState<boolean[][]>(
    Array(5).fill(null).map(() => Array(5).fill(false))
  );

  const [shields, setShields] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    setUserTents(Array(5).fill(null).map(() => Array(5).fill(false)));
    setShields(3);
    setErrorMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    // Tree cells cannot hold tents
    const preset = PRESETS[difficulty];
    const isTree = preset.trees.some(([tr, tc]) => tr === r && tc === c);
    if (isTree) return;

    playSound("click", muted);
    const nextTents = userTents.map((row, rIdx) =>
      rIdx === r ? row.map((val, cIdx) => cIdx === c ? !val : val) : [...row]
    );
    setUserTents(nextTents);
  };

  const verifyPlacements = () => {
    if (gameState !== "playing") return;

    const preset = PRESETS[difficulty];

    // Check matching counts and coordinate solutions directly
    let matches = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isSolutionTent = preset.solution.some(([sr, sc]) => sr === r && sc === c);
        const hasTent = userTents[r][c];
        if (isSolutionTent !== hasTent) {
          matches = false;
          break;
        }
      }
      if (!matches) break;
    }

    if (!matches) {
      setErrorMsg("SHIELD FAULT: TENTS COUNT MISMATCH OR DIRECT CONTACT VIOLATIONS.");
      handleVerifyError();
      return;
    }

    // Success!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 70;
    updateStats("tent_placement", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields((s) => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("tent_placement", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>TREE QUANTUM DENSITY</h2>
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
          DEPLOY TENTS
        </button>
      </div>
    );
  }

  const preset = PRESETS[difficulty];

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Shields: <span style={{ color: "var(--error-color)" }}>{"🛡️".repeat(shields)}</span></div>
        <div>Difficulty: <span>{difficulty.toUpperCase()}</span></div>
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

      {/* Grid containing row clues on right and col clues on bottom */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#050510", padding: "15px", borderRadius: "10px", border: "1px solid var(--glass-border)", width: "300px" }}>
        {Array.from({ length: 5 }).map((_, r) => (
          <div key={r} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {Array.from({ length: 5 }).map((__, c) => {
              const isTree = preset.trees.some(([tr, tc]) => tr === r && tc === c);
              const isTent = userTents[r][c];

              let bg = "rgba(255,255,255,0.01)";
              let border = "1px solid rgba(255,255,255,0.04)";
              let content = "";
              let borderGlow = "";

              if (isTree) {
                content = "🌲";
                bg = "rgba(0, 230, 118, 0.05)";
                border = "1px solid rgba(0, 230, 118, 0.15)";
              } else if (isTent) {
                content = "⛺";
                bg = "rgba(255, 145, 0, 0.15)";
                border = "1px solid var(--warning-color)";
                borderGlow = "0 0 5px var(--warning-glow)";
              }

              return (
                <button
                  key={c}
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    width: "36px",
                    height: "36px",
                    background: bg,
                    border: border,
                    boxShadow: borderGlow,
                    borderRadius: "4px",
                    cursor: isTree ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    transition: "all 0.15s ease"
                  }}
                >
                  {content}
                </button>
              );
            })}
            {/* Row target indicator */}
            <span style={{
              width: "25px",
              textAlign: "center",
              fontSize: "13px",
              fontWeight: "bold",
              color: "var(--primary-color)",
              fontFamily: "var(--font-display)"
            }}>
              {preset.rowTargets[r]}
            </span>
          </div>
        ))}
        {/* Column target indicators row */}
        <div style={{ display: "flex", gap: "6px", paddingLeft: "0", marginTop: "4px" }}>
          {Array.from({ length: 5 }).map((_, c) => (
            <span
              key={c}
              style={{
                width: "36px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "bold",
                color: "var(--primary-color)",
                fontFamily: "var(--font-display)"
              }}
            >
              {preset.colTargets[c]}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={verifyPlacements} className={styles.btnAction}>
          VERIFY PLACEMENTS
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>TENTS PLACED SECURELY</span>
            <p className={styles.winText}>
              All trees have matching non-adjacent tents. Row and column metrics satisfied.
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>SECTOR OVERFLOW</span>
            <p className={styles.winText}>
              Tent coordinate check failed too many times. Core database locked down.
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
