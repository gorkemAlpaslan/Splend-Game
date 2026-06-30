import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./hex-sudoku-style.module.sass";

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (type: "victory" | "defeat" | "click" | "error", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(270, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "error") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "victory") {
      const notes = [349.23, 440.00, 523.25, 698.46]; // F Major chord arpeggio
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    } else if (type === "defeat") {
      const notes = [220, 180, 140];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    }
  } catch (e) {
    console.error("Synthesizer sound playback failed:", e);
  }
};

interface SudokuCell {
  id: number;
  value: string; // "1", "2", "3", "4", or ""
  prefilled: boolean;
  targetValue: string;
  hasError: boolean;
}

export default function HexSudokuGame() {
  const { stats, updateStats } = useAuth();
  const gameStats = stats.games.hex_sudoku || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  // Setup options
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");

  // Grid parameters
  const [grid, setGrid] = useState<SudokuCell[]>([]);
  const [lives, setLives] = useState<number>(3);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1.0);
  const [pointsWon, setPointsWon] = useState<number>(0);

  const handleDifficultySelection = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    if (diff === "easy") setScoreMultiplier(1.0);
    else if (diff === "medium") setScoreMultiplier(1.5);
    else setScoreMultiplier(2.0);
  };

  const startMission = () => {
    initAudio();
    setGameState("playing");
    setLives(3);
    setPointsWon(0);

    // 1. Generate Solved 4x4 Sudoku
    const baseGrid = [
      1, 2, 3, 4,
      3, 4, 1, 2,
      2, 1, 4, 3,
      4, 3, 2, 1
    ];

    // Permute values 1-4 randomly
    const numbers = [1, 2, 3, 4];
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const solvedValues = baseGrid.map((val) => String(numbers[val - 1]));

    // 2. Hide cells based on difficulty
    const newGrid: SudokuCell[] = [];
    const cellsToHide = difficulty === "easy" ? 6 : difficulty === "medium" ? 9 : 12;
    const hiddenIndices: Set<number> = new Set();

    while (hiddenIndices.size < cellsToHide) {
      const randIdx = Math.floor(Math.random() * 16);
      hiddenIndices.add(randIdx);
    }

    for (let i = 0; i < 16; i++) {
      const targetValue = solvedValues[i];
      const prefilled = !hiddenIndices.has(i);
      newGrid.push({
        id: i,
        value: prefilled ? targetValue : "",
        prefilled,
        targetValue,
        hasError: false
      });
    }

    setGrid(newGrid);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing") return;

    const tile = grid[index];
    if (tile.prefilled) return;

    playSynthSound("click", muted);

    // Cycle value: "" -> "1" -> "2" -> "3" -> "4" -> ""
    const updatedGrid = [...grid];
    let nextVal = "";
    if (tile.value === "") nextVal = "1";
    else if (tile.value === "1") nextVal = "2";
    else if (tile.value === "2") nextVal = "3";
    else if (tile.value === "3") nextVal = "4";

    updatedGrid[index] = {
      ...tile,
      value: nextVal,
      hasError: false // reset error on modification
    };

    setGrid(updatedGrid);
  };

  const handleVerifyGrid = () => {
    if (gameState !== "playing") return;

    let errorsFound = false;
    const updatedGrid = grid.map((tile) => {
      // If empty or incorrect, flag it
      const incorrect = tile.value === "" || tile.value !== tile.targetValue;
      if (incorrect) errorsFound = true;
      return {
        ...tile,
        hasError: incorrect
      };
    });

    setGrid(updatedGrid);

    if (!errorsFound) {
      // Solved successfully!
      setGameState("victory");
      playSynthSound("victory", muted);
      
      const basePoints = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      const totalPoints = Math.round(basePoints * scoreMultiplier);
      setPointsWon(totalPoints);
      updateStats("hex_sudoku", totalPoints, true);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
    } else {
      // Deduct shield on mistakes
      playSynthSound("error", muted);
      const nextLives = lives - 1;
      setLives(nextLives);

      if (nextLives <= 0) {
        setGameState("defeat");
        playSynthSound("defeat", muted);
        updateStats("hex_sudoku", 0, false);
        window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
      }
    }
  };

  const handleAbandon = () => {
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("hex_sudoku", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  return (
    <div className={styles.playArea} id="hs-play-area">
      {/* Sudoku grid */}
      <div className={styles.gameGridWrapper} id="hs-grid-wrapper">
        {gameState === "lobby" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="var(--primary-color)" style={{ filter: "drop-shadow(0 0 15px var(--primary-glow))" }}>
              <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--primary-color)", margin: 0 }}>HEX SUDOKU MATRIX</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", maxWidth: "450px", margin: 0 }}>
              Re-align the grid logs. Complete the 4x4 matrix using numbers 1, 2, 3, and 4. No number can repeat in any row, column, or 2x2 sector quadrant.
            </p>
          </div>
        ) : (
          <div className={styles.gameGrid} id="hs-game-grid">
            {grid.map((cell, idx) => {
              const classes = 
                cell.prefilled ? `${styles.tile} ${styles.tilePrefilled}` : 
                cell.hasError ? `${styles.tile} ${styles.tileError}` : 
                styles.tile;

              return (
                <button
                  key={cell.id}
                  className={classes}
                  onClick={() => handleTileClick(idx)}
                  disabled={cell.prefilled || gameState !== "playing"}
                  aria-label={`Slot ${idx}`}
                >
                  {cell.value}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Control console */}
      <div className={styles.sidebar} id="hs-sidebar">
        {/* Game Stats */}
        <div className={styles.gameStatsGroup}>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gameStats.score}</div>
            <div className={styles.lbl}>Total Points</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gameStats.highScore}</div>
            <div className={styles.lbl}>Best Streak</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gameStats.losses}</div>
            <div className={styles.lbl}>Losses</div>
          </div>
        </div>

        {gameState === "lobby" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>HEX MATRIX SUDOKU CONFIG</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>CLUE RATIO</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("easy")}>EASY (10 Clues)</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("medium")}>MEDIUM (7 Clues)</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("hard")}>HARD (4 Clues)</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Quadrants Layout</span>
                <span className={styles.val}>4 x 2x2 Subgrids</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={muted} onChange={() => setMuted(!muted)} />
                  Mute Sound FX
                </label>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Boot Sudoku Matrix
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>SOLVING ANOMALY...</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Shield Power</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`${styles.shieldDot} ${idx >= lives ? styles.shieldLost : ""}`}
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: idx >= lives ? "rgba(255, 42, 109, 0.2)" : "var(--success-color)",
                        boxShadow: idx >= lives ? "none" : "0 0 8px var(--success-glow)",
                        border: idx >= lives ? "1px solid var(--error-color)" : "none"
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Hidden slots</span>
                <span className={styles.val}>
                  {grid.filter((t) => t.value === "").length} Slots
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  className={styles.deployBtn}
                  onClick={handleVerifyGrid}
                  style={{ flex: 1, padding: "12px", fontSize: "12px" }}
                >
                  VERIFY MATRIX
                </button>
                <button
                  className={styles.abandonBtn}
                  onClick={handleAbandon}
                  style={{ flex: 1, padding: "12px", fontSize: "12px", marginTop: 0 }}
                >
                  Sever Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>MATRIX RESOLUTION SUCCESS</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Sudoku alignment matches validation patterns. Grid defused successfully. Streaks updated.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Profile Setting</span>
                <span className={styles.val} style={{ textTransform: "uppercase" }}>{difficulty}</span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Sync Points Transferred</span>
                <span className={styles.val} style={{ color: "var(--success-color)", fontSize: "18px" }}>+{pointsWon}</span>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "15px" }}>
                Boot Next Matrix
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>MATRIX OVERLOAD</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Shield capacity depleted. Matrix solution crashed and locked down. win streaks have reset.
              </p>
              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Deploy Retry Code
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
              </button>
            </div>
          </div>
        )}

        {/* Global Exit */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <Link href="/" className={styles.backBtn} style={{ flex: 1, justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: "4px" }}>
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            Lobby Sector
          </Link>
          <Link href="/leaderboard" className={styles.backBtn} style={{ flex: 1, justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: "4px" }}>
              <path d="M7.5 13.5h-3v7.5h3v-7.5zm6-6h-3v13.5h3V7.5zm6 9h-3v4.5h3v-4.5z" />
            </svg>
            High Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}
