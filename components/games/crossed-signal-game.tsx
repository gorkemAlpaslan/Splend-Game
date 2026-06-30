import React, { useState, useEffect, useRef } from "react";
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
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "reset") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.12);
    } else if (type === "victory") {
      const notes = [329.63, 392.00, 523.25, 659.25, 783.99]; // C major chord high
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

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
}

// Math segments intersection check helpers
const ccw = (A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }) => {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
};

const doIntersect = (
  A: { x: number; y: number },
  B: { x: number; y: number },
  C: { x: number; y: number },
  D: { x: number; y: number }
) => {
  // Exclude lines sharing same endpoints
  if (A.x === C.x && A.y === C.y) return false;
  if (A.x === D.x && A.y === D.y) return false;
  if (B.x === C.x && B.y === C.y) return false;
  if (B.x === D.x && B.y === D.y) return false;

  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
};

const PRESETS = {
  easy: {
    nodes: [
      { id: 0, x: 100, y: 100 },
      { id: 1, x: 250, y: 100 },
      { id: 2, x: 100, y: 250 },
      { id: 3, x: 250, y: 250 }
    ],
    edges: [
      { from: 0, to: 3 },
      { from: 1, to: 2 },
      { from: 0, to: 1 },
      { from: 2, to: 3 }
    ]
  },
  medium: {
    nodes: [
      { id: 0, x: 175, y: 70 },
      { id: 1, x: 80, y: 160 },
      { id: 2, x: 270, y: 160 },
      { id: 3, x: 120, y: 260 },
      { id: 4, x: 230, y: 260 }
    ],
    edges: [
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 2 },
      { from: 1, to: 4 },
      { from: 2, to: 3 },
      { from: 3, to: 4 }
    ]
  },
  hard: {
    nodes: [
      { id: 0, x: 175, y: 60 },
      { id: 1, x: 70, y: 130 },
      { id: 2, x: 280, y: 130 },
      { id: 3, x: 70, y: 230 },
      { id: 4, x: 280, y: 230 },
      { id: 5, x: 175, y: 300 }
    ],
    edges: [
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 5 },
      { from: 2, to: 5 },
      { from: 1, to: 4 },
      { from: 2, to: 3 },
      { from: 0, to: 5 },
      { from: 1, to: 2 },
      { from: 3, to: 4 }
    ]
  }
};

export default function CrossedSignalGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory">("lobby");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [intersections, setIntersections] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const containerRef = useRef<SVGSVGElement | null>(null);

  const startNewGame = () => {
    const preset = PRESETS[difficulty];
    // Copy nodes and add slight random offset to scatter them
    const scrambledNodes = preset.nodes.map((n) => ({
      ...n,
      x: n.x + (Math.random() - 0.5) * 40,
      y: n.y + (Math.random() - 0.5) * 40
    }));

    setNodes(scrambledNodes);
    setEdges(preset.edges);
    setGameState("playing");
    playSound("reset", muted);
  };

  // Run collision intersection verification whenever nodes translate
  useEffect(() => {
    if (gameState !== "playing" || nodes.length === 0) return;

    let crossCount = 0;
    // Compare every edge pair
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const e1 = edges[i];
        const e2 = edges[j];

        const nodeA1 = nodes.find(n => n.id === e1.from)!;
        const nodeA2 = nodes.find(n => n.id === e1.to)!;
        const nodeB1 = nodes.find(n => n.id === e2.from)!;
        const nodeB2 = nodes.find(n => n.id === e2.to)!;

        if (doIntersect(nodeA1, nodeA2, nodeB1, nodeB2)) {
          crossCount++;
        }
      }
    }

    setIntersections(crossCount);

    if (crossCount === 0 && nodes.length > 0) {
      setGameState("victory");
      playSound("victory", muted);
      const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 65;
      updateStats("crossed_signal", pointsReward, true);
    }
  }, [nodes, edges, gameState, difficulty, muted]);

  const handleMouseDown = (nodeId: number) => {
    if (gameState !== "playing") return;
    setActiveDragId(nodeId);
    playSound("click", muted);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (activeDragId === null || !containerRef.current) return;

    const svg = containerRef.current;
    const rect = svg.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      // Touch events support
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert coordinates matching SVG viewport
    const x = ((clientX - rect.left) / rect.width) * 350;
    const y = ((clientY - rect.top) / rect.height) * 350;

    // Clamp coordinates inside box
    const clampedX = Math.max(20, Math.min(330, x));
    const clampedY = Math.max(20, Math.min(330, y));

    setNodes(nodes.map(n => n.id === activeDragId ? { ...n, x: clampedX, y: clampedY } : n));
  };

  const handleMouseUp = () => {
    setActiveDragId(null);
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>SIGNAL COMPLEXITY</h2>
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
          UNTANGLE SIGNALS
        </button>
      </div>
    );
  }

  const isSolved = gameState === "victory";

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Crossings: <span style={{ color: intersections > 0 ? "var(--error-color)" : "var(--success-color)" }}>{intersections}</span></div>
        <div>Signal Status: <span>{isSolved ? "INTEGRITY SECURED" : "INTERFERING"}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {/* SVG Canvas Board */}
      <svg
        ref={containerRef}
        width="350"
        height="350"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{
          background: "#060610",
          border: "1px solid var(--glass-border)",
          borderRadius: "8px",
          touchAction: "none",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="crossed-signal-canvas"
      >
        {/* Draw edges lines */}
        {edges.map((edge, idx) => {
          const n1 = nodes.find(n => n.id === edge.from)!;
          const n2 = nodes.find(n => n.id === edge.to)!;
          if (!n1 || !n2) return null;

          return (
            <line
              key={idx}
              x1={n1.x}
              y1={n1.y}
              x2={n2.x}
              y2={n2.y}
              stroke={isSolved ? "var(--success-color)" : "rgba(0, 210, 255, 0.4)"}
              strokeWidth="2.5"
              style={{
                filter: isSolved ? "drop-shadow(0 0 4px var(--success-glow))" : ""
              }}
            />
          );
        })}

        {/* Draw draggable vertices nodes */}
        {nodes.map((node) => {
          const isDragging = activeDragId === node.id;
          return (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r="12"
              fill={isSolved ? "var(--success-color)" : isDragging ? "#ffffff" : "var(--primary-color)"}
              stroke="#ffffff"
              strokeWidth="2"
              style={{
                cursor: "pointer",
                filter: `drop-shadow(0 0 6px ${isSolved ? "var(--success-glow)" : "var(--primary-glow)"})`
              }}
              onMouseDown={() => handleMouseDown(node.id)}
              onTouchStart={() => handleMouseDown(node.id)}
            />
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Coordinates
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {isSolved && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>SIGNAL UNTANGLED</span>
            <p className={styles.winText}>
              All lines of intersection have been resolved. Encryption stream is stabilized.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Terminal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
