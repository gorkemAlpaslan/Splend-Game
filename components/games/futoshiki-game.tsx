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

interface FutoshikiPreset {
  // Constraints horizontal: (r, c) < (r, c+1) or >
  // Represented as 'row,col' pointing to direction e.g. "0,0": "<" means cell(0,0) < cell(0,1)
  hConstraints: Record<string, "<" | ">">;
  // Constraints vertical: 'row,col' pointing down e.g. "0,0": "^" means cell(0,0) < cell(1,0), "v" means >
  vConstraints: Record<string, "^" | "v">;
  solution: number[][];
}

const PRESETS: Record<"easy" | "medium" | "hard", FutoshikiPreset> = {
  easy: {
    solution: [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1]
    ],
    hConstraints: {
      "0,0": "<" // 1 < 2
    },
    vConstraints: {
      "0,1": "^" // 2 < 3
    }
  },
  medium: {
    solution: [
      [2, 3, 1],
      [3, 1, 2],
      [1, 2, 3]
    ],
    hConstraints: {
      "0,0": "<", // 2 < 3
      "2,1": "<"  // 2 < 3
    },
    vConstraints: {
      "1,1": "v"  // 1 < 2
    }
  },
  hard: {
    solution: [
      [3, 1, 2],
      [1, 2, 3],
      [2, 3, 1]
    ],
    hConstraints: {
      "0,0": ">", // 3 > 1
      "1,1": "<"  // 2 < 3
    },
    vConstraints: {
      "0,2": "v"  // 2 < 3
    }
  }
};

