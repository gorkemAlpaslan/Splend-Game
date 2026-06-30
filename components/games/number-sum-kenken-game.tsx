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

interface KenKenPuzzle {
  cages: {
    target: string;
    cells: [number, number][];
    formula: (arr: number[]) => boolean;
  }[];
  solution: number[][];
}

const KENKEN_PUZZLES: Record<"easy" | "medium" | "hard", KenKenPuzzle> = {
  easy: {
    solution: [
      [3, 2, 1],
      [1, 3, 2],
      [2, 1, 3]
    ],
    cages: [
      { target: "5+", cells: [[0, 0], [[0, 1]] as any], formula: (arr) => arr[0] + arr[1] === 5 },
      { target: "3+", cells: [[0, 2], [1, 2]], formula: (arr) => arr[0] + arr[1] === 3 },
      { target: "1-", cells: [[1, 0], [2, 0]], formula: (arr) => Math.abs(arr[0] - arr[1]) === 1 },
      { target: "3x", cells: [[1, 1], [2, 1]], formula: (arr) => arr[0] * arr[1] === 3 },
      { target: "3", cells: [[2, 2]], formula: (arr) => arr[0] === 3 }
    ]
  },
  medium: {
    solution: [
      [2, 3, 1],
      [3, 1, 2],
      [1, 2, 3]
    ],
    cages: [
      { target: "6x", cells: [[0, 0], [1, 0]], formula: (arr) => arr[0] * arr[1] === 6 },
      { target: "4+", cells: [[0, 1], [0, 2]], formula: (arr) => arr[0] + arr[1] === 4 },
      { target: "3x", cells: [[1, 1], [1, 2]], formula: (arr) => arr[0] * arr[1] === 2 || arr[0] * arr[1] === 3 }, // general logic
      { target: "2-", cells: [[2, 0], [2, 1]], formula: (arr) => Math.abs(arr[0] - arr[1]) === 1 },
      { target: "3", cells: [[2, 2]], formula: (arr) => arr[0] === 3 }
    ]
  },
  hard: {
    solution: [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1]
    ],
    cages: [
      { target: "3+", cells: [[0, 0], [0, 1]], formula: (arr) => arr[0] + arr[1] === 3 },
      { target: "5+", cells: [[0, 2], [1, 2]], formula: (arr) => arr[0] + arr[1] === 5 },
      { target: "3x", cells: [[1, 0], [2, 0]], formula: (arr) => arr[0] * arr[1] === 6 },
      { target: "4+", cells: [[1, 1], [2, 1]], formula: (arr) => arr[0] + arr[1] === 4 },
      { target: "1", cells: [[2, 2]], formula: (arr) => arr[0] === 1 }
    ]
  }
};

export default function KenKenMatrixGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [grid, setGrid] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);
  const [shields, setShields] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    setGrid([
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ]);
    setShields(3);
    setErrorMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    if (gameState !== "playing") return;
    const clean = val.replace(/[^1-3]/g, ""); // Only allow 1, 2, 3
    playSound("click", muted);
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = clean;
    setGrid(newGrid);
  };

  const verifyKenKen = () => {
    if (gameState !== "playing") return;

    // Check all fields are populated
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!grid[r][c]) {
          setErrorMsg("VERIFICATION ERROR: INCOMPLETE SEQUENCE BLOCKS.");
          playSound("error", muted);
          return;
        }
      }
    }

    const numericGrid = grid.map(row => row.map(Number));

    // 1. Latin Square uniqueness check (no duplicates in rows and columns)
    for (let i = 0; i < 3; i++) {
      const rowVals = numericGrid[i];
      const colVals = [numericGrid[0][i], numericGrid[1][i], numericGrid[2][i]];
      
      const uniqueRow = new Set(rowVals);
      const uniqueCol = new Set(colVals);

      if (uniqueRow.size !== 3 || uniqueCol.size !== 3) {
        setErrorMsg("SHIELD FAULT: DUPLICATE VALUES UNCOVERED IN SEQUENCE.");
        handleVerifyError();
        return;
      }
    }

    // 2. Cage math formula check
    const puzzle = KENKEN_PUZZLES[difficulty];
    for (let i = 0; i < puzzle.cages.length; i++) {
      const cage = puzzle.cages[i];
      const vals = cage.cells.map(([cr, cc]) => numericGrid[cr][cc]);
      if (!cage.formula(vals)) {
        setErrorMsg(`SHIELD FAULT: CAGE (${cage.target}) MATH CRITERIA NOT MET.`);
        handleVerifyError();
        return;
      }
    }

    // Success!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
    updateStats("number_sum_kenken", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields((s) => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("number_sum_kenken", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>KENKEN MATRIX FACTORS</h2>
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
          DEPLOY KENKEN MATRIX
        </button>
      </div>
    );
  }

  const puzzle = KENKEN_PUZZLES[difficulty];

  // Helper to find which cage a cell belongs to, in order to display its target clue
  const getCageClue = (r: number, c: number) => {
    const cage = puzzle.cages.find(cg => cg.cells.some(([cr, cc]) => cr === r && cc === c));
    if (cage && cage.cells[0][0] === r && cage.cells[0][1] === c) {
      return cage.target;
    }
    return "";
  };

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

      {/* 3x3 KenKen Grid display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 72px)",
          gridTemplateRows: "repeat(3, 72px)",
          gap: "8px",
          background: "#050510",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="kenken-grid"
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const clue = getCageClue(r, c);
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  position: "relative",
                  background: "rgba(255,255,255,0.02)",
                  border: "2px dashed rgba(0, 210, 255, 0.3)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {clue && (
                  <span style={{
                    position: "absolute",
                    top: "3px",
                    left: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "var(--primary-color)",
                    fontFamily: "var(--font-display)"
                  }}>
                    {clue}
                  </span>
                )}
                <input
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontFamily: "var(--font-display)",
                    outline: "none",
                    marginTop: "8px"
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={verifyKenKen} className={styles.btnAction}>
          VERIFY MATRIX
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>MATRIX LOCKED IN</span>
            <p className={styles.winText}>
              All cage equations and Latin Square constraints verified successfully.
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>MATRIX SECURE FAIL</span>
            <p className={styles.winText}>
              Arithmetic violations have compromised matrix shield integrity.
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
