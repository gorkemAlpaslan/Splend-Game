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

const playSound = (type: "victory" | "click" | "backtrack" | "reset", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "backtrack") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "reset") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.12);
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.08 + 0.02);
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

export default function PathTracerGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory">("lobby");
  const [path, setPath] = useState<[number, number][]>([]); // Coordinates coordinates array
  const [muted, setMuted] = useState<boolean>(false);

  const getGridSize = () => {
    return difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  };

  const startNewGame = () => {
    setPath([[0, 0]]); // Start at top-left
    setGameState("playing");
    playSound("reset", muted);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    // Check if clicked cell is already in the path
    const pathIdx = path.findIndex(([pr, pc]) => pr === r && pc === c);

    if (pathIdx !== -1) {
      // If it's the last element, backtrack (remove it)
      if (pathIdx === path.length - 1 && path.length > 1) {
        playSound("backtrack", muted);
        setPath(path.slice(0, -1));
      }
      return;
    }

    // Check if clicked cell is adjacent to the last element of the path
    const [lr, lc] = path[path.length - 1];
    const isAdjacent = (Math.abs(lr - r) === 1 && lc === c) || (Math.abs(lc - c) === 1 && lr === r);

    if (isAdjacent) {
      playSound("click", muted);
      const nextPath: [number, number][] = [...path, [r, c]];
      setPath(nextPath);

      // Verify victory condition: path covers all cells exactly once
      const size = getGridSize();
      const targetLength = size * size;
      if (nextPath.length === targetLength) {
        setGameState("victory");
        playSound("victory", muted);
        const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
        updateStats("path_tracer", pointsReward, true);
      }
    }
  };

  const size = getGridSize();
  const cellsIndices = Array.from({ length: size }).map((_, i) => i);

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>GRID COMPRESSION RATIO</h2>
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
              {d === "easy" ? "3x3 (9 CELLS)" : d === "medium" ? "4x4 (16 CELLS)" : "5x5 (25 CELLS)"}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          DEPLOY PATH FIELD
        </button>
      </div>
    );
  }

  const isSolved = gameState === "victory";

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Coverage: <span>{path.length} / {size * size}</span></div>
        <div>Sector: <span>{difficulty.toUpperCase()}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      <div style={{ margin: "5px 0 15px 0", fontSize: "11px", color: "var(--text-secondary)" }}>
        * Trace a single continuous line. Click adjacent empty tiles to draw, click the last tile to backtrack.
      </div>

      {/* Grid rendering */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 46px)`,
          gridTemplateRows: `repeat(${size}, 46px)`,
          gap: "6px",
          background: "#060610",
          padding: "10px",
          borderRadius: "8px",
          border: "2px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="tracer-grid"
      >
        {cellsIndices.map((r) =>
          cellsIndices.map((c) => {
            const isStart = r === 0 && c === 0;
            const pathIdx = path.findIndex(([pr, pc]) => pr === r && pc === c);
            const isVisited = pathIdx !== -1;
            const isLast = pathIdx === path.length - 1;

            let bg = "rgba(255, 255, 255, 0.02)";
            let border = "1px solid rgba(255,255,255,0.05)";
            let cellGlow = "";

            if (isStart) {
              bg = isSolved ? "rgba(0, 230, 118, 0.15)" : "rgba(0, 210, 255, 0.15)";
              border = isSolved ? "1px solid var(--success-color)" : "1px solid var(--primary-color)";
              cellGlow = isSolved ? "0 0 8px var(--success-glow)" : "0 0 8px var(--primary-glow)";
            } else if (isVisited) {
              bg = isSolved ? "rgba(0, 230, 118, 0.08)" : "rgba(0, 210, 255, 0.08)";
              border = isSolved ? "1px solid var(--success-color)" : "1px solid var(--primary-color)";
              if (isLast) {
                cellGlow = isSolved ? "0 0 8px var(--success-glow)" : "0 0 6px var(--primary-glow)";
              }
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  background: bg,
                  border: border,
                  boxShadow: cellGlow,
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: isSolved ? "var(--success-color)" : "var(--primary-color)",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.2s ease"
                }}
              >
                {isStart ? "S" : isVisited ? String(pathIdx + 1) : ""}
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Trace
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {isSolved && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>PATH TRACED SUCCESSFULLY</span>
            <p className={styles.winText}>
              All database core nodes fully cataloged. Loop sequence stabilized.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Database
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