export default function FutoshikiInequalityGame() {
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
    // Scramble / clear grid, pre-populate 1 seed block to help user
    const preset = PRESETS[difficulty];
    const initial = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ];
    // Place first cell of solution as helper
    initial[0][0] = String(preset.solution[0][0]);
    setGrid(initial);
    setShields(3);
    setErrorMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    if (gameState !== "playing") return;
    const clean = val.replace(/[^1-3]/g, ""); // Digits 1 to 3
    playSound("click", muted);
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = clean;
    setGrid(newGrid);
  };

  const verifyFutoshiki = () => {
    if (gameState !== "playing") return;

    // Check complete
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

    // 1. Latin Square check (unique rows & columns)
    for (let i = 0; i < 3; i++) {
      const rowVals = numericGrid[i];
      const colVals = [numericGrid[0][i], numericGrid[1][i], numericGrid[2][i]];

      const uniqueR = new Set(rowVals);
      const uniqueC = new Set(colVals);

      if (uniqueR.size !== 3 || uniqueC.size !== 3) {
        setErrorMsg("SHIELD FAULT: DUPLICATE VALUES DEVIATE FROM MATRIX LOGS.");
        handleVerifyError();
        return;
      }
    }

    // 2. Inequality check
    const preset = PRESETS[difficulty];
    
    // Horizontal constraints check
    for (const key in preset.hConstraints) {
      const [r, c] = key.split(",").map(Number);
      const op = preset.hConstraints[key];
      const v1 = numericGrid[r][c];
      const v2 = numericGrid[r][c + 1];

      if (op === "<" && v1 >= v2) {
        setErrorMsg(`SHIELD FAULT: INEQUALITY VALUE AT (${r+1}, ${c+1}) NOT < (${r+1}, ${c+2}).`);
        handleVerifyError();
        return;
      }
      if (op === ">" && v1 <= v2) {
        setErrorMsg(`SHIELD FAULT: INEQUALITY VALUE AT (${r+1}, ${c+1}) NOT > (${r+1}, ${c+2}).`);
        handleVerifyError();
        return;
      }
    }

    // Vertical constraints check
    for (const key in preset.vConstraints) {
      const [r, c] = key.split(",").map(Number);
      const op = preset.vConstraints[key];
      const v1 = numericGrid[r][c];
      const v2 = numericGrid[r + 1][c];

      if (op === "^" && v1 >= v2) { // smaller pointing down
        setErrorMsg(`SHIELD FAULT: INEQUALITY VALUE AT (${r+1}, ${c+1}) NOT < (${r+2}, ${c+1}).`);
        handleVerifyError();
        return;
      }
      if (op === "v" && v1 <= v2) { // greater pointing down
        setErrorMsg(`SHIELD FAULT: INEQUALITY VALUE AT (${r+1}, ${c+1}) NOT > (${r+2}, ${c+1}).`);
        handleVerifyError();
        return;
      }
    }

    // Victory!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
    updateStats("futoshiki", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields((s) => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("futoshiki", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>INEQUALITY FACTORS</h2>
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
          DEPLOY FUTOSHIKI
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

      {/* Grid rendering including inequalities inside gaps */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "#050510",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="futoshiki-grid"
      >
        {/* Row 0 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input type="text" maxLength={1} value={grid[0][0]} onChange={(e) => handleCellChange(0, 0, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
          <span style={{ fontSize: "16px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.hConstraints["0,0"] || ""}</span>
          <input type="text" maxLength={1} value={grid[0][1]} onChange={(e) => handleCellChange(0, 1, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
          <span style={{ fontSize: "16px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.hConstraints["0,1"] || ""}</span>
          <input type="text" maxLength={1} value={grid[0][2]} onChange={(e) => handleCellChange(0, 2, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
        </div>

        {/* Vertical constraints Row 0 -> Row 1 */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", padding: "0 15px", height: "14px" }}>
          <span style={{ fontSize: "14px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.vConstraints["0,0"] === "^" ? "▲" : preset.vConstraints["0,0"] === "v" ? "▼" : ""}</span>
          <span style={{ fontSize: "14px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.vConstraints["0,1"] === "^" ? "▲" : preset.vConstraints["0,1"] === "v" ? "▼" : ""}</span>
          <span style={{ fontSize: "14px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.vConstraints["0,2"] === "^" ? "▲" : preset.vConstraints["0,2"] === "v" ? "▼" : ""}</span>
        </div>

        {/* Row 1 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input type="text" maxLength={1} value={grid[1][0]} onChange={(e) => handleCellChange(1, 0, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
          <span style={{ fontSize: "16px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.hConstraints["1,0"] || ""}</span>
          <input type="text" maxLength={1} value={grid[1][1]} onChange={(e) => handleCellChange(1, 1, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
          <span style={{ fontSize: "16px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.hConstraints["1,1"] || ""}</span>
          <input type="text" maxLength={1} value={grid[1][2]} onChange={(e) => handleCellChange(1, 2, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
        </div>

        {/* Vertical constraints Row 1 -> Row 2 */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", padding: "0 15px", height: "14px" }}>
          <span style={{ fontSize: "14px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.vConstraints["1,0"] === "^" ? "▲" : preset.vConstraints["1,0"] === "v" ? "▼" : ""}</span>
          <span style={{ fontSize: "14px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.vConstraints["1,1"] === "^" ? "▲" : preset.vConstraints["1,1"] === "v" ? "▼" : ""}</span>
          <span style={{ fontSize: "14px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.vConstraints["1,2"] === "^" ? "▲" : preset.vConstraints["1,2"] === "v" ? "▼" : ""}</span>
        </div>

        {/* Row 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input type="text" maxLength={1} value={grid[2][0]} onChange={(e) => handleCellChange(2, 0, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
          <span style={{ fontSize: "16px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.hConstraints["2,0"] || ""}</span>
          <input type="text" maxLength={1} value={grid[2][1]} onChange={(e) => handleCellChange(2, 1, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
          <span style={{ fontSize: "16px", color: "var(--primary-color)", fontWeight: "bold", width: "12px", textAlign: "center" }}>{preset.hConstraints["2,1"] || ""}</span>
          <input type="text" maxLength={1} value={grid[2][2]} onChange={(e) => handleCellChange(2, 2, e.target.value)} style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "#fff", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "var(--font-display)" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={verifyFutoshiki} className={styles.btnAction}>
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
              Futoshiki inequality criteria resolved successfully. Database secured.
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
              Too many math inequality conflicts logged. Sector locked.
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
