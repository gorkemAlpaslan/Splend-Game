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
      const notes = [293.66, 329.63, 392.00, 523.25, 659.25]; // C major pentatonic
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

type Mirror = "/" | "\\" | "";

export default function LaserBounceGame() {
  const { updateStats } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory">("lobby");
  
  // 6x6 grid for laser mirrors
  const [mirrors, setMirrors] = useState<Mirror[][]>(
    Array(6).fill(null).map(() => Array(6).fill(""))
  );
  const [laserPath, setLaserPath] = useState<[number, number][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    // Generate clean grid
    const initial = Array(6).fill(null).map(() => Array(6).fill(""));
    
    // Easy starts with 2 mirrors, medium 4, hard 6 pre-placed mirrors
    const mirrorCount = difficulty === "easy" ? 2 : difficulty === "medium" ? 4 : 6;
    for (let i = 0; i < mirrorCount; i++) {
      const r = Math.floor(Math.random() * 4) + 1; // avoid core cells
      const c = Math.floor(Math.random() * 4) + 1;
      initial[r][c] = Math.random() > 0.5 ? "/" : "\\";
    }

    setMirrors(initial);
    setMoves(0);
    setGameState("playing");
    playSound("reset", muted);
  };

  // Re-calculate laser path whenever mirrors configuration changes
  useEffect(() => {
    if (gameState !== "playing") return;

    // Start coordinates: Emitter is at (0, 0), moving RIGHT
    let r = 0;
    let c = 0;
    let dr = 0;
    let dc = 1; // Moving right

    const path: [number, number][] = [[0, 0]];
    let steps = 0;

    // Max 40 bounces to prevent infinite loops on circular paths
    while (r >= 0 && r < 6 && c >= 0 && c < 6 && steps < 40) {
      const currentMirror = mirrors[r][c];

      if (currentMirror === "/") {
        // Bounce / slash
        const nextDr = -dc;
        const nextDc = -dr;
        dr = nextDr;
        dc = nextDc;
      } else if (currentMirror === "\\") {
        // Bounce \ backslash
        const nextDr = dc;
        const nextDc = dr;
        dr = nextDr;
        dc = nextDc;
      }

      r += dr;
      c += dc;
      steps++;

      // Stop if hit boundary or target
      if (r >= 0 && r < 6 && c >= 0 && c < 6) {
        path.push([r, c]);
        
        // Target receiver is at (5, 5)
        if (r === 5 && c === 5) {
          setLaserPath(path);
          setGameState("victory");
          playSound("victory", muted);
          const pointsReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 35 : 60;
          updateStats("laser_bounce", pointsReward, true);
          return;
        }
      }
    }

    setLaserPath(path);
  }, [mirrors, gameState, difficulty, muted]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing") return;
    // Emitter (0,0) and Receiver (5,5) cannot hold mirrors
    if ((r === 0 && c === 0) || (r === 5 && c === 5)) return;

    playSound("click", muted);
    const newMirrors = mirrors.map(row => [...row]);
    const current = mirrors[r][c];
    
    // Cycle mirror: empty -> / -> \ -> empty
    let nextMirror: Mirror = "";
    if (current === "") nextMirror = "/";
    else if (current === "/") nextMirror = "\\";
    else nextMirror = "";

    newMirrors[r][c] = nextMirror;
    setMirrors(newMirrors);
    setMoves(m => m + 1);
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>LASER COMPLEXITY</h2>
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
          ENGAGE LASER FIELD
        </button>
      </div>
    );
  }

  const isSolved = gameState === "victory";

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Toggles: <span>{moves}</span></div>
        <div>Target: <span>{isSolved ? "SIGNAL LINKED" : "ROUTING"}</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {/* Grid Display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 46px)",
          gridTemplateRows: "repeat(6, 46px)",
          gap: "4px",
          background: "#050510",
          padding: "10px",
          borderRadius: "8px",
          border: "2px solid var(--glass-border)",
          position: "relative"
        }}
        id="laser-grid"
      >
        {mirrors.map((row, r) =>
          row.map((val, c) => {
            const isEmitter = r === 0 && c === 0;
            const isReceiver = r === 5 && c === 5;
            
            // Check if laser beam traverses this coordinate
            const isTraversed = laserPath.some(([pr, pc]) => pr === r && pc === c);

            let bg = "rgba(255,255,255,0.02)";
            let border = "1px solid rgba(255,255,255,0.05)";
            let cellGlow = "";

            if (isEmitter) {
              bg = "rgba(0, 210, 255, 0.15)";
              border = "1px solid var(--primary-color)";
              cellGlow = "0 0 8px var(--primary-glow)";
            } else if (isReceiver) {
              bg = isSolved ? "rgba(0, 230, 118, 0.15)" : "rgba(255, 42, 109, 0.15)";
              border = isSolved ? "1px solid var(--success-color)" : "1px solid var(--error-color)";
              cellGlow = isSolved ? "0 0 8px var(--success-glow)" : "0 0 6px var(--error-glow)";
            } else if (isTraversed) {
              bg = isSolved ? "rgba(0,230,118,0.03)" : "rgba(0,210,255,0.03)";
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  background: bg,
                  border: border,
                  boxShadow: cellGlow,
                  borderRadius: "4px",
                  cursor: isEmitter || isReceiver ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: isSolved ? "var(--success-color)" : "var(--primary-color)",
                  textShadow: isSolved ? "0 0 6px var(--success-glow)" : "0 0 6px var(--primary-glow)",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.2s ease"
                }}
              >
                {isEmitter ? "E" : isReceiver ? "R" : val}
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Re-Deploy Field
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {isSolved && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>LASER COINCIDENCE</span>
            <p className={styles.winText}>
              Optical conduit signal successfully locked into target receptor database.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Receptor
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
