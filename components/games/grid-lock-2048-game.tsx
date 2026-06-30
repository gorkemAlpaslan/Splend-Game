import React, { useState, useEffect, useCallback } from "react";
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

const playSound = (type: "victory" | "slide" | "merge" | "defeat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "slide") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.04);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.04);
    } else if (type === "merge") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.08);
    } else if (type === "defeat") {
      const notes = [150, 120, 90];
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
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C major high
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

export default function GridLock2048Game() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [grid, setGrid] = useState<number[][]>(Array(4).fill(null).map(() => Array(4).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  const getTargetValue = () => {
    return difficulty === "easy" ? 256 : difficulty === "medium" ? 512 : 2048;
  };

  const spawnRandomTile = (currentGrid: number[][]) => {
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) {
          emptyCells.push([r, c]);
        }
      }
    }
    if (emptyCells.length > 0) {
      const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
    }
  };

  const startNewGame = () => {
    const newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
    spawnRandomTile(newGrid);
    spawnRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameState("playing");
    playSound("slide", muted);
  };

  const checkGameOver = (currentGrid: number[][]): boolean => {
    // If empty cells exist, not game over
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) return false;
      }
    }
    // Check horizontal moves
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        if (currentGrid[r][c] === currentGrid[r][c + 1]) return false;
      }
    }
    // Check vertical moves
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 3; r++) {
        if (currentGrid[r][c] === currentGrid[r + 1][c]) return false;
      }
    }
    return true;
  };

  const slideLeft = (row: number[], statsRef: { points: number; merged: boolean }) => {
    const filtered = row.filter((v) => v !== 0);
    const result: number[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i] === filtered[i + 1]) {
        result.push(filtered[i] * 2);
        statsRef.points += filtered[i] * 2;
        statsRef.merged = true;
        i++;
      } else {
        result.push(filtered[i]);
      }
    }
    while (result.length < 4) {
      result.push(0);
    }
    return result;
  };

  const handleMove = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (gameState !== "playing") return;

    let tempGrid = grid.map(row => [...row]);
    let points = 0;
    let moved = false;
    let merged = false;

    if (direction === "left") {
      for (let r = 0; r < 4; r++) {
        const statsRef = { points: 0, merged: false };
        const nextRow = slideLeft(tempGrid[r], statsRef);
        if (JSON.stringify(tempGrid[r]) !== JSON.stringify(nextRow)) moved = true;
        if (statsRef.merged) merged = true;
        points += statsRef.points;
        tempGrid[r] = nextRow;
      }
    } else if (direction === "right") {
      for (let r = 0; r < 4; r++) {
        const statsRef = { points: 0, merged: false };
        const reversed = [...tempGrid[r]].reverse();
        const nextRow = slideLeft(reversed, statsRef).reverse();
        if (JSON.stringify(tempGrid[r]) !== JSON.stringify(nextRow)) moved = true;
        if (statsRef.merged) merged = true;
        points += statsRef.points;
        tempGrid[r] = nextRow;
      }
    } else if (direction === "up") {
      for (let c = 0; c < 4; c++) {
        const statsRef = { points: 0, merged: false };
        const col = [tempGrid[0][c], tempGrid[1][c], tempGrid[2][c], tempGrid[3][c]];
        const nextCol = slideLeft(col, statsRef);
        for (let r = 0; r < 4; r++) {
          if (tempGrid[r][c] !== nextCol[r]) moved = true;
          tempGrid[r][c] = nextCol[r];
        }
        if (statsRef.merged) merged = true;
        points += statsRef.points;
      }
    } else if (direction === "down") {
      for (let c = 0; c < 4; c++) {
        const statsRef = { points: 0, merged: false };
        const col = [tempGrid[3][c], tempGrid[2][c], tempGrid[1][c], tempGrid[0][c]];
        const nextCol = slideLeft(col, statsRef).reverse();
        for (let r = 0; r < 4; r++) {
          if (tempGrid[r][c] !== nextCol[r]) moved = true;
          tempGrid[r][c] = nextCol[r];
        }
        if (statsRef.merged) merged = true;
        points += statsRef.points;
      }
    }

    if (moved) {
      spawnRandomTile(tempGrid);
      setGrid(tempGrid);
      setScore(s => s + points);
      
      if (merged) {
        playSound("merge", muted);
      } else {
        playSound("slide", muted);
      }

      // Check win value
      const target = getTargetValue();
      const hasWon = tempGrid.some(row => row.some(val => val >= target));
      if (hasWon) {
        setGameState("victory");
        playSound("victory", muted);
        const scoreReward = difficulty === "easy" ? 25 : difficulty === "medium" ? 45 : 80;
        updateStats("grid_lock_2048", scoreReward, true);
        return;
      }

      // Check game over
      if (checkGameOver(tempGrid)) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("grid_lock_2048", 0, false);
      }
    }
  }, [grid, gameState, difficulty, muted]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        handleMove("up");
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleMove("down");
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleMove("left");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        handleMove("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove, gameState]);

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>GRID COMPRESSION FACTOR</h2>
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
              {d === "easy" ? "256 (EASY)" : d === "medium" ? "512 (MEDIUM)" : "2048 (HARD)"}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          INITIALIZE MATRIX
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Score: <span>{score}</span></div>
        <div>Target: <span>{getTargetValue()}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      <div className={styles.grid2048} id="grid-2048">
        {grid.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className={styles.cell2048}
              style={{
                background: val > 0 ? `rgba(0, 210, 255, ${Math.min(1, 0.1 + Math.log2(val) * 0.12)})` : "",
                borderColor: val > 0 ? "var(--primary-color)" : "",
                color: val > 0 ? "#ffffff" : "rgba(255,255,255,0.02)",
                boxShadow: val > 0 ? `0 0 ${Math.min(20, Math.log2(val) * 2)}px rgba(0,210,255,0.2)` : "",
                fontSize: val >= 1024 ? "12px" : "14px"
              }}
            >
              {val > 0 ? val : ""}
            </div>
          ))
        )}
      </div>

      {/* On-screen keyboard controls */}
      <div className={styles.controls2048} style={{ marginTop: "15px" }}>
        <div />
        <button onClick={() => handleMove("up")} className={styles.controlBtn}>▲</button>
        <div />
        <button onClick={() => handleMove("left")} className={styles.controlBtn}>◀</button>
        <button onClick={() => handleMove("down")} className={styles.controlBtn}>▼</button>
        <button onClick={() => handleMove("right")} className={styles.controlBtn}>▶</button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Board
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
              Target value achieved. Encryption key compile sequence succeeded. Final Score: {score}
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>MATRIX OVERFLOW</span>
            <p className={styles.winText}>
              No further logical merges possible on the grid. Sector decryption aborted.
            </p>
            <button onClick={startNewGame} className={styles.btnAction} style={{ background: "var(--error-color)", color: "#000" }}>
              Re-Compile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
