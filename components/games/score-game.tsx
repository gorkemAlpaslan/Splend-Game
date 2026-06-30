import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./score-game-style.module.sass";

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
  type: "click" | "positive" | "negative" | "undo" | "victory" | "defeat",
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
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case "undo": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case "positive": {
        const notes = [293.66, 329.63, 392.00, 523.25]; // D4, E4, G4, C5
        notes.forEach((freq, idx) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          gain.gain.setValueAtTime(0.0, now + idx * 0.04);
          gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.04 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

          osc.connect(gain);
          gain.connect(audioCtx!.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.18);
        });
        break;
      }
      case "negative": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.22);

        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case "victory": {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
        let timeAcc = 0;
        notes.forEach((freq, idx) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + timeAcc);

          gain.gain.setValueAtTime(0.0, now + timeAcc);
          gain.gain.linearRampToValueAtTime(0.08, now + timeAcc + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + timeAcc + 0.25);

          osc.connect(gain);
          gain.connect(audioCtx!.destination);
          osc.start(now + timeAcc);
          osc.stop(now + timeAcc + 0.25);

          timeAcc += 0.07;
        });
        break;
      }
      case "defeat": {
        const notes = [196.00, 185.00, 164.81]; // G3, F#3, E3 sad slides
        notes.forEach((freq, idx) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          osc.frequency.linearRampToValueAtTime(freq - 25, now + idx * 0.12 + 0.25);

          const filter = audioCtx!.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(280, now);

          gain.gain.setValueAtTime(0.06, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx!.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.3);
        });
        break;
      }
    }
  } catch (e) {
    console.error("Web Audio error:", e);
  }
};

