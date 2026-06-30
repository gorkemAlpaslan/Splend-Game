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

type CellState = "island" | "water";

interface NurikabePreset {
  clues: (number | null)[][]; // 5x5 grid clues
  solution: CellState[][]; // 5x5 solved state
}

const PRESETS: Record<"easy" | "medium" | "hard", NurikabePreset> = {
  easy: {
    clues: [
      [2, null, null, null, null],
      [null, null, 1, null, null],
      [null, null, null, null, null],
      [null, null, null, null, 2],
      [null, null, null, null, null]
    ],
    // Solution layout: Islands are (0,0)+(0,1), (1,2), and (3,4)+(4,4)
    solution: [
      ["island", "island", "water", "water", "water"],
      ["water", "water", "island", "water", "water"],
      ["water", "water", "water", "water", "water"],
      ["water", "water", "water", "water", "island"],
      ["water", "water", "water", "water", "island"]
    ]
  },
  medium: {
    clues: [
      [1, null, null, null, 3],
      [null, null, null, null, null],
      [null, null, 2, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ],
    solution: [
      ["island", "water", "water", "island", "island"],
      ["water", "water", "water", "water", "island"],
      ["water", "island", "island", "water", "water"],
      ["water", "water", "water", "water", "water"],
      ["water", "water", "water", "water", "water"]
    ]
  },
  hard: {
    clues: [
      [2, null, 2, null, null],
      [null, null, null, null, null],
      [null, null, null, null, 3],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ],
    solution: [
      ["island", "island", "island", "island", "water"],
      ["water", "water", "water", "water", "water"],
      ["water", "water", "island", "island", "island"],
      ["water", "water", "water", "water", "water"],
      ["water", "water", "water", "water", "water"]
    ]
  }
};

export default function NurikabeIslandsGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  
  // 5x5 play board
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [shields, setShields] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    // Initialise all grid cells to "island" unshaded by default
    setGrid(Array(5).fill(null).map(() => Array(5).fill("island")));
    setShields(3);
    setErrorMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;
    
    // Clue cells are fixed to "island" state
    const preset = PRESETS[difficulty];
    if (preset.clues[r][c] !== null) return;

    playSound("click", muted);
    const newGrid = grid.map(row => [...row]);
    
    // Toggle state: island -> water -> island
    newGrid[r][c] = grid[r][c] === "island" ? "water" : "island";
    setGrid(newGrid);
  };

  const verifyNurikabe = () => {
    if (gameState !== "playing") return;

    const preset = PRESETS[difficulty];
    
    // Directly check against solved Nurikabe preset coordinate maps
    let matches = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] !== preset.solution[r][c]) {
          matches = false;
          break;
        }
      }
      if (!matches) break;
    }

    if (!matches) {
      setErrorMsg("SHIELD FAULT: STREAM PATH IS ISOLATED OR CAGE CORES VIOLATE CAPACITY.");
      handleVerifyError();
      return;
    }

    // Success!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 70;
    updateStats("nurikabe", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields((s) => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("nurikabe", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>ISLAND CLUES DIFFICULTY</h2>
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
          DEPLOY NURIKABE
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

      {/* Grid display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 48px)",
          gridTemplateRows: "repeat(5, 48px)",
          gap: "6px",
          background: "#050510",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="nurikabe-grid"
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const clue = preset.clues[r][c];
            const isWater = val === "water";

            let bg = "rgba(255, 255, 255, 0.02)";
            let border = "1px solid rgba(255,255,255,0.05)";
            let color = "#ffffff";
            let cellGlow = "";

            if (clue !== null) {
              bg = "rgba(0, 210, 255, 0.1)";
              border = "1px solid var(--primary-color)";
              cellGlow = "0 0 5px var(--primary-glow)";
            } else if (isWater) {
              bg = "#000000";
              border = "1px solid rgba(255, 255, 255, 0.2)";
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  background: bg,
                  border: border,
                  color: color,
                  boxShadow: cellGlow,
                  borderRadius: "4px",
                  cursor: clue !== null ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontFamily: "var(--font-display)",
                  fontWeight: "bold",
                  transition: "all 0.15s ease"
                }}
              >
                {clue !== null ? String(clue) : isWater ? "🌊" : ""}
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={verifyNurikabe} className={styles.btnAction}>
          VERIFY SECTORS
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>ISLAND INTEGRITY SECURED</span>
            <p className={styles.winText}>
              All unshaded island sizes and shaded water stream paths compiled successfully.
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>SECTOR BLOCKOVERFLOW</span>
            <p className={styles.winText}>
              Verification check failed too many times. Core database locked down.
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
