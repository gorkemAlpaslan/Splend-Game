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

const playSound = (type: "victory" | "slide" | "reset", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "slide") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.06);
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
      const notes = [293.66, 349.23, 440.00, 587.33]; // D minor arpeggio
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

export default function NodePathSliderGame() {
  const { updateStats } = useAuth();
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory">("lobby");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);

  // Check if a configuration is solvable in 15-puzzle logic
  const isSolvable = (arr: number[]): boolean => {
    let inversions = 0;
    const filterZeros = arr.filter(v => v !== 0);
    for (let i = 0; i < filterZeros.length; i++) {
      for (let j = i + 1; j < filterZeros.length; j++) {
        if (filterZeros[i] > filterZeros[j]) {
          inversions++;
        }
      }
    }
    // 3x3 grid solvable if inversions count is even
    return inversions % 2 === 0;
  };

  const startNewGame = () => {
    let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    
    // Shuffle loop
    const shuffleSteps = difficulty === "easy" ? 15 : difficulty === "medium" ? 40 : 100;
    
    // Programmatic shuffling by making valid slides to guarantee solvability
    let tempBoard = [...tiles];
    let emptyIdx = 8;
    for (let i = 0; i < shuffleSteps; i++) {
      const neighbors: number[] = [];
      if (emptyIdx >= 3) neighbors.push(emptyIdx - 3); // Up
      if (emptyIdx < 6) neighbors.push(emptyIdx + 3);  // Down
      if (emptyIdx % 3 > 0) neighbors.push(emptyIdx - 1); // Left
      if (emptyIdx % 3 < 2) neighbors.push(emptyIdx + 1); // Right

      const swapIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
      tempBoard[emptyIdx] = tempBoard[swapIdx];
      tempBoard[swapIdx] = 0;
      emptyIdx = swapIdx;
    }

    // fallback check
    if (!isSolvable(tempBoard) || JSON.stringify(tempBoard) === JSON.stringify(tiles)) {
      // Direct assignment of a simple solvable state
      tempBoard = [1, 2, 3, 4, 5, 0, 7, 8, 6];
    }

    setBoard(tempBoard);
    setMoves(0);
    setGameState("playing");
    playSound("reset", muted);
  };

  const handleTileClick = (idx: number) => {
    if (gameState !== "playing") return;

    const emptyIdx = board.indexOf(0);
    const validMoves = [
      emptyIdx - 1, emptyIdx + 1, emptyIdx - 3, emptyIdx + 3
    ];

    // Block wraps
    if (emptyIdx % 3 === 0 && idx === emptyIdx - 1) return;
    if (emptyIdx % 3 === 2 && idx === emptyIdx + 1) return;

    if (validMoves.includes(idx)) {
      playSound("slide", muted);
      const newBoard = [...board];
      newBoard[emptyIdx] = board[idx];
      newBoard[idx] = 0;
      setBoard(newBoard);
      setMoves(m => m + 1);

      // Verify solve state
      const solved = newBoard.slice(0, 8).every((val, index) => val === index + 1);
      if (solved) {
        setGameState("victory");
        playSound("victory", muted);
        const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
        updateStats("node_path_slider", pointsReward, true);
      }
    }
  };

  // Helper to retrieve line direction vectors on cells for graphics drawing
  const renderConduitSegment = (val: number, isSolved: boolean) => {
    const strokeColor = isSolved ? "var(--success-color)" : "var(--primary-color)";
    const glowShadow = isSolved ? "drop-shadow(0 0 5px var(--success-glow))" : "drop-shadow(0 0 3px var(--primary-glow))";
    
    // Draw neon lines based on grid numbers mapping conduits
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ filter: glowShadow, pointerEvents: "none" }}>
        {val === 1 && <path d="M0 20 H40" stroke={strokeColor} strokeWidth="3" fill="none" />}
        {val === 2 && <path d="M0 20 Q20 20 20 40" stroke={strokeColor} strokeWidth="3" fill="none" />}
        {val === 3 && <path d="M20 0 V40" stroke={strokeColor} strokeWidth="3" fill="none" />}
        {val === 4 && <path d="M20 0 Q20 20 40 20" stroke={strokeColor} strokeWidth="3" fill="none" />}
        {val === 5 && <path d="M20 40 Q20 20 0 20" stroke={strokeColor} strokeWidth="3" fill="none" />}
        {val === 6 && <path d="M20 0 Q20 20 0 20" stroke={strokeColor} strokeWidth="3" fill="none" />}
        {val === 7 && <path d="M20 40 Q20 20 40 20" stroke={strokeColor} strokeWidth="3" fill="none" />}
        {val === 8 && <path d="M0 20 H40 M20 0 V40" stroke={strokeColor} strokeWidth="3" fill="none" />}
      </svg>
    );
  };

  const isSolved = gameState === "victory";

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>SHUFFLE STEPS</h2>
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
          ENGAGE MATRIX SLIDER
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Moves: <span>{moves}</span></div>
        <div>Conduits: <span>{isSolved ? "CONNECTED" : "ALIGNING"}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      <div className={styles.sliderGrid} id="slider-grid">
        {board.map((val, idx) => {
          const isEmpty = val === 0;
          return (
            <div
              key={idx}
              onClick={() => handleTileClick(idx)}
              className={`${styles.sliderCell} ${isEmpty ? styles.sliderEmpty : ""}`}
              style={{
                borderColor: isSolved ? "var(--success-color)" : "var(--primary-color)",
                boxShadow: isSolved ? "0 0 10px var(--success-glow)" : "",
                flexDirection: "column",
                gap: "2px"
              }}
            >
              {!isEmpty && (
                <>
                  <span style={{ fontSize: "10px", opacity: 0.5 }}>{val}</span>
                  {renderConduitSegment(val, isSolved)}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Re-Shuffle
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {isSolved && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>CONDUIT ESTABLISHED</span>
            <p className={styles.winText}>
              All optical node lines have been sorted. Neon energy flow is fully operational.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Channel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
