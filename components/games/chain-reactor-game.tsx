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

const playReactionSound = (pitchMultiplier: number, muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const baseFreq = 200 + pitchMultiplier * 80;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.1);
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const playSpecialSound = (type: "victory" | "click" | "defeat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "defeat") {
      const notes = [160, 130, 100];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.03, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

export default function ChainReactorGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [grid, setGrid] = useState<number[][]>(Array(5).fill(null).map(() => Array(5).fill(0)));
  const [clicksUsed, setClicksUsed] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [reactionStep, setReactionStep] = useState<number>(0);

  const getMaxClicks = () => {
    return difficulty === "easy" ? 5 : difficulty === "medium" ? 3 : 2;
  };

  const getCapacity = (r: number, c: number) => {
    // Corner: capacity 2
    if ((r === 0 || r === 4) && (c === 0 || c === 4)) return 2;
    // Edge: capacity 3
    if (r === 0 || r === 4 || c === 0 || c === 4) return 3;
    // Center: capacity 4
    return 4;
  };

  const startNewGame = () => {
    // Generate pre-populated board with atoms
    const tempGrid = Array(5).fill(null).map(() => Array(5).fill(0));
    
    // Distribute a few atoms so that a single click can set off reactions
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cap = getCapacity(r, c);
        // Leave room below capacity
        tempGrid[r][c] = Math.random() > 0.6 ? cap - 1 : 0;
      }
    }

    // Force at least some atoms to avoid instant victory
    if (tempGrid.every(row => row.every(val => val === 0))) {
      tempGrid[2][2] = 3;
      tempGrid[2][1] = 2;
      tempGrid[2][3] = 2;
    }

    setGrid(tempGrid);
    setClicksUsed(0);
    setGameState("playing");
    setReactionStep(0);
    playSpecialSound("click", muted);
  };

  // Process recursive chain reactions sequentially in steps using timeouts
  const processChainReaction = (currentGrid: number[][], step: number, nextClicks: number) => {
    const nextGrid = currentGrid.map(row => [...row]);
    let exploded = false;

    // Check cells exceeding capacity
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cap = getCapacity(r, c);
        if (nextGrid[r][c] >= cap) {
          exploded = true;
          // Explode
          nextGrid[r][c] = 0;
          
          // Add to orthogonal neighbors
          const neighbors = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
          ];
          neighbors.forEach(([nr, nc]) => {
            if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
              nextGrid[nr][nc] += 1;
            }
          });
        }
      }
    }

    if (exploded) {
      playReactionSound(step, muted);
      setGrid(nextGrid);
      setReactionStep(step + 1);

      // Loop reaction recursively after short delay
      setTimeout(() => {
        processChainReaction(nextGrid, step + 1, nextClicks);
      }, 350);
    } else {
      // Check win/loss conditions
      const allCleared = nextGrid.every(row => row.every(val => val === 0));
      const limit = getMaxClicks();

      if (allCleared) {
        setGameState("victory");
        playSpecialSound("victory", muted);
        const scoreReward = difficulty === "easy" ? 25 : difficulty === "medium" ? 45 : 75;
        updateStats("chain_reactor", scoreReward, true);
      } else if (nextClicks >= limit) {
        setGameState("defeat");
        playSpecialSound("defeat", muted);
        updateStats("chain_reactor", 0, false);
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    playSpecialSound("click", muted);
    const nextGrid = grid.map(row => [...row]);
    nextGrid[r][c] += 1; // Add 1 atom
    setGrid(nextGrid);

    const nextClicks = clicksUsed + 1;
    setClicksUsed(nextClicks);

    // Trigger chain reactions
    setReactionStep(1);
    processChainReaction(nextGrid, 1, nextClicks);
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>REACTOR STACKS ENERGY</h2>
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
              {d === "easy" ? "5 CLICKS" : d === "medium" ? "3 CLICKS" : "2 CLICKS"}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          ENGAGE REACTOR COILS
        </button>
      </div>
    );
  }

  const clicksLimit = getMaxClicks();

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Clicks: <span style={{ color: clicksUsed >= clicksLimit ? "var(--error-color)" : "" }}>{clicksUsed} / {clicksLimit}</span></div>
        <div>Coils: <span>{reactionStep > 0 ? `REACTION #${reactionStep}` : "STABLE"}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      <div style={{ margin: "5px 0 15px 0", fontSize: "11px", color: "var(--text-secondary)" }}>
        * Corners explode at 2 atoms, edges at 3, center cells at 4. Click a cell to add atoms and trigger chain bursts!
      </div>

      {/* Grid rendering */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 52px)",
          gridTemplateRows: "repeat(5, 52px)",
          gap: "5px",
          background: "#060612",
          padding: "10px",
          borderRadius: "8px",
          border: "2px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="reactor-grid"
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const cap = getCapacity(r, c);
            const isNearingExplosion = val === cap - 1 && val > 0;
            
            let color = "var(--text-secondary)";
            let bg = "rgba(255,255,255,0.01)";
            let border = "1px solid rgba(255,255,255,0.03)";
            let cellGlow = "";

            if (val > 0) {
              if (isNearingExplosion) {
                color = "var(--error-color)";
                bg = "rgba(255, 42, 109, 0.08)";
                border = "1px solid var(--error-color)";
                cellGlow = "0 0 8px var(--error-glow)";
              } else {
                color = "var(--primary-color)";
                bg = "rgba(0, 210, 255, 0.08)";
                border = "1px solid var(--primary-color)";
                cellGlow = "0 0 5px var(--primary-glow)";
              }
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
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: "bold",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: "16px" }}>{val > 0 ? "⚛️".repeat(val) : ""}</span>
                <span style={{ fontSize: "8px", opacity: 0.3, marginTop: "2px" }}>max {cap}</span>
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Reactor
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>REACTOR CLEARED</span>
            <p className={styles.winText}>
              All energy particles exploded and grid coils stabilized. Decryption completed.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Terminal
            </Link>
          </div>
        </div>
      )}

      {gameState === "defeat" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal} style={{ borderColor: "var(--error-color)", boxShadow: "0 0 25px var(--error-glow)" }}>
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>CRITICAL CRACKDOWN</span>
            <p className={styles.winText}>
              Clicks limit exceeded before complete grid energy discharge. Reactor overloaded.
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
