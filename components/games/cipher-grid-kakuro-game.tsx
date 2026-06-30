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

const KAKURO_PUZZLES = [
  {
    // Easy Puzzle
    rowSums: [12, 7], // Sum targets for row 1 and 2
    colSums: [13, 6], // Sum targets for col 1 and 2
    solution: [
      [8, 4],
      [5, 2]
    ]
  },
  {
    // Medium Puzzle
    rowSums: [11, 10],
    colSums: [12, 9],
    solution: [
      [7, 4],
      [5, 5]
    ]
  },
  {
    // Hard Puzzle
    rowSums: [16, 5],
    colSums: [12, 9],
    solution: [
      [9, 7],
      [3, 2]
    ]
  }
];

export default function CipherGridKakuroGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [cells, setCells] = useState<string[][]>([["", ""], ["", ""]]);
  const [shields, setShields] = useState<number>(3);
  const [muted, setMuted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const puzzle = KAKURO_PUZZLES[difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2];

  const startNewGame = () => {
    setCells([["", ""], ["", ""]]);
    setShields(3);
    setErrorMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    if (gameState !== "playing") return;
    
    // Allow digits 1-9 or empty
    const clean = val.replace(/[^1-9]/g, "");
    playSound("click", muted);
    const newCells = cells.map(row => [...row]);
    newCells[r][c] = clean;
    setCells(newCells);
  };

  const verifyKakuro = () => {
    if (gameState !== "playing") return;

    // Check filled
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        if (!cells[r][c]) {
          setErrorMsg("VERIFICATION ERROR: INCOMPLETE SEQUENCE BLOCKS.");
          playSound("error", muted);
          return;
        }
      }
    }

    const n00 = Number(cells[0][0]);
    const n01 = Number(cells[0][1]);
    const n10 = Number(cells[1][0]);
    const n11 = Number(cells[1][1]);

    // Check unique digits in row runs and column runs
    if (n00 === n01 || n10 === n11 || n00 === n10 || n01 === n11) {
      setErrorMsg("SHIELD FAULT: DIGITS WITHIN SAME LINE MUST BE UNIQUE.");
      handleVerifyError();
      return;
    }

    // Check sum conditions
    const r1 = n00 + n01;
    const r2 = n10 + n11;
    const c1 = n00 + n10;
    const c2 = n01 + n11;

    if (r1 !== puzzle.rowSums[0] || r2 !== puzzle.rowSums[1] || c1 !== puzzle.colSums[0] || c2 !== puzzle.colSums[1]) {
      setErrorMsg("SHIELD FAULT: CROSS SUM CONDITIONS MISMATCH.");
      handleVerifyError();
      return;
    }

    // Victory!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
    updateStats("cipher_grid_kakuro", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields((s) => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("cipher_grid_kakuro", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>KAKURO FIELD SEGMENT</h2>
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
          DEPLOY CROSS-SUMS
        </button>
      </div>
    );
  }

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

      {/* 3x3 layout Kakuro style board */}
      <table style={{ borderCollapse: "separate", borderSpacing: "8px", background: "#050510", padding: "15px", borderRadius: "10px", border: "1px solid var(--glass-border)" }} id="kakuro-board">
        <tbody>
          <tr>
            {/* Cell (0,0) - Clue corner */}
            <td style={{
              width: "56px",
              height: "56px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--glass-border)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              fontSize: "10px",
              color: "var(--text-secondary)"
            }}>
              <span style={{ position: "absolute", top: "4px", right: "6px" }}>R \</span>
              <span style={{ position: "absolute", bottom: "4px", left: "6px" }}>\ C</span>
            </td>
            {/* Clue Column 1 */}
            <td style={{
              width: "56px",
              height: "56px",
              background: "rgba(0, 210, 255, 0.05)",
              border: "1px solid var(--primary-color)",
              borderRadius: "4px",
              textAlign: "center",
              verticalAlign: "middle",
              fontFamily: "var(--font-display)",
              fontWeight: "bold",
              color: "var(--primary-color)"
            }}>
              Col<br />{puzzle.colSums[0]}
            </td>
            {/* Clue Column 2 */}
            <td style={{
              width: "56px",
              height: "56px",
              background: "rgba(0, 210, 255, 0.05)",
              border: "1px solid var(--primary-color)",
              borderRadius: "4px",
              textAlign: "center",
              verticalAlign: "middle",
              fontFamily: "var(--font-display)",
              fontWeight: "bold",
              color: "var(--primary-color)"
            }}>
              Col<br />{puzzle.colSums[1]}
            </td>
          </tr>
          <tr>
            {/* Clue Row 1 */}
            <td style={{
              width: "56px",
              height: "56px",
              background: "rgba(0, 210, 255, 0.05)",
              border: "1px solid var(--primary-color)",
              borderRadius: "4px",
              textAlign: "center",
              verticalAlign: "middle",
              fontFamily: "var(--font-display)",
              fontWeight: "bold",
              color: "var(--primary-color)"
            }}>
              Row<br />{puzzle.rowSums[0]}
            </td>
            {/* Input Cell (0,0) */}
            <td>
              <input
                type="text"
                maxLength={1}
                value={cells[0][0]}
                onChange={(e) => handleCellChange(0, 0, e.target.value)}
                style={{
                  width: "56px",
                  height: "56px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontFamily: "var(--font-display)"
                }}
              />
            </td>
            {/* Input Cell (0,1) */}
            <td>
              <input
                type="text"
                maxLength={1}
                value={cells[0][1]}
                onChange={(e) => handleCellChange(0, 1, e.target.value)}
                style={{
                  width: "56px",
                  height: "56px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontFamily: "var(--font-display)"
                }}
              />
            </td>
          </tr>
          <tr>
            {/* Clue Row 2 */}
            <td style={{
              width: "56px",
              height: "56px",
              background: "rgba(0, 210, 255, 0.05)",
              border: "1px solid var(--primary-color)",
              borderRadius: "4px",
              textAlign: "center",
              verticalAlign: "middle",
              fontFamily: "var(--font-display)",
              fontWeight: "bold",
              color: "var(--primary-color)"
            }}>
              Row<br />{puzzle.rowSums[1]}
            </td>
            {/* Input Cell (1,0) */}
            <td>
              <input
                type="text"
                maxLength={1}
                value={cells[1][0]}
                onChange={(e) => handleCellChange(1, 0, e.target.value)}
                style={{
                  width: "56px",
                  height: "56px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontFamily: "var(--font-display)"
                }}
              />
            </td>
            {/* Input Cell (1,1) */}
            <td>
              <input
                type="text"
                maxLength={1}
                value={cells[1][1]}
                onChange={(e) => handleCellChange(1, 1, e.target.value)}
                style={{
                  width: "56px",
                  height: "56px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontFamily: "var(--font-display)"
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={verifyKakuro} className={styles.btnAction}>
          VERIFY CROSS SUMS
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>KAKURO DECRYPTED</span>
            <p className={styles.winText}>
              All horizontal and vertical constraints have compiled cleanly. Target secured.
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
              Too many compile errors logged on verification checks. Sector locked down.
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
