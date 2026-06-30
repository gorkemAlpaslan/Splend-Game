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

const playSound = (type: "victory" | "click" | "reset", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "reset") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.12);
    } else if (type === "victory") {
      const notes = [293.66, 349.23, 440.00, 587.33];
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

type PipeType = "straight" | "elbow";

interface PipeTile {
  type: PipeType;
  angle: number; // 0, 90, 180, 270 degrees
}

export default function PipeConnectGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory">("lobby");
  const [grid, setGrid] = useState<PipeTile[][]>([]);
  const [flows, setFlows] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  // Solvable pre-planned pipe structures
  const loadPresetGrid = () => {
    // 4x4 Grid layout
    const initialGrid: PipeTile[][] = [
      [
        { type: "straight", angle: 0 }, // (0,0) starts at left
        { type: "elbow", angle: 90 },
        { type: "straight", angle: 90 },
        { type: "elbow", angle: 180 }
      ],
      [
        { type: "elbow", angle: 0 },
        { type: "elbow", angle: 270 },
        { type: "straight", angle: 0 },
        { type: "straight", angle: 90 }
      ],
      [
        { type: "straight", angle: 90 },
        { type: "elbow", angle: 90 },
        { type: "elbow", angle: 180 },
        { type: "elbow", angle: 0 }
      ],
      [
        { type: "elbow", angle: 270 },
        { type: "straight", angle: 0 },
        { type: "straight", angle: 0 },
        { type: "straight", angle: 0 } // (3,3) ends at right
      ]
    ];

    // Scramble angles randomly
    const scrambled = initialGrid.map((row) =>
      row.map((tile) => {
        const angles = [0, 90, 180, 270];
        const randomAngle = angles[Math.floor(Math.random() * angles.length)];
        return { ...tile, angle: randomAngle };
      })
    );

    setGrid(scrambled);
    setMoves(0);
    setGameState("playing");
    playSound("reset", muted);
  };

  // Helper to trace pipeline connections recursively
  useEffect(() => {
    if (gameState !== "playing" || grid.length === 0) return;

    // Define flow connections for angles
    // Straight connects:
    // 0 / 180 deg: left-right
    // 90 / 270 deg: top-bottom
    // Elbow connects:
    // 0 deg: top-right
    // 90 deg: right-bottom
    // 180 deg: bottom-left
    // 270 deg: left-top

    const visited = Array(4).fill(null).map(() => Array(4).fill(false));
    
    // Check connections
    const checkConnects = (r1: number, c1: number, r2: number, c2: number, dir: "R" | "L" | "D" | "U"): boolean => {
      if (r2 < 0 || r2 >= 4 || c2 < 0 || c2 >= 4) return false;
      const t1 = grid[r1][c1];
      const t2 = grid[r2][c2];

      let t1Out = false;
      let t2In = false;

      // 1. Verify outputs direction on tile 1
      if (t1.type === "straight") {
        if (dir === "R" && (t1.angle === 0 || t1.angle === 180)) t1Out = true;
        if (dir === "L" && (t1.angle === 0 || t1.angle === 180)) t1Out = true;
        if (dir === "D" && (t1.angle === 90 || t1.angle === 270)) t1Out = true;
        if (dir === "U" && (t1.angle === 90 || t1.angle === 270)) t1Out = true;
      } else {
        if (dir === "R" && (t1.angle === 0 || t1.angle === 90)) t1Out = true;
        if (dir === "L" && (t1.angle === 180 || t1.angle === 270)) t1Out = true;
        if (dir === "D" && (t1.angle === 90 || t1.angle === 180)) t1Out = true;
        if (dir === "U" && (t1.angle === 0 || t1.angle === 270)) t1Out = true;
      }

      // 2. Verify inputs direction on tile 2
      if (t2.type === "straight") {
        if (dir === "R" && (t2.angle === 0 || t2.angle === 180)) t2In = true;
        if (dir === "L" && (t2.angle === 0 || t2.angle === 180)) t2In = true;
        if (dir === "D" && (t2.angle === 90 || t2.angle === 270)) t2In = true;
        if (dir === "U" && (t2.angle === 90 || t2.angle === 270)) t2In = true;
      } else {
        // opposite check
        if (dir === "R" && (t2.angle === 180 || t2.angle === 270)) t2In = true;
        if (dir === "L" && (t2.angle === 0 || t2.angle === 90)) t2In = true;
        if (dir === "D" && (t2.angle === 0 || t2.angle === 270)) t2In = true;
        if (dir === "U" && (t2.angle === 90 || t2.angle === 180)) t2In = true;
      }

      return t1Out && t2In;
    };

    // DFS flow tracer starting from (0,0) left side connection
    const queue: [number, number][] = [];
    const t00 = grid[0][0];
    const acceptsLeft = t00.type === "straight" ? (t00.angle === 0 || t00.angle === 180) : (t00.angle === 180 || t00.angle === 270);
    
    if (acceptsLeft) {
      queue.push([0, 0]);
      visited[0][0] = true;
    }

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      
      const shifts: [number, number, "R" | "L" | "D" | "U"][] = [
        [0, 1, "R"], [0, -1, "L"], [1, 0, "D"], [-1, 0, "U"]
      ];

      shifts.forEach(([dr, dc, dir]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
          if (!visited[nr][nc] && checkConnects(r, c, nr, nc, dir)) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      });
    }

    setFlows(visited);

    // Win condition: path flows into (3,3) and exit right is open
    const t33 = grid[3][3];
    const exitsRight = t33.type === "straight" ? (t33.angle === 0 || t33.angle === 180) : (t33.angle === 0 || t33.angle === 90);
    if (visited[3][3] && exitsRight) {
      setGameState("victory");
      playSound("victory", muted);
      const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
      updateStats("pipe_connect", pointsReward, true);
    }
  }, [grid, gameState, difficulty, muted]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    playSound("click", muted);
    const newGrid = grid.map((row) => row.map((t) => ({ ...t })));
    const currentAngle = newGrid[r][c].angle;
    // Rotate 90 degrees clockwise
    newGrid[r][c].angle = (currentAngle + 90) % 360;

    setGrid(newGrid);
    setMoves(m => m + 1);
  };

  const drawPipeSVG = (type: PipeType, angle: number, isFilled: boolean) => {
    const strokeColor = isFilled ? "var(--success-color)" : "var(--primary-color)";
    const glowShadow = isFilled ? "drop-shadow(0 0 5px var(--success-glow))" : "";

    return (
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: `rotate(${angle}deg)`, filter: glowShadow, transition: "transform 0.25s ease, filter 0.2s" }}>
        {type === "straight" ? (
          // Horizontal line
          <line x1="0" y1="24" x2="48" y2="24" stroke={strokeColor} strokeWidth="6" strokeLinecap="round" />
        ) : (
          // Curve elbow top to right
          <path d="M 24 0 A 24 24 0 0 1 48 24" fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round" />
        )}
      </svg>
    );
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>SIGNAL COILS COMPLEXITY</h2>
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
        <button onClick={loadPresetGrid} className={styles.btnAction}>
          INITIALIZE CONDUIT
        </button>
      </div>
    );
  }

  const isSolved = gameState === "victory";

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Toggles: <span>{moves}</span></div>
        <div>Flow Status: <span>{isSolved ? "CONNECTED" : "ALIGNING"}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {/* Grid container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 52px)",
          gridTemplateRows: "repeat(4, 52px)",
          gap: "6px",
          background: "#050510",
          padding: "12px",
          borderRadius: "8px",
          border: "2px solid var(--glass-border)",
          position: "relative"
        }}
        id="pipes-grid"
      >
        {/* Input indicators */}
        <span style={{ position: "absolute", left: "-18px", top: "25px", fontSize: "12px", color: flows[0]?.[0] ? "var(--success-color)" : "var(--primary-color)" }}>▶</span>
        <span style={{ position: "absolute", right: "-18px", bottom: "25px", fontSize: "12px", color: isSolved ? "var(--success-color)" : "rgba(255,255,255,0.1)" }}>▶</span>

        {grid.map((row, r) =>
          row.map((tile, c) => {
            const hasFlow = flows[r]?.[c] || false;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  background: hasFlow ? "rgba(0, 230, 118, 0.03)" : "rgba(255,255,255,0.01)",
                  border: hasFlow ? "1px solid var(--success-color)" : "1px solid var(--glass-border)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  transition: "all 0.2s ease"
                }}
              >
                {drawPipeSVG(tile.type, tile.angle, hasFlow)}
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={loadPresetGrid} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Re-Shuffle
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {isSolved && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>PIPELINE STABILIZED</span>
            <p className={styles.winText}>
              Energy conduit flow connected start indicator to target database core.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Sector
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
