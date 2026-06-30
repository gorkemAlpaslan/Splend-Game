import React, { useState, useEffect, useRef, useCallback } from "react";
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

const playSound = (type: "victory" | "click" | "clear" | "defeat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "clear") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.15);
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
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.03, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const COLS = 10;
const ROWS = 15;

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L
  [[1, 1], [1, 1]], // O
  [[0, 1, 1], [1, 1, 0]] // S
];

const BLOCK_COLORS = [
  "transparent",
  "#00d2ff", // I - Cyan
  "#d500f9", // T - Magenta
  "#ff9100", // L - Orange
  "#ffd54f", // O - Yellow
  "#00e676"  // S - Green
];

export default function BlockMatchTetrisGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [board, setBoard] = useState<number[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
  );
  
  const [currentPiece, setCurrentPiece] = useState<number[][]>([]);
  const [pieceColorIdx, setPieceColorIdx] = useState<number>(1);
  const [pieceX, setPieceX] = useState<number>(0);
  const [pieceY, setPieceY] = useState<number>(0);

  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getTargetLines = () => {
    return difficulty === "easy" ? 3 : difficulty === "medium" ? 6 : 10;
  };

  const spawnPiece = (tempBoard: number[][]) => {
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    const piece = SHAPES[shapeIdx];
    const colorIdx = shapeIdx + 1;
    const startX = Math.floor((COLS - piece[0].length) / 2);
    const startY = 0;

    // Check collision right at spawn (loss)
    if (checkCollision(piece, startX, startY, tempBoard)) {
      setGameState("defeat");
      playSound("defeat", muted);
      updateStats("block_match_tetris", 0, false);
      return;
    }

    setCurrentPiece(piece);
    setPieceColorIdx(colorIdx);
    setPieceX(startX);
    setPieceY(startY);
  };

  const startNewGame = () => {
    const freshBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    setBoard(freshBoard);
    setLinesCleared(0);
    setGameState("playing");
    spawnPiece(freshBoard);
  };

  const checkCollision = (piece: number[][], x: number, y: number, currentBoard: number[][]) => {
    for (let r = 0; r < piece.length; r++) {
      for (let c = 0; c < piece[r].length; c++) {
        if (piece[r][c] !== 0) {
          const boardX = x + c;
          const boardY = y + r;

          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return true;
          }
          if (boardY >= 0 && currentBoard[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const lockPiece = useCallback(() => {
    const nextBoard = board.map((row) => [...row]);

    for (let r = 0; r < currentPiece.length; r++) {
      for (let c = 0; c < currentPiece[r].length; c++) {
        if (currentPiece[r][c] !== 0) {
          const boardY = pieceY + r;
          const boardX = pieceX + c;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            nextBoard[boardY][boardX] = pieceColorIdx;
          }
        }
      }
    }

    // Check line clears
    let cleared = 0;
    const filteredBoard = nextBoard.filter((row) => {
      const isSolid = row.every((val) => val !== 0);
      if (isSolid) cleared++;
      return !isSolid;
    });

    while (filteredBoard.length < ROWS) {
      filteredBoard.unshift(Array(COLS).fill(0));
    }

    setBoard(filteredBoard);

    let nextClearedCount = linesCleared;
    if (cleared > 0) {
      playSound("clear", muted);
      nextClearedCount = linesCleared + cleared;
      setLinesCleared(nextClearedCount);
    } else {
      playSound("click", muted);
    }

    // Verify victory target line clear count
    const target = getTargetLines();
    if (nextClearedCount >= target) {
      setGameState("victory");
      playSound("victory", muted);
      const pointsReward = difficulty === "easy" ? 25 : difficulty === "medium" ? 50 : 85;
      updateStats("block_match_tetris", pointsReward, true);
      return;
    }

    spawnPiece(filteredBoard);
  }, [board, currentPiece, pieceX, pieceY, pieceColorIdx, linesCleared, difficulty, muted]);

  const movePiece = useCallback((dx: number, dy: number) => {
    if (gameState !== "playing" || currentPiece.length === 0) return;

    if (!checkCollision(currentPiece, pieceX + dx, pieceY + dy, board)) {
      setPieceX((x) => x + dx);
      setPieceY((y) => y + dy);
      playSound("click", muted);
    } else if (dy > 0) {
      // If moving down hit collision, lock the piece
      lockPiece();
    }
  }, [board, currentPiece, pieceX, pieceY, gameState, lockPiece, muted]);

  const rotatePiece = () => {
    if (gameState !== "playing" || currentPiece.length === 0) return;

    // Rotate matrix 90 deg clockwise
    const nextPiece = Array(currentPiece[0].length).fill(null).map((_, cIdx) =>
      Array(currentPiece.length).fill(null).map((__, rIdx) =>
        currentPiece[currentPiece.length - 1 - rIdx][cIdx]
      )
    );

    if (!checkCollision(nextPiece, pieceX, pieceY, board)) {
      setCurrentPiece(nextPiece);
      playSound("click", muted);
    }
  };

  // Falling ticks loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const speed = difficulty === "easy" ? 900 : difficulty === "medium" ? 650 : 400;
    gameIntervalRef.current = setInterval(() => {
      movePiece(0, 1);
    }, speed);

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [movePiece, gameState, difficulty]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        movePiece(-1, 0);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        movePiece(1, 0);
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        movePiece(0, 1);
      } else if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") {
        e.preventDefault();
        rotatePiece();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, movePiece]);

  // Render combined grid containing locked board blocks + currently active falling piece blocks
  const renderCombinedGrid = () => {
    const displayBoard = board.map((row) => [...row]);

    if (gameState === "playing" && currentPiece.length > 0) {
      for (let r = 0; r < currentPiece.length; r++) {
        for (let c = 0; c < currentPiece[r].length; c++) {
          if (currentPiece[r][c] !== 0) {
            const boardY = pieceY + r;
            const boardX = pieceX + c;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              displayBoard[boardY][boardX] = pieceColorIdx;
            }
          }
        }
      }
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 22px)`,
          gridTemplateRows: `repeat(${ROWS}, 22px)`,
          gap: "2px",
          background: "#04040c",
          padding: "8px",
          borderRadius: "8px",
          border: "2px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="tetris-board"
      >
        {displayBoard.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                background: BLOCK_COLORS[val],
                border: val > 0 ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.01)",
                borderRadius: "3px",
                boxShadow: val > 0 ? `0 0 4px ${BLOCK_COLORS[val]}` : ""
              }}
            />
          ))
        )}
      </div>
    );
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>COMPILER STACK LEVEL</h2>
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
              {d === "easy" ? "3 LINES (EASY)" : d === "medium" ? "6 LINES (MED)" : "10 LINES (HARD)"}
            </button>
          ))}
        </div>
        <button onClick={startNewGame} className={styles.btnAction}>
          ENGAGE BUFFER
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Lines: <span>{linesCleared} / {getTargetLines()}</span></div>
        <div>Target: <span>CLEAR ROWS</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {renderCombinedGrid()}

      {/* On-screen control buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }} id="tetris-controls">
        <button onClick={() => movePiece(-1, 0)} className={styles.btnAction} style={{ padding: "8px 16px" }}>◀</button>
        <button onClick={rotatePiece} className={styles.btnAction} style={{ padding: "8px 16px" }}>ROTATE</button>
        <button onClick={() => movePiece(0, 1)} className={styles.btnAction} style={{ padding: "8px 16px" }}>▼</button>
        <button onClick={() => movePiece(1, 0)} className={styles.btnAction} style={{ padding: "8px 16px" }}>▶</button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Re-Deploy Board
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>BUFFER CLEARED</span>
            <p className={styles.winText}>
              All lines cleared successfully. Compiling sequence complete.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Terminal
            </Link>
          </div>
        </div>
      )}

      {gameState === "defeat" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal} style={{ borderColor: "var(--error-color)", boxShadow: "0 0 25px var(--error-glow)" }}>
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>BUFFER OVERFLOW</span>
            <p className={styles.winText}>
              Active stack blocks exceeded board capacity lines. Encryption lock enabled.
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