const ScoreGame: React.FC<{}> = () => {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(16);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [radarEnabled, setRadarEnabled] = useState<boolean>(true);

  const [score, setScore] = useState<number>(0);
  const [cancelLeft, setCancelLeft] = useState<number>(10);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Stats aliases mapped from AuthContext
  const { stats, updateStats } = useAuth();
  const pnStats = stats.games.positive_negative || { score: 0, losses: 0, winStreak: 0, highScore: 0 };
  const totalWin = pnStats.score;
  const totalLose = pnStats.losses;
  const winStreak = pnStats.winStreak;
  const highScore = pnStats.highScore;

  const [grid, setGrid] = useState<{ value: number; effect: number }[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [positive, setPositive] = useState<{ count: number; value: number }>({
    count: 0,
    value: 0,
  });

  const getNeighborInfo = (idx: number) => {
    if (idx < 0 || idx >= grid.length) return { sum: 0, positiveCount: 0, negativeCount: 0, zeroCount: 0 };
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    let sum = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let zeroCount = 0;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          const neighborIdx = r * gridSize + c;
          const effect = grid[neighborIdx]?.effect || 0;
          sum += effect;
          if (effect > 0) positiveCount++;
          else if (effect < 0) negativeCount++;
          else zeroCount++;
        }
      }
    }
    return { sum, positiveCount, negativeCount, zeroCount };
  };

  const hoveredNeighborInfo = hoveredIndex !== null ? getNeighborInfo(hoveredIndex) : { sum: 0, positiveCount: 0, negativeCount: 0, zeroCount: 0 };

  const getSizeMultiplier = (size: number) => {
    if (size === 12) return 0.8;
    if (size === 20) return 1.3;
    return 1.0;
  };

  const getDiffMultiplier = (diff: string) => {
    if (diff === "easy") return 1.0;
    if (diff === "hard") return 2.0;
    return 1.5;
  };

  const getRadarMultiplier = (enabled: boolean) => {
    return enabled ? 1.0 : 2.0;
  };

  const getMultiplier = () => {
    return getSizeMultiplier(gridSize) * getDiffMultiplier(difficulty) * getRadarMultiplier(radarEnabled);
  };

  const getMaxCloses = (diff: string) => {
    if (diff === "easy") return 12;
    if (diff === "hard") return 5;
    return 8;
  };

  const [negative, setNegative] = useState<{ count: number; value: number }>({
    count: 0,
    value: 0,
  });

  const [goalEasy, setGoalEasy] = useState<number>(0);
  const [goalMedium, setGoalMedium] = useState<number>(0);
  const [goalHard, setGoalHard] = useState<number>(0);
  const [currentRetreat, SetCurrentRetreat] = useState<number>(0);

  // Initialize values (mute settings only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("splend_muted");
      if (savedMute) setIsMuted(savedMute === "true");
    }
  }, []);

  const calculateSum = (currentGrid: { value: number; effect: number }[], level: number) => {
    let posSum = 0;
    let negSum = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    for (let i = 0; i < currentGrid.length; i++) {
      if (currentGrid[i].effect > 0) {
        posSum += currentGrid[i].effect;
        positiveCount++;
      } else if (currentGrid[i].effect < 0) {
        negSum += currentGrid[i].effect;
        negativeCount++;
      }
    }
    // Decide if targets are positive or negative based on average grid composition
    if (posSum + negSum >= 0) {
      return positiveCount > 0 ? (posSum / positiveCount) * level : level;
    } else {
      return negativeCount > 0 ? (negSum / negativeCount) * level : -level;
    }
  };

  const generateNewGrid = (size = gridSize, diff = difficulty) => {
    const totalCells = size * size;
    let range = 9;
    let offset = 4;
    if (diff === "easy") {
      range = 7;
      offset = 3;
    } else if (diff === "hard") {
      range = 11;
      offset = 5;
    }

    const tempGrid = Array(totalCells)
      .fill(0)
      .map(() => ({
        value: 0,
        effect: Math.floor(Math.random() * range) - offset,
      }));

    const easy = calculateSum(tempGrid, 10);
    const med = calculateSum(tempGrid, 20);
    const hard = calculateSum(tempGrid, 30);

    setGrid(tempGrid);
    setScore(0);
    setCancelLeft(getMaxCloses(diff));
    setPositive({ count: 0, value: 0 });
    setNegative({ count: 0, value: 0 });
    setGoalEasy(easy);
    setGoalMedium(med);
    setGoalHard(hard);
    SetCurrentRetreat(0);
  };

  const startGameHandler = () => {
    generateNewGrid(gridSize, difficulty);
    setGameStarted(true);
  };

  const getHighestTierReached = (currentScore: number, easy: number, medium: number, hard: number) => {
    if (easy > 0) {
      if (currentScore >= hard) return 3;
      if (currentScore >= medium) return 2;
      if (currentScore >= easy) return 1;
    } else if (easy < 0) {
      if (currentScore <= hard) return 3;
      if (currentScore <= medium) return 2;
      if (currentScore <= easy) return 1;
    }
    return 0;
  };

  const handleClick = (index: number) => {
    const newGrid = [...grid];
    const isClosing = newGrid[index].value === 1;

    // Trigger audio & status
    if (isClosing) {
      if (cancelLeft <= 0) return; // Cannot close if out of cancel rights
      newGrid[index].value = 0;
      setCancelLeft((prev) => prev - 1);
      playSynthSound("undo", isMuted);
    } else {
      newGrid[index].value = 1;
      const val = newGrid[index].effect;
      if (val > 0) playSynthSound("positive", isMuted);
      else if (val < 0) playSynthSound("negative", isMuted);
      else playSynthSound("click", isMuted);
    }

    setGrid(newGrid);

    // Calculate score & count details
    let newScore = 0;
    let pos = { count: 0, value: 0 };
    let neg = { count: 0, value: 0 };

    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i].value === 1) {
        const effect = newGrid[i].effect;
        newScore += effect;
        if (effect > 0) {
          pos.count++;
          pos.value += effect;
        } else if (effect < 0) {
          neg.count++;
          neg.value += effect;
        }
      }
    }

    setScore(newScore);
    setPositive(pos);
    setNegative(neg);
  };

  const retreatHandler = () => {
    const tier = getHighestTierReached(score, goalEasy, goalMedium, goalHard);
    if (tier > 0) {
      playSynthSound("victory", isMuted);
      recordWin(tier);
      generateNewGrid();
    }
  };

  const resetHandler = () => {
    // Manuel reset only allowed if player has used half or fewer of their closes
    const limit = Math.floor(getMaxCloses(difficulty) / 2);
    if (cancelLeft > limit) {
      generateNewGrid();
      playSynthSound("undo", isMuted);
    }
  };

  const recordWin = (points: number) => {
    const mult = getMultiplier();
    const finalPoints = Math.round(points * mult);
    updateStats("positive_negative", finalPoints, true);
  };

  const recordLoss = () => {
    updateStats("positive_negative", 0, false);
  };

  // Monitor end of round conditions
  useEffect(() => {
    if (grid.length === 0) return;

    const tier = getHighestTierReached(score, goalEasy, goalMedium, goalHard);
    SetCurrentRetreat(tier);

    // If closes run out, immediately process round results
    if (cancelLeft === 0) {
      if (tier > 0) {
        playSynthSound("victory", isMuted);
        recordWin(tier);
      } else {
        playSynthSound("defeat", isMuted);
        recordLoss();
      }
      generateNewGrid();
    }
  }, [score, cancelLeft]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("splend_muted", String(next));
      return next;
    });
  };

  // Target ranges & percentage offsets for progress bars
  const maxGoalVal = Math.max(Math.abs(goalEasy), Math.abs(goalMedium), Math.abs(goalHard), 40);
  const getPercent = (value: number) => {
    return Math.min(Math.max((Math.abs(value) / maxGoalVal) * 100, 0), 100);
  };

  const scoreSign = goalEasy >= 0 ? 1 : -1;
  const isEasyReached = scoreSign * score >= scoreSign * goalEasy;
  const isMedReached = scoreSign * score >= scoreSign * goalMedium;
  const isHardReached = scoreSign * score >= scoreSign * goalHard;

  if (!gameStarted) {
    const currentMultiplier = (getSizeMultiplier(gridSize) * getDiffMultiplier(difficulty) * getRadarMultiplier(radarEnabled)).toFixed(1);

    return (
      <div className={styles.setupContainer}>
        <div className={styles.setupCard}>
          <h1 className={styles.setupTitle}>GRID PARAMETERS SETUP</h1>
          <p className={styles.setupSubtitle}>Configure the dimensional boundaries and sensory limits of the grid anomaly before deployment.</p>

          <div className={styles.optionsWrapper}>
            {/* Grid Size Selection */}
            <div className={styles.optionGroup}>
              <span className={styles.groupLabel}>SECTOR DIMENSIONS</span>
              <div className={styles.optionCards}>
                <div
                  className={`${styles.optionCard} ${gridSize === 12 ? styles.activeOption : ""}`}
                  onClick={() => setGridSize(12)}
                >
                  <span className={styles.optionValue}>12 x 12</span>
                  <span className={styles.optionLabel}>Small (0.8x Mult)</span>
                </div>
                <div
                  className={`${styles.optionCard} ${gridSize === 16 ? styles.activeOption : ""}`}
                  onClick={() => setGridSize(16)}
                >
                  <span className={styles.optionValue}>16 x 16</span>
                  <span className={styles.optionLabel}>Standard (1.0x Mult)</span>
                </div>
                <div
                  className={`${styles.optionCard} ${gridSize === 20 ? styles.activeOption : ""}`}
                  onClick={() => setGridSize(20)}
                >
                  <span className={styles.optionValue}>20 x 20</span>
                  <span className={styles.optionLabel}>Large (1.3x Mult)</span>
                </div>
              </div>
            </div>

            {/* Anomaly Severity (Difficulty) */}
            <div className={styles.optionGroup}>
              <span className={styles.groupLabel}>ANOMALY SEVERITY</span>
              <div className={styles.optionCards}>
                <div
                  className={`${styles.optionCard} ${difficulty === "easy" ? styles.activeOption : ""}`}
                  onClick={() => setDifficulty("easy")}
                >
                  <span className={styles.optionValue}>KOLAY</span>
                  <span className={styles.optionLabel}>Range [-3, +3] (1.0x)</span>
                </div>
                <div
                  className={`${styles.optionCard} ${difficulty === "medium" ? styles.activeOption : ""}`}
                  onClick={() => setDifficulty("medium")}
                >
                  <span className={styles.optionValue}>ORTA</span>
                  <span className={styles.optionLabel}>Range [-4, +4] (1.5x)</span>
                </div>
                <div
                  className={`${styles.optionCard} ${difficulty === "hard" ? styles.activeOption : ""}`}
                  onClick={() => setDifficulty("hard")}
                >
                  <span className={styles.optionValue}>ZOR</span>
                  <span className={styles.optionLabel}>Range [-5, +5] (2.0x)</span>
                </div>
              </div>
            </div>

            {/* Radar Sensor Setup */}
            <div className={styles.optionGroup}>
              <span className={styles.groupLabel}>PROXIMITY RADAR SENSOR</span>
              <div className={styles.optionCards}>
                <div
                  className={`${styles.optionCard} ${radarEnabled ? styles.activeOption : ""}`}
                  onClick={() => setRadarEnabled(true)}
                >
                  <span className={styles.optionValue}>ENABLED</span>
                  <span className={styles.optionLabel}>Radar active (1.0x)</span>
                </div>
                <div
                  className={`${styles.optionCard} ${!radarEnabled ? styles.activeOption : ""}`}
                  onClick={() => setRadarEnabled(false)}
                >
                  <span className={styles.optionValue}>DISABLED</span>
                  <span className={styles.optionLabel}>Radar off (2.0x)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Point Multiplier Badge */}
          <div className={styles.multiplierBadgeContainer}>
            <div className={styles.multiplierBadge}>
              <span className={styles.badgeLabel}>ESTIMATED REWARD MULTIPLIER</span>
              <span className={styles.multiplierVal}>{currentMultiplier}x</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button className={styles.launchButton} style={{ flex: 2 }} onClick={() => startGameHandler()}>
              LAUNCH MISSION
            </button>
            <Link
              href="/"
              className={styles.launchButton}
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                fontSize: "12px"
              }}
            >
              EXIT LOBBY
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.playArea}>
      <div className={styles.gameGridWrapper}>
        <div
          className={styles.gameGrid}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`
          }}
        >
          {grid.map((cell, index) => {
            const isOpened = cell.value === 1;
            const cellNeighbor = getNeighborInfo(index);
            let cellClass = styles.gameGridButtons;

            if (isOpened) {
              if (cell.effect > 0) cellClass += ` ${styles.gameGridItemActive}`;
              else if (cell.effect < 0) cellClass += ` ${styles.gameGridItemNegative}`;
              else cellClass += ` ${styles.gameGridItemZero}`;
            }

            const isHovered = hoveredIndex === index;
            const cellStyle = (isHovered && radarEnabled) ? {
              borderColor: cellNeighbor.sum > 0 ? "var(--success-color)" : cellNeighbor.sum < 0 ? "var(--error-color)" : "var(--neutral-color)",
              boxShadow: cellNeighbor.sum > 0 ? "0 0 15px var(--success-glow)" : cellNeighbor.sum < 0 ? "0 0 15px var(--error-glow)" : "0 0 15px var(--neutral-glow)",
              zIndex: 10
            } : undefined;

            return (
              <div
                key={index}
                className={cellClass}
                style={cellStyle}
                onClick={() => handleClick(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isOpened ? (
                  <>
                    <span className={styles.effectText}>
                      {cell.effect > 0 ? `+${cell.effect}` : cell.effect}
                    </span>
                    {radarEnabled && (
                      <span className={`${styles.neighborSumClue} ${cellNeighbor.sum > 0 ? styles.scorePos : cellNeighbor.sum < 0 ? styles.scoreNeg : ""}`}>
                        {cellNeighbor.sum > 0 ? `+${cellNeighbor.sum}` : cellNeighbor.sum}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.gameStats}>
        {/* HUD Header */}
        <div className={styles.hudHeader}>
          <div className={styles.activeSettingsDisplay}>
            <span className={styles.settingsText}>{gridSize}x{gridSize} • {difficulty.toUpperCase()}</span>
            <span className={styles.multiplierText}>REWARDS: {getMultiplier().toFixed(1)}x</span>
          </div>

          <div className={styles.streakContainer}>
            <div className={styles.streakBadge}>
              <span className={styles.badgeLabel}>STREAK</span>
              <span className={styles.badgeValue}>{winStreak}</span>
            </div>
            <div className={styles.streakBadge}>
              <span className={styles.badgeLabel}>BEST</span>
              <span className={styles.badgeValue}>{highScore}</span>
            </div>
          </div>

          <div className={styles.soundControl} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M5.889 16H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v16.273a.5.5 0 0 1-.817.387L5.889 16zm13.517-4 2.293-2.293a1 1 0 0 0-1.414-1.414L18 10.586l-2.293-2.293a1 1 0 0 0-1.414 1.414L16.586 12l-2.293 2.293a1 1 0 0 0 1.414 1.414L18 13.414l2.293 2.293a1 1 0 0 0 1.414-1.414L19.406 12z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M5.889 16H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v16.273a.5.5 0 0 1-.817.387L5.889 16zm10.743-9.92a1 1 0 1 1 1.414-1.414c3.42 3.42 3.42 8.963 0 12.383a1 1 0 1 1-1.414-1.414c2.639-2.639 2.639-6.916 0-9.555zM14 9.17a1 1 0 1 1 1.414-1.414c1.22 1.22 1.22 3.208 0 4.428a1 1 0 1 1-1.414-1.414c.44-.44.44-1.16 0-1.6z"/>
              </svg>
            )}
          </div>
        </div>

        {/* Digital Scoreboard Readout */}
        <div className={styles.scoreDisplayContainer}>
          <div className={styles.scoreDigitalWrapper}>
            <div className={styles.scoreTitle}>CURRENT SCORE</div>
            <div className={`${styles.scoreNumber} ${score > 0 ? styles.scorePos : score < 0 ? styles.scoreNeg : ""}`}>
              {score > 0 ? `+${score}` : score}
            </div>
          </div>
          <div className={styles.targetDisplayWrapper}>
            <div className={styles.scoreTitle}>TARGETS TYPE</div>
            <div className={`${styles.targetType} ${goalEasy >= 0 ? styles.scorePos : styles.scoreNeg}`}>
              {goalEasy >= 0 ? "POSITIVE" : "NEGATIVE"}
            </div>
          </div>
        </div>

        {/* Custom Progress Bar / Slider */}
        <div className={styles.progressBarSection}>
          <div className={styles.barLabelRow}>
            <span>Negative Range</span>
            <span>Positive Range</span>
          </div>

          <div className={styles.progressTrackContainer}>
            {/* Left Track (Negative) */}
            <div className={styles.progressHalfTrack}>
              <div
                className={`${styles.fillProgress} ${styles.fillNeg}`}
                style={{ width: score < 0 ? `${getPercent(score)}%` : "0%" }}
              />
              {/* Negative Goal Indicators */}
              {goalEasy < 0 && (
                <>
                  <div
                    className={`${styles.goalMarker} ${styles.markerNeg} ${isEasyReached ? styles.markerReached : ""}`}
                    style={{ right: `${getPercent(goalEasy)}%` }}
                    title={`Easy Target: ${Math.round(goalEasy)}`}
                  >
                    <span className={styles.goalLabel}>E</span>
                  </div>
                  <div
                    className={`${styles.goalMarker} ${styles.markerNeg} ${isMedReached ? styles.markerReached : ""}`}
                    style={{ right: `${getPercent(goalMedium)}%` }}
                    title={`Medium Target: ${Math.round(goalMedium)}`}
                  >
                    <span className={styles.goalLabel}>M</span>
                  </div>
                  <div
                    className={`${styles.goalMarker} ${styles.markerNeg} ${isHardReached ? styles.markerReached : ""}`}
                    style={{ right: `${getPercent(goalHard)}%` }}
                    title={`Hard Target: ${Math.round(goalHard)}`}
                  >
                    <span className={styles.goalLabel}>H</span>
                  </div>
                </>
              )}
            </div>

            <div className={styles.centerNode} />

            {/* Right Track (Positive) */}
            <div className={styles.progressHalfTrack}>
              <div
                className={`${styles.fillProgress} ${styles.fillPos}`}
                style={{ width: score > 0 ? `${getPercent(score)}%` : "0%" }}
              />
              {/* Positive Goal Indicators */}
              {goalEasy > 0 && (
                <>
                  <div
                    className={`${styles.goalMarker} ${styles.markerPos} ${isEasyReached ? styles.markerReached : ""}`}
                    style={{ left: `${getPercent(goalEasy)}%` }}
                    title={`Easy Target: ${Math.round(goalEasy)}`}
                  >
                    <span className={styles.goalLabel}>E</span>
                  </div>
                  <div
                    className={`${styles.goalMarker} ${styles.markerPos} ${isMedReached ? styles.markerReached : ""}`}
                    style={{ left: `${getPercent(goalMedium)}%` }}
                    title={`Medium Target: ${Math.round(goalMedium)}`}
                  >
                    <span className={styles.goalLabel}>M</span>
                  </div>
                  <div
                    className={`${styles.goalMarker} ${styles.markerPos} ${isHardReached ? styles.markerReached : ""}`}
                    style={{ left: `${getPercent(goalHard)}%` }}
                    title={`Hard Target: ${Math.round(goalHard)}`}
                  >
                    <span className={styles.goalLabel}>H</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Round Information */}
        <div className={styles.targetsGrid}>
          <div className={`${styles.targetCard} ${isEasyReached ? styles.targetCardActive : ""}`}>
            <span className={styles.cardGoalTitle}>EASY TARGET</span>
            <span className={styles.cardGoalValue}>{Math.round(goalEasy)}</span>
            <span className={styles.cardStatus}>{isEasyReached ? "✓ REACHED (+1)" : "PENDING"}</span>
          </div>
          <div className={`${styles.targetCard} ${isMedReached ? styles.targetCardActive : ""}`}>
            <span className={styles.cardGoalTitle}>MED TARGET</span>
            <span className={styles.cardGoalValue}>{Math.round(goalMedium)}</span>
            <span className={styles.cardStatus}>{isMedReached ? "✓ REACHED (+2)" : "PENDING"}</span>
          </div>
          <div className={`${styles.targetCard} ${isHardReached ? styles.targetCardActive : ""}`}>
            <span className={styles.cardGoalTitle}>HARD TARGET</span>
            <span className={styles.cardGoalValue}>{Math.round(goalHard)}</span>
            <span className={styles.cardStatus}>{isHardReached ? "✓ REACHED (+3)" : "PENDING"}</span>
        </div>
      </div>

        {/* Quantum Proximity Sensor Readout */}
        <div className={styles.sensorContainer}>
          <div className={styles.sensorHeader}>
            <span className={styles.sensorTitle}>PROXIMITY RADAR SCANNER</span>
            <span className={`${styles.sensorStatus} ${(hoveredIndex !== null && radarEnabled) ? styles.sensorScanning : ""}`}>
              {(hoveredIndex !== null && radarEnabled) ? "SCANNING GRID..." : "SCANNER IDLE"}
            </span>
          </div>
          {radarEnabled ? (
            hoveredIndex !== null ? (
              <div className={styles.sensorDataRow}>
                <div className={styles.sensorStat}>
                  <span className={styles.sensorLabel}>COORDINATES</span>
                  <span className={styles.sensorValue}>R: {Math.floor(hoveredIndex / gridSize) + 1} C: {(hoveredIndex % gridSize) + 1}</span>
                </div>
                <div className={styles.sensorStat}>
                  <span className={styles.sensorLabel}>NEIGHBOR SUM</span>
                  <span className={`${styles.sensorValue} ${hoveredNeighborInfo.sum > 0 ? styles.scorePos : hoveredNeighborInfo.sum < 0 ? styles.scoreNeg : ""}`}>
                    {hoveredNeighborInfo.sum > 0 ? `+${hoveredNeighborInfo.sum}` : hoveredNeighborInfo.sum}
                  </span>
                </div>
                <div className={styles.sensorStat}>
                  <span className={styles.sensorLabel}>COMPOSITION</span>
                  <span className={styles.sensorValue}>
                    <span className={styles.scorePos}>{hoveredNeighborInfo.positiveCount}P</span>
                    <span className={styles.sensorDivider}>/</span>
                    <span className={styles.scoreNeg}>{hoveredNeighborInfo.negativeCount}N</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.sensorPlaceholder}>
                Hover over any cell on the board to scan adjacent hidden values
              </div>
            )
          ) : (
            <div className={`${styles.sensorPlaceholder} ${styles.sensorDisabled}`}>
              PROXIMITY RADAR OFFLINE (Hardcore 2.0x Multiplier Active)
            </div>
          )}
        </div>

        {/* Counters & Stats */}
        <div className={styles.bottomStatsLayout}>
          <div className={styles.statsPanel}>
            <div className={styles.statLine}>
              <span className={styles.statLabel}>Positives Count:</span>
              <span className={`${styles.statValue} ${styles.scorePos}`}>{positive.count} (+{positive.value})</span>
            </div>
            <div className={styles.statLine}>
              <span className={styles.statLabel}>Negatives Count:</span>
              <span className={`${styles.statValue} ${styles.scoreNeg}`}>{negative.count} ({negative.value})</span>
            </div>
          </div>

          <div className={styles.winLossContainer}>
            <div className={`${styles.totalScoreBadge} ${styles.winBadge}`}>
              Wins: {totalWin}
            </div>
            <div className={`${styles.totalScoreBadge} ${styles.loseBadge}`}>
              Losses: {totalLose}
            </div>
          </div>
        </div>

        {/* Close Counts & Actions */}
        <div className={styles.actionSection}>
          <div className={styles.closesMeterContainer}>
            <div className={styles.closesHeader}>
              <span>CLoSES REMAINING</span>
              <span className={cancelLeft <= Math.max(1, Math.floor(getMaxCloses(difficulty) / 3)) ? styles.closesWarning : ""}>
                {cancelLeft}/{getMaxCloses(difficulty)}
              </span>
            </div>
            <div className={styles.closesTrack}>
              {Array(getMaxCloses(difficulty))
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.closesDot} ${i < cancelLeft ? styles.dotActive : ""} ${
                      cancelLeft <= Math.max(1, Math.floor(getMaxCloses(difficulty) / 3)) ? styles.dotWarning : ""
                    }`}
                  />
                ))}
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <button
              className={`${styles.actionButton} ${currentRetreat > 0 ? styles.retreatActive : ""}`}
              onClick={retreatHandler}
              disabled={currentRetreat === 0}
            >
              <span className={styles.buttonMainText}>RETREAT NOW</span>
              {currentRetreat > 0 ? (
                <span className={styles.buttonSubText}>Secure +{currentRetreat} Points</span>
              ) : (
                <span className={styles.buttonSubText}>Reach Easy Target First</span>
              )}
            </button>

            <button
              onClick={resetHandler}
              className={styles.actionButton}
              disabled={cancelLeft <= Math.floor(getMaxCloses(difficulty) / 2)}
              title={cancelLeft <= Math.floor(getMaxCloses(difficulty) / 2) ? "Locked! Used too many closes." : "Reset Grid"}
            >
              <span className={styles.buttonMainText}>RESET GRID</span>
              <span className={styles.buttonSubText}>
                {cancelLeft <= Math.floor(getMaxCloses(difficulty) / 2) ? `Locked (Closes < ${Math.floor(getMaxCloses(difficulty) / 2) + 1})` : "Costs no points"}
              </span>
            </button>
          </div>

          <button
            onClick={() => setGameStarted(false)}
            className={`${styles.actionButton} ${styles.abortButton}`}
          >
            <span className={styles.buttonMainText}>ABORT MISSION</span>
            <span className={styles.buttonSubText}>Return to setup menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreGame;
