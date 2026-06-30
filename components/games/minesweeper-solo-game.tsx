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

const playSound = (type: "victory" | "click" | "flag" | "defeat", muted: boolean) => {
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
    } else if (type === "flag") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.06);
    } else if (type === "defeat") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.35);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25];
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

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export default function MinesweeperSoloGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [flagMode, setFlagMode] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const getGridSize = () => {
    return difficulty === "easy" ? 6 : difficulty === "medium" ? 8 : 10;
  };

  const getMineCount = () => {
    return difficulty === "easy" ? 5 : difficulty === "medium" ? 10 : 16;
  };

  const startNewGame = () => {
    const size = getGridSize();
    const mineCount = getMineCount();

    // 1. Create clean grid
    const tempGrid: Cell[][] = Array(size).fill(null).map((_, r) =>
      Array(size).fill(null).map((__, c) => ({
        r, c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      }))
    );

    // 2. Place random mines
    let placed = 0;
    while (placed < mineCount) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!tempGrid[r][c].isMine) {
        tempGrid[r][c].isMine = true;
        placed++;
      }
    }

    // 3. Compute adjacency counts
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (tempGrid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (tempGrid[nr][nc].isMine) count++;
            }
          }
        }
        tempGrid[r][c].adjacentMines = count;
      }
    }

    setGrid(tempGrid);
    setGameState("playing");
    setFlagMode(false);
    playSound("click", muted);
  };

  // Reveal zero-cell empty neighborhoods recursively
  const revealEmptyCells = (currentGrid: Cell[][], startR: number, startC: number) => {
    const size = getGridSize();
    const queue: [number, number][] = [[startR, startC]];

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const cell = currentGrid[r][c];
      if (cell.isRevealed) continue;
      cell.isRevealed = true;

      if (cell.adjacentMines === 0 && !cell.isMine) {
        // Traverse all 8 directions
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              const neighbor = currentGrid[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isMine && !neighbor.isFlagged) {
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    const cell = grid[r][c];
    if (cell.isRevealed) return;

    // Toggle Flag placement mode
    if (flagMode) {
      handleCellRightClick(r, c);
      return;
    }

    if (cell.isFlagged) return;

    const newGrid = grid.map(row => row.map(cl => ({ ...cl })));
    const targetCell = newGrid[r][c];

    // Trigger Mine Explosion (Loss)
    if (targetCell.isMine) {
      // Reveal all mines on board
      newGrid.forEach(row => row.forEach(cl => {
        if (cl.isMine) cl.isRevealed = true;
      }));
      setGrid(newGrid);
      setGameState("defeat");
      playSound("defeat", muted);
      updateStats("minesweeper_solo", 0, false);
      return;
    }

    playSound("click", muted);

    if (targetCell.adjacentMines === 0) {
      revealEmptyCells(newGrid, r, c);
    } else {
      targetCell.isRevealed = true;
    }

    setGrid(newGrid);

    // Verify victory condition (all non-mines uncovered)
    const size = getGridSize();
    let won = true;
    for (let rowIdx = 0; rowIdx < size; rowIdx++) {
      for (let colIdx = 0; colIdx < size; colIdx++) {
        const cl = newGrid[rowIdx][colIdx];
        if (!cl.isMine && !cl.isRevealed) {
          won = false;
          break;
        }
      }
    }

    if (won) {
      setGameState("victory");
      playSound("victory", muted);
      const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 70;
      updateStats("minesweeper_solo", pointsReward, true);
    }
  };

  const handleCellRightClick = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (gameState !== "playing") return;

    const cell = grid[r][c];
    if (cell.isRevealed) return;

    playSound("flag", muted);
    const newGrid = grid.map(row => row.map(cl => ({ ...cl })));
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setGrid(newGrid);
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>GRID COMPILER COMPLEXITY</h2>
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
              {d === "easy" ? "6x6 (5 MINES)" : d === "medium" ? "8x8 (10 MINES)" : "10x10 (16 MINES)"}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          DEPLOY MINESWEEPER
        </button>
      </div>
    );
  }

  const size = getGridSize();

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Flag Mode: <span onClick={() => setFlagMode(!flagMode)} style={{ cursor: "pointer", color: "var(--primary-color)", textDecoration: "underline" }}>{flagMode ? "FLAG PLACING" : "DIGGING CELLS"}</span></div>
        <div>Difficulty: <span>{difficulty.toUpperCase()}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      <div style={{ margin: "5px 0 15px 0", fontSize: "11px", color: "var(--text-secondary)" }}>
        * Right-click cells to toggle flags, or use the <strong>Flag Mode</strong> button to place flags on touch.
      </div>

      {/* Grid rendering */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 32px)`,
          gridTemplateRows: `repeat(${size}, 32px)`,
          gap: "3px",
          background: "#060610",
          padding: "10px",
          borderRadius: "8px",
          border: "2px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="sweeper-grid"
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            let cellContent = "";
            let bg = "rgba(255, 255, 255, 0.03)";
            let border = "1px solid rgba(255,255,255,0.05)";
            let color = "#ffffff";

            if (cell.isRevealed) {
              bg = "rgba(0, 0, 0, 0.4)";
              border = "1px solid var(--glass-border)";
              if (cell.isMine) {
                cellContent = "💥";
                bg = "rgba(255, 42, 109, 0.2)";
                border = "1px solid var(--error-color)";
              } else if (cell.adjacentMines > 0) {
                cellContent = String(cell.adjacentMines);
                const colors = ["#00d2ff", "#00e676", "#ff2a6d", "#ffd54f", "#ff9100", "#d500f9", "#ffffff", "#ffffff"];
                color = colors[cell.adjacentMines - 1] || "#ffffff";
              }
            } else if (cell.isFlagged) {
              cellContent = "🚩";
              color = "var(--error-color)";
              bg = "rgba(255, 42, 109, 0.05)";
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleCellRightClick(r, c, e)}
                style={{
                  background: bg,
                  border: border,
                  color: color,
                  borderRadius: "3px",
                  cursor: cell.isRevealed ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  fontWeight: "bold",
                  transition: "all 0.15s ease"
                }}
                onMouseOver={(e) => {
                  if (!cell.isRevealed) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseOut={(e) => {
                  if (!cell.isRevealed) e.currentTarget.style.background = cell.isFlagged ? "rgba(255, 42, 109, 0.05)" : "rgba(255,255,255,0.03)";
                }}
              >
                {cellContent}
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          onClick={() => setFlagMode(!flagMode)}
          className={styles.btnAction}
          style={{
            background: flagMode ? "var(--error-color)" : "rgba(255,255,255,0.05)",
            color: flagMode ? "#000" : "#fff",
            border: "1px solid var(--glass-border)"
          }}
        >
          {flagMode ? "DIG MODE" : "FLAG MODE"}
        </button>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Field
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>MINEFIELD NEUTRALIZED</span>
            <p className={styles.winText}>
              All system cores successfully cleared. Database records updated successfully.
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>CORE DETONATION</span>
            <p className={styles.winText}>
              Active database mine core triggered. Encryption locked.
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
