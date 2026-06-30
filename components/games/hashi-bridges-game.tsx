import React, { useState } from "react";
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

const playSound = (type: "victory" | "click" | "error" | "defeat", muted: boolean) => {
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
    } else if (type === "error") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.2);
    } else if (type === "defeat") {
      const notes = [200, 160, 120];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.03, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.03, now + idx * 0.07 + 0.02);
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

interface Island {
  id: number;
  x: number;
  y: number;
  target: number;
}

// 6 islands coordinates & values
const ISLANDS_PRESET: Island[] = [
  { id: 0, x: 60, y: 60, target: 2 },
  { id: 1, x: 260, y: 60, target: 2 },
  { id: 2, x: 60, y: 160, target: 1 },
  { id: 3, x: 160, y: 160, target: 3 },
  { id: 4, x: 260, y: 160, target: 2 },
  { id: 5, x: 160, y: 260, target: 2 }
];

export default function HashiBridgesGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  
  // Matrix representing bridges count between island i and j. Values: 0, 1, 2.
  const [bridges, setBridges] = useState<number[][]>(
    Array(6).fill(null).map(() => Array(6).fill(0))
  );
  const [selectedIslandId, setSelectedIslandId] = useState<number | null>(null);
  const [shields, setShields] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    setBridges(Array(6).fill(null).map(() => Array(6).fill(0)));
    setSelectedIslandId(null);
    setShields(3);
    setErrorMsg("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleIslandClick = (id: number) => {
    if (gameState !== "playing") return;

    playSound("click", muted);

    if (selectedIslandId === null) {
      setSelectedIslandId(id);
    } else {
      if (selectedIslandId === id) {
        setSelectedIslandId(null);
        return;
      }

      // Check alignment (only horizontal or vertical alignment allowed)
      const A = ISLANDS_PRESET[selectedIslandId];
      const B = ISLANDS_PRESET[id];

      const isAligned = A.x === B.x || A.y === B.y;
      if (!isAligned) {
        setErrorMsg("VERIFICATION WARNING: BRIDGES MUST BE STRETCHED STRAIGHT.");
        setSelectedIslandId(null);
        return;
      }

      // Toggle bridge count
      const nextBridges = bridges.map(row => [...row]);
      const currentVal = bridges[selectedIslandId][id];
      const nextVal = (currentVal + 1) % 3; // Cycle: 0 -> 1 -> 2 -> 0

      nextBridges[selectedIslandId][id] = nextVal;
      nextBridges[id][selectedIslandId] = nextVal; // Mirror symmetry

      setBridges(nextBridges);
      setSelectedIslandId(null);
      setErrorMsg("");
    }
  };

  const verifyBridges = () => {
    if (gameState !== "playing") return;

    // Check if each island target count is met
    for (let i = 0; i < 6; i++) {
      const island = ISLANDS_PRESET[i];
      let sum = 0;
      for (let j = 0; j < 6; j++) {
        sum += bridges[i][j];
      }

      if (sum !== island.target) {
        setErrorMsg(`SHIELD FAULT: ISLAND (#${i + 1}) TARGET OF ${island.target} NOT MET.`);
        handleVerifyError();
        return;
      }
    }

    // Success!
    setGameState("victory");
    playSound("victory", muted);
    const scoreReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 70;
    updateStats("hashi_bridges", scoreReward, true);
  };

  const handleVerifyError = () => {
    playSound("error", muted);
    setShields((s) => {
      const next = s - 1;
      if (next <= 0) {
        setGameState("defeat");
        playSound("defeat", muted);
        updateStats("hashi_bridges", 0, false);
      }
      return next;
    });
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>HASHI SECTOR COMPLEXITY</h2>
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
          DEPLOY BRIDGES
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Shields: <span style={{ color: "var(--error-color)" }}>{"🛡️".repeat(shields)}</span></div>
        <div>Difficulty: <span>{difficulty.toUpperCase()}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {errorMsg && (
        <div style={{
          background: "rgba(255, 42, 109, 0.1)",
          border: "1px solid var(--error-color)",
          color: "var(--error-color)",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "11px",
          fontFamily: "var(--font-display)",
          marginBottom: "15px",
          textAlign: "center",
          fontWeight: "bold",
          width: "100%"
        }}>
          {errorMsg}
        </div>
      )}

      {/* SVG Canvas for bridges & islands */}
      <svg
        width="320"
        height="320"
        style={{
          background: "#060612",
          borderRadius: "8px",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
        id="hashi-canvas"
      >
        {/* Draw bridges */}
        {ISLANDS_PRESET.map((islandA) =>
          ISLANDS_PRESET.map((islandB) => {
            // Avoid drawing twice (A < B)
            if (islandA.id >= islandB.id) return null;
            const count = bridges[islandA.id][islandB.id];
            if (count === 0) return null;

            const isSolved = gameState === "victory";
            const strokeColor = isSolved ? "var(--success-color)" : "var(--primary-color)";
            const glowShadow = isSolved ? "drop-shadow(0 0 4px var(--success-glow))" : "";

            if (count === 1) {
              return (
                <line
                  key={`bridge-${islandA.id}-${islandB.id}`}
                  x1={islandA.x}
                  y1={islandA.y}
                  x2={islandB.x}
                  y2={islandB.y}
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  style={{ filter: glowShadow }}
                />
              );
            } else {
              // Count === 2: draw two offset parallel lines
              const isH = islandA.y === islandB.y;
              const x1_a = islandA.x + (isH ? 0 : -4);
              const y1_a = islandA.y + (isH ? -4 : 0);
              const x2_a = islandB.x + (isH ? 0 : -4);
              const y2_a = islandB.y + (isH ? -4 : 0);

              const x1_b = islandA.x + (isH ? 0 : 4);
              const y1_b = islandA.y + (isH ? 4 : 0);
              const x2_b = islandB.x + (isH ? 0 : 4);
              const y2_b = islandB.y + (isH ? 4 : 0);

              return (
                <g key={`bridge-g-${islandA.id}-${islandB.id}`}>
                  <line x1={x1_a} y1={y1_a} x2={x2_a} y2={y2_a} stroke={strokeColor} strokeWidth="2.5" style={{ filter: glowShadow }} />
                  <line x1={x1_b} y1={y1_b} x2={x2_b} y2={y2_b} stroke={strokeColor} strokeWidth="2.5" style={{ filter: glowShadow }} />
                </g>
              );
            }
          })
        )}

        {/* Draw islands circles */}
        {ISLANDS_PRESET.map((island) => {
          const isSelected = selectedIslandId === island.id;
          const isSolved = gameState === "victory";

          // Calculate current connections sum to dynamically highlight correct counts
          let currentBridgesSum = 0;
          for (let j = 0; j < 6; j++) {
            currentBridgesSum += bridges[island.id][j];
          }
          const isTargetMatched = currentBridgesSum === island.target;

          let ringColor = "rgba(255,255,255,0.2)";
          if (isSelected) ringColor = "#ffffff";
          else if (isSolved || isTargetMatched) ringColor = "var(--success-color)";
          else if (currentBridgesSum > island.target) ringColor = "var(--error-color)";
          else if (currentBridgesSum > 0) ringColor = "var(--primary-color)";

          return (
            <g key={island.id} onClick={() => handleIslandClick(island.id)} style={{ cursor: "pointer" }}>
              <circle
                cx={island.x}
                cy={island.y}
                r="18"
                fill="#0a0a1f"
                stroke={ringColor}
                strokeWidth="3"
                style={{
                  filter: isSolved || isTargetMatched ? "drop-shadow(0 0 5px var(--success-glow))" : isSelected ? "drop-shadow(0 0 6px #ffffff)" : ""
                }}
              />
              <text
                x={island.x}
                y={island.y + 5}
                fill={ringColor}
                textAnchor="middle"
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: "var(--font-display)",
                  userSelect: "none"
                }}
              >
                {island.target}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button onClick={verifyBridges} className={styles.btnAction}>
          VERIFY BRIDGES
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>BRIDGES ESTABLISHED</span>
            <p className={styles.winText}>
              All island connection bridge weights matched administrative logs.
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
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>BRIDGES FAILED</span>
            <p className={styles.winText}>
              Too many failed line validation requests compiled. Loop locked.
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
