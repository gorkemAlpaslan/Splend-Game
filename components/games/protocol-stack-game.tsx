import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./protocol-stack-style.module.sass";

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (type: "victory" | "defeat" | "click" | "error", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "error") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === "defeat") {
      const notes = [180, 150, 110];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    }
  } catch (e) {
    console.error("Synthesizer sound playback failed:", e);
  }
};

export default function ProtocolStackGame() {
  const { stats, updateStats } = useAuth();
  const gameStats = stats.games.protocol_stack || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  // Setup options
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");

  // Hanoi game parameters
  const [discsCount, setDiscsCount] = useState<number>(3); // 3, 4, or 5
  const [towers, setTowers] = useState<number[][]>([[], [], []]);
  const [selectedRod, setSelectedRod] = useState<number | null>(null);

  // Stats
  const [movesTaken, setMovesTaken] = useState<number>(0);
  const [maxMoves, setMaxMoves] = useState<number>(15);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1.0);
  const [pointsWon, setPointsWon] = useState<number>(0);

  const applySettings = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    if (diff === "easy") {
      setDiscsCount(3);
      setScoreMultiplier(1.0);
      setMaxMoves(15);
    } else if (diff === "medium") {
      setDiscsCount(4);
      setScoreMultiplier(1.5);
      setMaxMoves(25);
    } else {
      setDiscsCount(5);
      setScoreMultiplier(2.0);
      setMaxMoves(45);
    }
  };

  const startMission = () => {
    initAudio();
    setGameState("playing");
    setMovesTaken(0);
    setPointsWon(0);
    setSelectedRod(null);

    // Populate rod 0 in descending order
    // E.g. [5, 4, 3, 2, 1]
    const initialRod: number[] = [];
    for (let i = discsCount; i >= 1; i--) {
      initialRod.push(i);
    }
    setTowers([initialRod, [], []]);
  };

  const handleRodClick = (rodIndex: number) => {
    if (gameState !== "playing") return;

    if (selectedRod === null) {
      // Select source rod if it has discs
      if (towers[rodIndex].length > 0) {
        playSynthSound("click", muted);
        setSelectedRod(rodIndex);
      } else {
        playSynthSound("error", muted);
      }
    } else {
      // Attempting to move
      if (selectedRod === rodIndex) {
        // Deselect
        setSelectedRod(null);
        playSynthSound("click", muted);
      } else {
        const sourceRod = towers[selectedRod];
        const targetRod = towers[rodIndex];
        const discToMove = sourceRod[sourceRod.length - 1];

        // Validation rule: Hanoi rules
        const isValid = 
          targetRod.length === 0 || 
          targetRod[targetRod.length - 1] > discToMove;

        if (isValid) {
          playSynthSound("click", muted);
          const newTowers = towers.map((rod, idx) => {
            if (idx === selectedRod) {
              return rod.slice(0, -1);
            }
            if (idx === rodIndex) {
              return [...rod, discToMove];
            }
            return rod;
          });

          setTowers(newTowers);
          setSelectedRod(null);
          
          const newMoves = movesTaken + 1;
          setMovesTaken(newMoves);

          // Win check: all discs moved to last rod
          const won = newTowers[2].length === discsCount;
          if (won) {
            setGameState("victory");
            playSynthSound("victory", muted);
            
            const basePoints = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
            const totalPoints = Math.round(basePoints * scoreMultiplier);
            setPointsWon(totalPoints);
            updateStats("protocol_stack", totalPoints, true);
            window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
          } else if (newMoves >= maxMoves) {
            setGameState("defeat");
            playSynthSound("defeat", muted);
            updateStats("protocol_stack", 0, false);
            window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
          }
        } else {
          // Invalid move
          playSynthSound("error", muted);
          setSelectedRod(null);
        }
      }
    }
  };

  const handleAbandon = () => {
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("protocol_stack", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  const getDiscColor = (size: number) => {
    // 5 different bandwidth hues
    const colors = [
      "linear-gradient(90deg, #00e676 0%, #00b0ff 100%)", // size 1
      "linear-gradient(90deg, #00d2ff 0%, #0072ff 100%)", // size 2
      "linear-gradient(90deg, #9c27b0 0%, #0072ff 100%)", // size 3
      "linear-gradient(90deg, #ff9100 0%, #e64a19 100%)", // size 4
      "linear-gradient(90deg, #ff2a6d 0%, #9c27b0 100%)"  // size 5
    ];
    return colors[size - 1] || colors[0];
  };

  return (
    <div className={styles.playArea} id="ps-play-area">
      {/* Hanoi Towers Container */}
      <div className={styles.gameGridWrapper} id="ps-grid-wrapper">
        {gameState === "lobby" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="var(--primary-color)" style={{ filter: "drop-shadow(0 0 15px var(--primary-glow))" }}>
              <path d="M19 15v3H5v-3h14m2-2H3v7h18v-7zM7 5h2V3H7v2zm8 0h2V3h-2v2z" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--primary-color)", margin: 0 }}>PROTOCOL STACKER</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", maxWidth: "450px", margin: 0 }}>
              Reorganize the stack logs. Move data packets from Port A to Port C. A larger packet cannot be placed over a smaller packet. Solve within move constraints.
            </p>
          </div>
        ) : (
          <div className={styles.towersContainer} id="ps-towers-container">
            {towers.map((rod, idx) => {
              const isSelected = selectedRod === idx;
              const rodClass = isSelected ? `${styles.rod} ${styles.rodSelected}` : styles.rod;
              const rodName = idx === 0 ? "PORT A" : idx === 1 ? "PORT B" : "PORT C";

              return (
                <div
                  key={idx}
                  className={rodClass}
                  onClick={() => handleRodClick(idx)}
                  id={`rod-${idx}`}
                >
                  <div className={styles.rodLabel}>{rodName}</div>
                  
                  {rod.map((disc, dIdx) => {
                    const widthPercent = (disc / discsCount) * 85 + 15; // width dynamic scale
                    const isTopDisc = dIdx === rod.length - 1;
                    
                    return (
                      <div
                        key={dIdx}
                        className={styles.packet}
                        style={{
                          width: `${widthPercent}%`,
                          background: getDiscColor(disc),
                          boxShadow: isTopDisc && isSelected ? "0 0 12px #fff" : "none",
                          border: isTopDisc && isSelected ? "2px solid #fff" : "none"
                        }}
                      >
                        {disc} KB
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Dashboard */}
      <div className={styles.sidebar} id="ps-sidebar">
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
            <div className={styles.title}>PACKET CONFIG DECK</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>PACKET CAPACITY</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => applySettings("easy")}>EASY (3 KB)</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => applySettings("medium")}>MEDIUM (4 KB)</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => applySettings("hard")}>HARD (5 KB)</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Max Shifts Allowed</span>
                <span className={styles.val}>{maxMoves} Shifts</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={muted} onChange={() => setMuted(!muted)} />
                  Mute Audio FX
                </label>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Initiate Packet Shifts
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>SHIFTING NETWORK PACKETS</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Stack Depth</span>
                <span className={styles.val}>{discsCount} Packets</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Operations Executed</span>
                <span className={styles.val} style={{ color: movesTaken > maxMoves * 0.8 ? "var(--error-color)" : "#fff" }}>
                  {movesTaken} / {maxMoves}
                </span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Selected Buffer</span>
                <span className={styles.val} style={{ color: "var(--primary-color)" }}>
                  {selectedRod !== null ? `PORT ${selectedRod === 0 ? "A" : selectedRod === 1 ? "B" : "C"}` : "NONE"}
                </span>
              </div>

              <button className={styles.abandonBtn} onClick={handleAbandon} style={{ marginTop: "15px" }}>
                Drop Packet Stack
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>ROUTING CLEAR</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                All packets aligned correctly at Port C. Routing protocols defused. Streaks locked.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Towers Difficulty</span>
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

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "15px" }}>
                Route Next Channel
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>ROUTING TIME OUT</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Operation limits exceeded. Routing stack collapsed, resetting connection lines. Streaks reset.
              </p>
              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Deploy Retry Code
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
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
