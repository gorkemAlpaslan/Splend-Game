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
      gain.gain.setValueAtTime(0.02, now);
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
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.04, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    } else if (type === "victory") {
      const notes = [293.66, 329.63, 392.00, 440.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.07 + 0.02);
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

// Procedural pre-solved hitori boards: board grid numbers + solution indices to shade
const HITORI_PUZZLES = [
  {
    // Easy Board
    numbers: [
      [2, 2, 1, 5, 3],
      [2, 3, 4, 1, 5],
      [5, 4, 3, 2, 1],
      [1, 2, 5, 3, 4],
      [3, 1, 2, 4, 4]
    ],
    shadeCoords: ["0,0", "0,3", "3,1", "4,4"]
  },
  {
    // Medium Board
    numbers: [
      [1, 2, 3, 4, 2],
      [4, 1, 2, 5, 3],
      [2, 3, 5, 1, 4],
      [5, 4, 1, 3, 2],
      [3, 5, 4, 2, 1]
    ],
    shadeCoords: ["0,4", "1,1", "3,4", "4,1"]
  },
  {
    // Hard Board
    numbers: [
      [3, 4, 1, 5, 2],
      [1, 2, 5, 3, 4],
      [5, 3, 4, 2, 1],
      [2, 5, 3, 4, 5],
      [4, 1, 2, 5, 3]
    ],
    shadeCoords: ["3,1", "3,4", "1,2", "4,3"]
  }
];

export default function BinaryMatrixHitoriGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [grid, setGrid] = useState<number[][]>([]);
  const [shaded, setShaded] = useState<string[]>([]); // Array of 'row,col' strings representing shaded blocks
  const [shields, setShields] = useState<number>(3);
  const [alertMsg, setAlertMsg] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    const idx = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2;
    const puz = HITORI_PUZZLES[idx];
    setGrid(puz.numbers);
    setShaded([]);
    setShields(3);
    setAlertMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    const coord = `${r},${c}`;
    playSound("click", muted);
    if (shaded.includes(coord)) {
      setShaded(shaded.filter(s => s !== coord));
    } else {
      setShaded([...shaded, coord]);
    }
  };

  // Helper DFS to verify unshaded cells are fully connected
  const verifyConnectivity = (tempShaded: string[]): boolean => {
    const visited = Array(5).fill(null).map(() => Array(5).fill(false));
    let startR = -1;
    let startC = -1;

    // Find first unshaded cell
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!tempShaded.includes(`${r},${c}`)) {
          startR = r;
          startC = c;
          break;
        }
      }
      if (startR !== -1) break;
    }

    if (startR === -1) return false;

    // DFS count
    let count = 0;
    const stack: [number, number][] = [[startR, startC]];
    visited[startR][startC] = true;

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      count++;

      const neighbors = [
        [r-1, c], [r+1, c], [r, c-1], [r, c+1]
      ];

      neighbors.forEach(([nr, nc]) => {
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
          if (!visited[nr][nc] && !tempShaded.includes(`${nr},${nc}`)) {
            visited[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      });
    }

    // Compare connected count with total unshaded count
    const totalUnshaded = 25 - tempShaded.length;
    return count === totalUnshaded;
  };

  const verifyMatrix = () => {
    if (gameState !== "playing") return;

    // 1. Shaded cells adjacency check (no horizontal/vertical adjacents shaded)
    for (let i = 0; i < shaded.length; i++) {
      const [r, c] = shaded[i].split(",").map(Number);
      const adjacents = [
        `${r+1},${c}`, `${r-1},${c}`, `${r},${c+1}`, `${r},${c-1}`
      ];
      const hasAdjacentShaded = adjacents.some(adj => shaded.includes(adj));
      if (hasAdjacentShaded) {
        setAlertMsg("SHIELD FAULT: DIRECTLY ADJACENT SHADED SECTORS LOCATED.");
        handleVerifyError();
        return;
      }
    }

    // 2. Unshaded duplicate check in rows & columns
    for (let r = 0; r < 5; r++) {
      const rowVals: number[] = [];
      for (let c = 0; c < 5; c++) {
        if (!shaded.includes(`${r},${c}`)) {
          rowVals.push(grid[r][c]);
        }
      }
      const uniqueRows = new Set(rowVals);
      if (uniqueRows.size !== rowVals.length) {
        setAlertMsg("SHIELD FAULT: DUPLICATE VALUES UNCOVERED IN HORIZONTAL SEQUENCE.");
        handleVerifyError();
        return;
      }
    }

    for (let c = 0; c < 5; c++) {
      const colVals: number[] = [];
      for (let r = 0; r < 5; r++) {
        if (!shaded.includes(`${r},${c}`)) {
          colVals.push(grid[r][c]);
        }
      }
      const uniqueCols = new Set(colVals);
      if (uniqueCols.size !== colVals.length) {
        setAlertMsg("SHIELD FAULT: DUPLICATE VALUES UNCOVERED IN VERTICAL SEQUENCE.");
        handleVerifyError();
        return;
      }
    }

    // 3. Connectivity check
    if (!verifyConnectivity(shaded)) {
      setAlertMsg("SHIELD FAULT: UNSHADED CORES SEPARATED (ISLAND ERROR).");
      handleVerifyError();
      return;
    }

    // All rules matched! Victory!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
    updateStats("binary_matrix_hitori", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields(s => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("binary_matrix_hitori", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>HITORI MATRIX DIFFICULTY</h2>
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
          DEPLOY BINARY HITORI
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Shields: <span style={{ color: "var(--error-color)" }}>{"🛡️".repeat(shields)}</span></div>
        <div>Sector: <span>{difficulty.toUpperCase()}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {alertMsg && (
        <div style={{
          background: "rgba(255, 42, 109, 0.1)",
          border: "1px solid var(--error-color)",
          color: "var(--error-color)",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "11px",
          textAlign: "center",
          fontWeight: "bold",
          fontFamily: "var(--font-display)",
          marginBottom: "15px",
          width: "100%",
          maxWidth: "300px"
        }}>
          {alertMsg}
        </div>
      )}

      {/* Grid rendering */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 48px)",
          gridTemplateRows: "repeat(5, 48px)",
          gap: "6px",
          background: "#060610",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="hitori-grid"
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const coord = `${r},${c}`;
            const isShaded = shaded.includes(coord);
            return (
              <button
                key={coord}
                onClick={() => handleCellClick(r, c)}
                style={{
                  background: isShaded ? "var(--error-color)" : "rgba(255,255,255,0.03)",
                  border: isShaded ? "1px solid #ffffff" : "1px solid var(--glass-border)",
                  color: isShaded ? "#000000" : "#ffffff",
                  boxShadow: isShaded ? "0 0 8px var(--error-glow)" : "",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  fontWeight: "bold",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
              >
                {val}
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={verifyMatrix} className={styles.btnAction}>
          VERIFY MATRIX
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>HITORI OVERRIDDEN</span>
            <p className={styles.winText}>
              Grid coordinates resolved successfully. Shading parameters matched compiler expectations.
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>MATRIX SHIELDS COLLAPSED</span>
            <p className={styles.winText}>
              Too many rule violations compiled on check verification. Matrix overloaded.
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
