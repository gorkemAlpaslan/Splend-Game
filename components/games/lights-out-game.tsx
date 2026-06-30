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

const playSound = (type: "victory" | "click" | "reset", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "reset") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C major
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.03, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

export default function LightsOutGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory">("lobby");
  const [grid, setGrid] = useState<boolean[][]>(Array(5).fill(null).map(() => Array(5).fill(false)));
  const [moves, setMoves] = useState<number>(0);

  const startNewGame = () => {
    // Generate clean grid
    const tempGrid = Array(5).fill(null).map(() => Array(5).fill(false));
    
    // Simulate random toggles to guarantee solvable configurations
    const toggleCount = difficulty === "easy" ? 5 : difficulty === "medium" ? 10 : 15;
    const coords: [number, number][] = [
      [0,0], [0,1], [0,-1], [1,0], [-1,0]
    ];

    for (let i = 0; i < toggleCount; i++) {
      const r = Math.floor(Math.random() * 5);
      const c = Math.floor(Math.random() * 5);
      // Toggle
      coords.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
          tempGrid[nr][nc] = !tempGrid[nr][nc];
        }
      });
    }

    // Edge case check: make sure at least some lights are on
    const allOff = tempGrid.every(r => r.every(v => !v));
    if (allOff) {
      tempGrid[2][2] = true;
      tempGrid[1][2] = true;
      tempGrid[3][2] = true;
    }

    setGrid(tempGrid);
    setMoves(0);
    setGameState("playing");
    playSound("reset", muted);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    playSound("click", muted);
    const newGrid = grid.map(row => [...row]);
    const coords = [
      [0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]
    ];

    coords.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
        newGrid[nr][nc] = !newGrid[nr][nc];
      }
    });

    setGrid(newGrid);
    setMoves(m => m + 1);

    // Check victory
    const allOff = newGrid.every(row => row.every(val => !val));
    if (allOff) {
      setGameState("victory");
      playSound("victory", muted);
      const scoreReward = difficulty === "easy" ? 15 : difficulty === "medium" ? 30 : 50;
      updateStats("lights_out", scoreReward, true);
    }
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>SHIELD ENCRYPTION PARAMETERS</h2>
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
          DEPLOY CONTROLLER
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Difficulty: <span>{difficulty.toUpperCase()}</span></div>
        <div>Moves: <span>{moves}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      <div className={styles.lightsGrid}>
        {grid.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              className={`${styles.lightCell} ${val ? styles.lightOn : styles.lightOff}`}
            />
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Puzzle
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>SHIELD DECRYPTED</span>
            <p className={styles.winText}>
              All active nodes successfully extinguished in {moves} moves. Score updated.
            </p>
            <Link href="/" className={styles.btnAction}>
              Return Database
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
