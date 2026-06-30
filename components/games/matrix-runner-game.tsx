import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./matrix-runner-style.module.sass";

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (type: "victory" | "defeat" | "eat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === "eat") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "victory") {
      const notes = [440, 554.37, 659.25, 880]; // A Major scale
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "triangle";
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
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.3);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.error("Synthesizer sound playback failed:", e);
  }
};

type Point = { x: number; y: number };

export default function MatrixRunnerGame() {
  const { stats, updateStats } = useAuth();
  const gameStats = stats.games.matrix_runner || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup options
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");

  // Game configuration
  const [packetsCompiled, setPacketsCompiled] = useState<number>(0);
  const [targetPackets, setTargetPackets] = useState<number>(8); // compile goal
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1.0);
  const [pointsWon, setPointsWon] = useState<number>(0);

  // Loop references
  const gameLoopRef = useRef<number | null>(null);
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Point>({ x: 0, y: 0 }); // start static until keypress
  const foodRef = useRef<Point>({ x: 5, y: 5 });

  const handleDifficultySelection = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    if (diff === "easy") {
      setScoreMultiplier(1.0);
      setTargetPackets(8);
    } else if (diff === "medium") {
      setScoreMultiplier(1.5);
      setTargetPackets(12);
    } else {
      setScoreMultiplier(2.0);
      setTargetPackets(16);
    }
  };

  const startMission = () => {
    initAudio();
    setGameState("playing");
    setPacketsCompiled(0);
    setPointsWon(0);

    // Initial positioning
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = { x: 0, y: 0 }; // static at start
    spawnFood();
  };

  const spawnFood = () => {
    const cols = 20;
    const rows = 20;
    let foundSafe = false;
    let rx = 0;
    let ry = 0;

    while (!foundSafe) {
      rx = Math.floor(Math.random() * cols);
      ry = Math.floor(Math.random() * rows);
      // Ensure food doesn't spawn on snake body
      const hitsBody = snakeRef.current.some((segment) => segment.x === rx && segment.y === ry);
      if (!hitsBody) foundSafe = true;
    }
    foodRef.current = { x: rx, y: ry };
  };

  // Input controller
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      const key = e.key;
      let dx = directionRef.current.x;
      let dy = directionRef.current.y;

      if ((key === "ArrowUp" || key === "w" || key === "W") && dy === 0) {
        dx = 0;
        dy = -1;
        e.preventDefault();
      } else if ((key === "ArrowDown" || key === "s" || key === "S") && dy === 0) {
        dx = 0;
        dy = 1;
        e.preventDefault();
      } else if ((key === "ArrowLeft" || key === "a" || key === "A") && dx === 0) {
        dx = -1;
        dy = 0;
        e.preventDefault();
      } else if ((key === "ArrowRight" || key === "d" || key === "D") && dx === 0) {
        dx = 1;
        dy = 0;
        e.preventDefault();
      }

      directionRef.current = { x: dx, y: dy };
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Main Canvas Render Loop
  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 20;
    let lastTime = 0;

    const loopSpeed = difficulty === "easy" ? 180 : difficulty === "medium" ? 130 : 90;

    const gameTick = (time: number) => {
      gameLoopRef.current = requestAnimationFrame(gameTick);

      const delta = time - lastTime;
      if (delta < loopSpeed) return;
      lastTime = time;

      const dx = directionRef.current.x;
      const dy = directionRef.current.y;

      // Skip movement logic if snake is static (start state)
      if (dx === 0 && dy === 0) {
        drawGrid(ctx, canvas.width, canvas.height, gridSize);
        return;
      }

      // Move head
      const head = snakeRef.current[0];
      const newHead = { x: head.x + dx, y: head.y + dy };

      // Wall collision check
      if (newHead.x < 0 || newHead.x >= 20 || newHead.y < 0 || newHead.y >= 20) {
        handleGameOver();
        return;
      }

      // Self collision check
      const hitsSelf = snakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y);
      if (hitsSelf) {
        handleGameOver();
        return;
      }

      // Add new head
      snakeRef.current.unshift(newHead);

      // Food collision check
      const eatsFood = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
      if (eatsFood) {
        playSynthSound("eat", muted);
        const compiled = packetsCompiled + 1;
        setPacketsCompiled(compiled);

        if (compiled >= targetPackets) {
          handleVictory();
          return;
        }

        spawnFood();
      } else {
        // Remove tail if didn't eat
        snakeRef.current.pop();
      }

      drawGrid(ctx, canvas.width, canvas.height, gridSize);
    };

    const drawGrid = (cCtx: CanvasRenderingContext2D, w: number, h: number, size: number) => {
      const tileW = w / size;
      const tileH = h / size;

      cCtx.clearRect(0, 0, w, h);

      // Draw cyber mesh lines
      cCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      cCtx.lineWidth = 1;
      for (let i = 0; i <= size; i++) {
        cCtx.beginPath();
        cCtx.moveTo(i * tileW, 0);
        cCtx.lineTo(i * tileW, h);
        cCtx.stroke();

        cCtx.beginPath();
        cCtx.moveTo(0, i * tileH);
        cCtx.lineTo(w, i * tileH);
        cCtx.stroke();
      }

      // Draw glowing food packet
      cCtx.fillStyle = "var(--primary-color)";
      cCtx.shadowBlur = 12;
      cCtx.shadowColor = "var(--primary-glow)";
      cCtx.beginPath();
      cCtx.rect(foodRef.current.x * tileW + 2, foodRef.current.y * tileH + 2, tileW - 4, tileH - 4);
      cCtx.fill();

      // Draw Snake body
      cCtx.shadowBlur = 8;
      cCtx.shadowColor = "rgba(0, 230, 118, 0.4)";
      snakeRef.current.forEach((seg, idx) => {
        // gradient color head -> tail
        if (idx === 0) {
          cCtx.fillStyle = "var(--success-color)";
        } else {
          cCtx.fillStyle = `rgba(0, 230, 118, ${1.0 - (idx / snakeRef.current.length) * 0.6})`;
        }
        cCtx.beginPath();
        cCtx.rect(seg.x * tileW + 1, seg.y * tileH + 1, tileW - 2, tileH - 2);
        cCtx.fill();
      });

      // Clear shadow properties
      cCtx.shadowBlur = 0;
    };

    const handleVictory = () => {
      cancelAnimationFrame(gameLoopRef.current!);
      setGameState("victory");
      playSynthSound("victory", muted);

      const basePoints = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      const totalPoints = Math.round(basePoints * scoreMultiplier);
      setPointsWon(totalPoints);
      updateStats("matrix_runner", totalPoints, true);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
    };

    const handleGameOver = () => {
      cancelAnimationFrame(gameLoopRef.current!);
      setGameState("defeat");
      playSynthSound("defeat", muted);
      updateStats("matrix_runner", 0, false);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
    };

    gameLoopRef.current = requestAnimationFrame(gameTick);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, packetsCompiled, targetPackets, scoreMultiplier, difficulty, muted]);

  const handleAbandon = () => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("matrix_runner", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  return (
    <div className={styles.playArea} id="mr-play-area">
      {/* Canvas screen */}
      <div className={styles.gameGridWrapper} id="mr-grid-wrapper">
        {gameState === "lobby" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="var(--primary-color)" style={{ filter: "drop-shadow(0 0 15px var(--primary-glow))" }}>
              <path d="M22 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2zM4 6h16v12H4V6z" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--primary-color)", margin: 0 }}>MATRIX RUNNER</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", maxWidth: "450px", margin: 0 }}>
              Use arrow keys or WASD to navigate. Collect flashing cyan packets to compile your datastream. Avoid boundaries and self-collision to defuse the memory core.
            </p>
          </div>
        ) : (
          <canvas ref={canvasRef} width="400" height="400" className={styles.canvas} id="mr-game-canvas" />
        )}
      </div>

      {/* Control console */}
      <div className={styles.sidebar} id="mr-sidebar">
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
            <div className={styles.title}>RUNNER CONFIG</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>COMPILATION TARGETS</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("easy")}>EASY (8 Nodes)</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("medium")}>MEDIUM (12 Nodes)</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("hard")}>HARD (16 Nodes)</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Processor Speed</span>
                <span className={styles.val}>{difficulty === "easy" ? "Standard" : difficulty === "medium" ? "Fast" : "Overclocked"}</span>
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

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Launch Data Stream
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>COMPILING DATASTREAM...</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Goal</span>
                <span className={styles.val}>{targetPackets} Packets</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Compiled</span>
                <span className={styles.val} style={{ color: "var(--success-color)" }}>
                  {packetsCompiled} / {targetPackets} Nodes
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", marginTop: "10px" }}>
                Tip: Press Arrow Keys or WASD to steer the light stream.
              </p>

              <button className={styles.abandonBtn} onClick={handleAbandon} style={{ marginTop: "15px" }}>
                Sever Stream Connection
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>ANOMALY OVERWRITE COMPLETE</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Data packet compilation succeeded. System override loaded. Streak scores updated.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Profile</span>
                <span className={styles.val} style={{ textTransform: "uppercase" }}>{difficulty}</span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Sync Points Transferred</span>
                <span className={styles.val} style={{ color: "var(--success-color)", fontSize: "18px" }}>+{pointsWon}</span>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "15px" }}>
                Run Next Anomaly
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>STREAM COLLISION</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Boundary breach or self-collision detected. Stream connection dropped. Streaks reset.
              </p>
              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Retry Data Stream
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Matrix
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
