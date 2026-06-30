import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./firewall-defuse-style.module.sass";

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (type: "victory" | "defeat" | "click", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "victory") {
      const notes = [329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });
    } else if (type === "defeat") {
      const notes = [196, 174, 130];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    }
  } catch (e) {
    console.error("Synthesizer sound playback failed:", e);
  }
};

export default function FirewallDefuseGame() {
  const { stats, updateStats } = useAuth();
  const gameStats = stats.games.firewall_defuse || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  // Setup options
  const [gridSize, setGridSize] = useState<number>(3); // 3x3 Easy
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");

  // Grid state
  const [grid, setGrid] = useState<boolean[]>([]); // true = active (red), false = defused (green)
  const [movesTaken, setMovesTaken] = useState<number>(0);
  const [maxMoves, setMaxMoves] = useState<number>(15);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1.0);
  const [pointsWon, setPointsWon] = useState<number>(0);

  const applySettings = (diff: "easy" | "medium" | "hard", size: number) => {
    setDifficulty(diff);
    setGridSize(size);
    if (diff === "easy") {
      setScoreMultiplier(1.0);
      setMaxMoves(15);
    } else if (diff === "medium") {
      setScoreMultiplier(1.5);
      setMaxMoves(20);
    } else {
      setScoreMultiplier(2.0);
      setMaxMoves(30);
    }
  };

  const handleDifficultySelection = (diff: "easy" | "medium" | "hard") => {
    if (diff === "easy") applySettings(diff, 3);
    else if (diff === "medium") applySettings(diff, 4);
    else applySettings(diff, 5);
  };

  // Scramble and solve generators
  const startNewMission = () => {
    initAudio();
    setMovesTaken(0);
    setGameState("playing");
    setPointsWon(0);

    const size = gridSize;
    const totalTiles = size * size;
    const tempGrid = new Array(totalTiles).fill(false); // start solved

    // Scramble: simulate clicking random buttons (toggling symmetric states)
    const clicksToPerform = difficulty === "easy" ? 6 : difficulty === "medium" ? 12 : 18;
    for (let k = 0; k < clicksToPerform; k++) {
      const targetIdx = Math.floor(Math.random() * totalTiles);
      toggleGridNode(tempGrid, targetIdx, size);
    }

    // Edge case: if already solved after scrambling, force at least one node to toggle
    if (tempGrid.every((val) => !val)) {
      tempGrid[0] = true;
      tempGrid[1] = true;
    }

    setGrid(tempGrid);
  };

  // State toggler helper
  const toggleGridNode = (arr: boolean[], index: number, size: number) => {
    const r = Math.floor(index / size);
    const c = index % size;

    // Toggle self
    arr[index] = !arr[index];

    // Toggle UP
    if (r > 0) arr[index - size] = !arr[index - size];
    // Toggle DOWN
    if (r < size - 1) arr[index + size] = !arr[index + size];
    // Toggle LEFT
    if (c > 0) arr[index - 1] = !arr[index - 1];
    // Toggle RIGHT
    if (c < size - 1) arr[index + 1] = !arr[index + 1];
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing") return;

    playSynthSound("click", muted);
    const updatedGrid = [...grid];
    toggleGridNode(updatedGrid, index, gridSize);
    setGrid(updatedGrid);

    const newMoves = movesTaken + 1;
    setMovesTaken(newMoves);

    // Win condition check: all nodes false (defused)
    const allDefused = updatedGrid.every((val) => !val);

    if (allDefused) {
      setGameState("victory");
      playSynthSound("victory", muted);
      
      const basePoints = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      const totalPoints = Math.round(basePoints * scoreMultiplier);
      setPointsWon(totalPoints);
      updateStats("firewall_defuse", totalPoints, true);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
    } else if (newMoves >= maxMoves) {
      setGameState("defeat");
      playSynthSound("defeat", muted);
      updateStats("firewall_defuse", 0, false);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
    }
  };

  const handleAbandon = () => {
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("firewall_defuse", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  return (
    <div className={styles.playArea} id="fd-play-area">
      {/* Lights out grid */}
      <div className={styles.gameGridWrapper} id="fd-grid-wrapper">
        {gameState === "lobby" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="var(--primary-color)" style={{ filter: "drop-shadow(0 0 15px var(--primary-glow))" }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--primary-color)", margin: 0 }}>SECURITY PROTOCOL</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", maxWidth: "450px", margin: 0 }}>
              Defuse the firewall nodes. Toggling a node flips the status of itself and its orthogonal neighbors. Extinguish all red alerts to clear grid path.
            </p>
          </div>
        ) : (
          <div
            className={styles.gameGrid}
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
            id="fd-game-grid"
          >
            {grid.map((val, idx) => (
              <button
                key={idx}
                className={`${styles.tile} ${val ? styles.tileActive : styles.tileInactive}`}
                onClick={() => handleTileClick(idx)}
                aria-label={`Node ${idx}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Control console */}
      <div className={styles.sidebar} id="fd-sidebar">
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
            <div className={styles.title}>DEFUSE PARAMETERS</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>GRID SCALE</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("easy")}>3x3 EASY</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("medium")}>4x4 MEDIUM</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("hard")}>5x5 HARD</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Max Operations Allowed</span>
                <span className={styles.val}>{maxMoves}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Sync Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={muted} onChange={() => setMuted(!muted)} />
                  Mute Audio FX
                </label>
              </div>

              <button className={styles.deployBtn} onClick={startNewMission} style={{ marginTop: "10px" }}>
                Compile Firewall Grid
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>OVERRIDING SECURITY NODE</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Complexity Scale</span>
                <span className={styles.val} style={{ textTransform: "uppercase" }}>{gridSize}x{gridSize} ({difficulty})</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Dispatched Operations</span>
                <span className={styles.val} style={{ color: movesTaken > maxMoves * 0.8 ? "var(--error-color)" : "#fff" }}>
                  {movesTaken} / {maxMoves}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Active Alert Nodes</span>
                <span className={styles.val} style={{ color: "var(--error-color)" }}>
                  {grid.filter(Boolean).length} Alerts
                </span>
              </div>

              <button className={styles.abandonBtn} onClick={handleAbandon} style={{ marginTop: "15px" }}>
                Sever Override Matrix
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>FIREWALL BYPASS COMPLETE</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                All nodes successfully defused. Network gateway access granted. Streaking progress logged.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Complexity Profile</span>
                <span className={styles.val} style={{ textTransform: "uppercase" }}>{difficulty}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Moves Dispatched</span>
                <span className={styles.val}>{movesTaken}</span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Sync Points Transferred</span>
                <span className={styles.val} style={{ color: "var(--success-color)", fontSize: "18px" }}>+{pointsWon}</span>
              </div>

              <button className={styles.deployBtn} onClick={startNewMission} style={{ marginTop: "15px" }}>
                Decrypt Next Node
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Return to Parameters
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>GRID DEFUSE FAILED</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Maximum operations exceeded. Firewall triggered secondary lockout flags. Streaks reset.
              </p>
              <button className={styles.deployBtn} onClick={startNewMission} style={{ marginTop: "10px" }}>
                Re-Deploy Bypass code
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
              </button>
            </div>
          </div>
        )}

        {/* Global Exit Navigation */}
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
