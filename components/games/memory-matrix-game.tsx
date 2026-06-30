import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./memory-matrix-style.module.sass";

// Synthesized sound effects engine using browser Web Audio API
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (
  type: "click" | "correct" | "incorrect" | "nextlevel" | "victory" | "defeat",
  muted: boolean
) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    switch (type) {
      case "click": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case "correct": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now); // A5

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
      case "incorrect": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.25);

        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(250, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case "nextlevel": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case "victory": {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major high arpeggio
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
        break;
      }
      case "defeat": {
        const notes = [220.00, 196.00, 174.61, 146.83]; // descending bass lines
        notes.forEach((freq, idx) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          const filter = audioCtx!.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(220, now + idx * 0.12);

          gain.gain.setValueAtTime(0.0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx!.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.4);
        });
        break;
      }
    }
  } catch (e) {
    console.error("Audio FX synthesizer failed:", e);
  }
};

export default function MemoryMatrixGame() {
  const { stats, updateStats } = useAuth();
  const mmStats = stats.games.memory_matrix || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  // Setup options
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);

  // Runtime states
  const [gameState, setGameState] = useState<"lobby" | "countdown" | "study" | "play" | "victory" | "defeat">("lobby");
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [gridWidth, setGridWidth] = useState<number>(3);
  const [lives, setLives] = useState<number>(3);
  const [countdown, setCountdown] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [pointsWon, setPointsWon] = useState<number>(0);
  
  // Matrices lists
  const [targetIndices, setTargetIndices] = useState<number[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);

  // Score multiplier
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1.0);

  // Timers references
  const studyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute stats based on level & difficulty
  const getLevelConfig = (lvl: number, diff: "easy" | "medium" | "hard") => {
    let width = 3;
    let targets = 3;
    let flashDuration = 1200;

    if (diff === "easy") {
      flashDuration = 1500;
      if (lvl <= 2) {
        width = 3;
        targets = 2 + lvl; // 3, 4
      } else if (lvl <= 5) {
        width = 4;
        targets = 2 + lvl; // 5, 6, 7
      } else if (lvl <= 8) {
        width = 5;
        targets = lvl; // 6, 7, 8
      } else {
        width = 5;
        targets = 9;
      }
    } else if (diff === "medium") {
      flashDuration = 1200;
      if (lvl <= 2) {
        width = 3;
        targets = 2 + lvl; // 3, 4
      } else if (lvl <= 4) {
        width = 4;
        targets = 2 + lvl; // 5, 6
      } else if (lvl <= 6) {
        width = 5;
        targets = 2 + lvl; // 7, 8
      } else if (lvl <= 8) {
        width = 6;
        targets = lvl + 1; // 8, 9
      } else {
        width = 6;
        targets = lvl; // 9, 10
      }
    } else {
      // Hard mode
      flashDuration = 800;
      if (lvl === 1) {
        width = 4;
        targets = 5;
      } else if (lvl <= 3) {
        width = 4;
        targets = 4 + lvl; // 6, 7
      } else if (lvl <= 5) {
        width = 5;
        targets = 4 + lvl; // 8, 9
      } else if (lvl <= 7) {
        width = 6;
        targets = 4 + lvl; // 10, 11
      } else if (lvl <= 9) {
        width = 6;
        targets = 4 + lvl; // 12, 13
      } else {
        width = 7;
        targets = 14;
      }
    }

    return { width, targets, flashDuration };
  };

  const handleDifficultySelection = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    if (diff === "easy") setScoreMultiplier(1.0);
    else if (diff === "medium") setScoreMultiplier(1.5);
    else setScoreMultiplier(2.0);
  };

  // Launch game session
  const startNewGame = () => {
    initAudio();
    setLives(3);
    setScore(0);
    setCurrentLevel(1);
    launchLevel(1, difficulty);
  };

  // Launch specific level
  const launchLevel = (lvl: number, diff: "easy" | "medium" | "hard") => {
    const config = getLevelConfig(lvl, diff);
    setGridWidth(config.width);
    setSelectedIndices([]);
    setWrongIndices([]);

    // Select random unique targets
    const totalTiles = config.width * config.width;
    const indices: number[] = [];
    while (indices.length < config.targets) {
      const randIdx = Math.floor(Math.random() * totalTiles);
      if (!indices.includes(randIdx)) {
        indices.push(randIdx);
      }
    }
    setTargetIndices(indices);

    // 1. Start Countdown phase
    setGameState("countdown");
    setCountdown("3");
    playSynthSound("click", muted);

    let count = 3;
    const cdInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(String(count));
        playSynthSound("click", muted);
      } else if (count === 0) {
        setCountdown("SCAN COGNITIVE...");
        playSynthSound("click", muted);
      } else {
        clearInterval(cdInterval);
        
        // 2. Start Memorize Study Phase
        setGameState("study");
        studyTimerRef.current = setTimeout(() => {
          // 3. Start Play phase
          setGameState("play");
        }, config.flashDuration);
      }
    }, 700);
  };

  // Handle tile click
  const handleTileClick = (idx: number) => {
    if (gameState !== "play") return;

    // Do nothing if already selected correctly or incorrectly
    if (selectedIndices.includes(idx) || wrongIndices.includes(idx)) return;

    const isCorrect = targetIndices.includes(idx);

    if (isCorrect) {
      playSynthSound("correct", muted);
      const newSelected = [...selectedIndices, idx];
      setSelectedIndices(newSelected);

      // Check if all correct tiles are revealed
      if (newSelected.length === targetIndices.length) {
        handleLevelCleared();
      }
    } else {
      playSynthSound("incorrect", muted);
      setWrongIndices([...wrongIndices, idx]);
      const nextLives = lives - 1;
      setLives(nextLives);

      // Check if no lives left
      if (nextLives <= 0) {
        handleGameOver();
      }
    }
  };

  const handleLevelCleared = () => {
    // Award level points visually
    const pointsGained = Math.round(currentLevel * 10 * scoreMultiplier);
    const newScore = score + pointsGained;
    setScore(newScore);

    if (currentLevel >= 10) {
      // Game Complete!
      setGameState("victory");
      playSynthSound("victory", muted);
      
      // Calculate balanced points matching positive negative (1 for easy, 2 for medium, 3 for hard * multiplier)
      const basePoints = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      const finalPoints = Math.round(basePoints * scoreMultiplier);
      setPointsWon(finalPoints);
      updateStats("memory_matrix", finalPoints, true);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
    } else {
      // Advance to next level
      playSynthSound("nextlevel", muted);
      setGameState("study"); // short transition delay
      setTimeout(() => {
        const nextLvl = currentLevel + 1;
        setCurrentLevel(nextLvl);
        launchLevel(nextLvl, difficulty);
      }, 1000);
    }
  };

  const handleGameOver = () => {
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("memory_matrix", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  const handleAbandon = () => {
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("memory_matrix", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  useEffect(() => {
    return () => {
      if (studyTimerRef.current) clearTimeout(studyTimerRef.current);
    };
  }, []);

  return (
    <div className={styles.playArea} id="mm-play-area">
      {/* Left side: Grid Display */}
      <div className={styles.gameGridWrapper} id="mm-grid-wrapper">
        {gameState === "lobby" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="var(--primary-color)" style={{ filter: "drop-shadow(0 0 15px var(--primary-glow))" }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--primary-color)", margin: 0 }}>COGNITIVE DECRYPTOR</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", maxWidth: "450px", margin: 0 }}>
              Test your matrix recollection limit. Memorize the glowing sector locations, lock them in, and decrypt successive sectors to complete the matrix test sequence.
            </p>
          </div>
        ) : gameState === "countdown" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center", alignItems: "center" }}>
            <span style={{ fontSize: "12px", letterSpacing: "2px", color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>PREPARING SCANNER</span>
            <h1 style={{ fontSize: "36px", color: "var(--primary-color)", fontFamily: "var(--font-display)", margin: 0, textShadow: "0 0 12px var(--primary-glow)" }}>
              {countdown}
            </h1>
          </div>
        ) : (
          <div
            className={styles.gameGrid}
            style={{
              gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
              gridTemplateRows: `repeat(${gridWidth}, 1fr)`
            }}
            id="mm-game-grid"
          >
            {Array.from({ length: gridWidth * gridWidth }).map((_, idx) => {
              const isActive = gameState === "study" && targetIndices.includes(idx);
              const isCorrect = gameState === "play" && selectedIndices.includes(idx);
              const isIncorrect = gameState === "play" && wrongIndices.includes(idx);

              const tileClass = 
                isActive ? styles.tileActive :
                isCorrect ? styles.tileCorrect :
                isIncorrect ? styles.tileIncorrect :
                "";
              
              const isDisabled = gameState !== "play" ? styles.tileDisabled : "";

              return (
                <button
                  key={idx}
                  className={`${styles.tile} ${tileClass} ${isDisabled}`}
                  onClick={() => handleTileClick(idx)}
                  disabled={gameState !== "play"}
                  aria-label={`Grid element ${idx}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Right side: Control Center */}
      <div className={styles.sidebar} id="mm-sidebar">
        {/* Game Stats Widget */}
        <div className={styles.gameStatsGroup}>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{mmStats.score}</div>
            <div className={styles.lbl}>Total Points</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{mmStats.highScore}</div>
            <div className={styles.lbl}>Best Streak</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{mmStats.losses}</div>
            <div className={styles.lbl}>Losses</div>
          </div>
        </div>

        {/* State Dashboards */}
        {gameState === "lobby" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>COGNITIVE DIFFICULTY</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>GRID SPEEDS</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("easy")}>EASY</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("medium")}>MEDIUM</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("hard")}>HARD</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Initial Matrix Size</span>
                <span className={styles.val}>
                  {difficulty === "hard" ? "4 x 4" : "3 x 3"}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Study Scanner Window</span>
                <span className={styles.val}>
                  {difficulty === "easy" ? "1.5s" : difficulty === "medium" ? "1.2s" : "0.8s"}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={muted} onChange={() => setMuted(!muted)} />
                  Mute Audio FX
                </label>
              </div>

              <button className={styles.deployBtn} onClick={startNewGame} style={{ marginTop: "10px" }}>
                Initialize Cognition
              </button>
            </div>
          </div>
        )}

        {(gameState === "countdown" || gameState === "study" || gameState === "play") && (
          <div className={styles.infoCard}>
            <div className={styles.title}>NETWORK COHERENCE</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Lobe Level</span>
                <span className={styles.val} style={{ color: "var(--primary-color)" }}>{currentLevel} / 10</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Target Sector Keys</span>
                <span className={styles.val}>
                  {targetIndices.length} Nodes
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Shield Capacity</span>
                <div className={styles.shieldContainer}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`${styles.shieldDot} ${idx >= lives ? styles.shieldLost : ""}`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Acquired Score</span>
                <span className={styles.val} style={{ color: "var(--success-color)" }}>{score} Pts</span>
              </div>

              <button className={styles.abandonBtn} onClick={handleAbandon} style={{ marginTop: "15px" }}>
                Terminate Signal
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>COGNITIVE CLEAR</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Decryption grid mastered! Cognitive recall score verified. Synced with global leaderboards.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Parameters</span>
                <span className={styles.val} style={{ textTransform: "uppercase" }}>{difficulty}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Levels Completed</span>
                <span className={styles.val}>10 / 10</span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Points Secured</span>
                <span className={styles.val} style={{ color: "var(--success-color)", fontSize: "18px" }}>+{pointsWon}</span>
              </div>

              <button className={styles.deployBtn} onClick={startNewGame} style={{ marginTop: "15px" }}>
                Decrypt Next Matrix
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Main Panel
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>SHIELD COLLAPSE</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                System lockouts active. Shields collapsed at Level {currentLevel}. High score registers at {score} points.
              </p>
              <button className={styles.deployBtn} onClick={startNewGame} style={{ marginTop: "10px" }}>
                Deploy Retry Code
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Matrix
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
