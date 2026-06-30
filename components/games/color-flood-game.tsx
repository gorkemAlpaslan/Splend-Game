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

const playSound = (type: "victory" | "click" | "defeat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);
      gain.gain.setValueAtTime(0.02, now);
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
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // ascending major chord
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const FLOOD_COLORS = [
  "#00d2ff", // Cyan
  "#00e676", // Green
  "#ff2a6d", // Red
  "#ffd54f", // Yellow
  "#ff9100", // Orange
  "#d500f9"  // Magenta
];

export default function ColorFloodGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [grid, setGrid] = useState<number[][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  const getMaxMoves = () => {
    return difficulty === "easy" ? 22 : difficulty === "medium" ? 18 : 15;
  };

  const startNewGame = () => {
    const tempGrid = Array(12).fill(null).map(() =>
      Array(12).fill(null).map(() => Math.floor(Math.random() * 6))
    );
    setGrid(tempGrid);
    setMoves(0);
    setGameState("playing");
    playSound("click", muted);
  };

  const handleColorSelection = (colorIdx: number) => {
    if (gameState !== "playing") return;
    
    const startColor = grid[0][0];
    if (colorIdx === startColor) return;

    playSound("click", muted);
    const newGrid = grid.map(row => [...row]);
    const visited = Array(12).fill(null).map(() => Array(12).fill(false));

    // Flood fill traversal from top-left (0,0)
    const floodQueue: [number, number][] = [[0, 0]];
    visited[0][0] = true;

    while (floodQueue.length > 0) {
      const [r, c] = floodQueue.shift()!;
      newGrid[r][c] = colorIdx;

      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ];

      neighbors.forEach(([nr, nc]) => {
        if (nr >= 0 && nr < 12 && nc >= 0 && nc < 12) {
          if (!visited[nr][nc] && newGrid[nr][nc] === startColor) {
            visited[nr][nc] = true;
            floodQueue.push([nr, nc]);
          }
        }
      });
    }

    setGrid(newGrid);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    // Verify if all flooded (converted to the single color)
    const isFlooded = newGrid.every(row => row.every(val => val === colorIdx));
    const limit = getMaxMoves();

    if (isFlooded) {
      setGameState("victory");
      playSound("victory", muted);
      const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 70;
      updateStats("color_flood", pointsReward, true);
    } else if (nextMoves >= limit) {
      setGameState("defeat");
      playSound("defeat", muted);
      updateStats("color_flood", 0, false);
    }
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>FLOOD MOVES LIMIT</h2>
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
              {d === "easy" ? "22 MOVES" : d === "medium" ? "18 MOVES" : "15 MOVES"}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          DEPLOY COLOR FLOOD
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Moves: <span style={{ color: moves >= getMaxMoves() ? "var(--error-color)" : "" }}>{moves} / {getMaxMoves()}</span></div>
        <div>Target: <span>FLOOD ALL CORES</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {/* 12x12 Grid display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 18px)",
          gridTemplateRows: "repeat(12, 18px)",
          gap: "2px",
          background: "#060610",
          padding: "8px",
          borderRadius: "8px",
          border: "2px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="flood-grid"
      >
        {grid.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                background: FLOOD_COLORS[val],
                borderRadius: "2px",
                transition: "background 0.25s ease"
              }}
            />
          ))
        )}
      </div>

      {/* Color Selection Buttons Deck */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "center" }} id="color-flood-deck">
        {FLOOD_COLORS.map((color, idx) => (
          <button
            key={idx}
            onClick={() => handleColorSelection(idx)}
            style={{
              background: color,
              border: "2px stroke #fff",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              boxShadow: `0 0 8px ${color}`,
              transition: "transform 0.15s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.15)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1.0)"}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Grid
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>GRID FLOODED</span>
            <p className={styles.winText}>
              All sectors flooded successfully in {moves} moves. Matrix stabilized.
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>FLOOD OVERFLOW</span>
            <p className={styles.winText}>
              Maximum limit of flood moves achieved. Encryption locks closed.
            </p>
            <button onClick={startNewGame} className={styles.btnAction} style={{ background: "var(--error-color)", color: "#000" }}>
              Re-Flood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
