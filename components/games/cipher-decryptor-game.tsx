import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./cipher-decryptor-style.module.sass";

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (type: "victory" | "defeat" | "click" | "submit", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "submit") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "victory") {
      const notes = [523.25, 659.25, 783.99, 1046.50];
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
    } else if (type === "defeat") {
      const notes = [220, 196, 160];
      notes.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    }
  } catch (e) {
    console.error("Synthesizer sound playback failed:", e);
  }
};

const HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

interface Attempt {
  guess: string[];
  correct: number;
  present: number;
}

export default function CipherDecryptorGame() {
  const { stats, updateStats } = useAuth();
  const gameStats = stats.games.cipher_decryptor || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  // Setup options
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");

  // Game states
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const [activeGuess, setActiveGuess] = useState<string[]>(["0", "0", "0", "0"]);
  const [attemptsList, setAttemptsList] = useState<Attempt[]>([]);

  // Limits
  const [maxAttempts, setMaxAttempts] = useState<number>(10);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1.0);
  const [pointsWon, setPointsWon] = useState<number>(0);

  const handleDifficultySelection = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    if (diff === "easy") {
      setScoreMultiplier(1.0);
      setMaxAttempts(10);
    } else if (diff === "medium") {
      setScoreMultiplier(1.5);
      setMaxAttempts(8);
    } else {
      setScoreMultiplier(2.0);
      setMaxAttempts(6);
    }
  };

  const startMission = () => {
    initAudio();
    setGameState("playing");
    setAttemptsList([]);
    setPointsWon(0);
    setActiveGuess(["0", "0", "0", "0"]);

    // Generate random secret code
    const code: string[] = [];
    for (let i = 0; i < 4; i++) {
      const randChar = HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
      code.push(randChar);
    }
    setSecretCode(code);
  };

  const handleBoxClick = (idx: number) => {
    if (gameState !== "playing") return;

    playSynthSound("click", muted);
    const updatedGuess = [...activeGuess];
    const currCharIdx = HEX_CHARS.indexOf(activeGuess[idx]);
    const nextCharIdx = (currCharIdx + 1) % HEX_CHARS.length;
    updatedGuess[idx] = HEX_CHARS[nextCharIdx];
    setActiveGuess(updatedGuess);
  };

  const handleSubmitGuess = () => {
    if (gameState !== "playing") return;

    playSynthSound("submit", muted);

    // Evaluate matching clues
    let correct = 0;
    let present = 0;

    const secretCopy: (string | null)[] = [...secretCode];
    const guessCopy: (string | null)[] = [...activeGuess];

    // Find correct positions
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        correct++;
        secretCopy[i] = null;
        guessCopy[i] = null;
      }
    }

    // Find matching letters in incorrect spots
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] !== null) {
        const matchIdx = secretCopy.indexOf(guessCopy[i]);
        if (matchIdx !== -1) {
          present++;
          secretCopy[matchIdx] = null;
        }
      }
    }

    const nextAttempt: Attempt = {
      guess: [...activeGuess],
      correct,
      present
    };

    const newAttempts = [...attemptsList, nextAttempt];
    setAttemptsList(newAttempts);

    // Check Win/Loss
    if (correct === 4) {
      setGameState("victory");
      playSynthSound("victory", muted);
      
      const basePoints = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      const totalPoints = Math.round(basePoints * scoreMultiplier);
      setPointsWon(totalPoints);
      updateStats("cipher_decryptor", totalPoints, true);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
    } else if (newAttempts.length >= maxAttempts) {
      setGameState("defeat");
      playSynthSound("defeat", muted);
      updateStats("cipher_decryptor", 0, false);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
    }
  };

  const handleAbandon = () => {
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("cipher_decryptor", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  return (
    <div className={styles.playArea} id="cd-play-area">
      {/* Historical Attempts Panel */}
      <div className={styles.gameGridWrapper} id="cd-grid-wrapper">
        <div className={styles.attemptsFeed} id="cd-attempts-feed">
          {attemptsList.length === 0 && (
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", fontFamily: "var(--font-display)", textAlign: "center", margin: "auto" }}>
              TERMINAL STANDBY. ENTER ANOMALY ATTEMPT GUESSE.
            </div>
          )}
          {attemptsList.map((att, idx) => (
            <div key={idx} className={styles.feedRow}>
              <span className={styles.guessCode}>{att.guess.join(" ")}</span>
              <div className={styles.markers}>
                {att.correct > 0 && <span className={styles.markerCorrect}>{att.correct} LCK</span>}
                {att.present > 0 && <span className={styles.markerPresent}>{att.present} ALT</span>}
                {att.correct === 0 && att.present === 0 && (
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>MISALIGNED</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input guess row */}
        {gameState === "playing" && (
          <div className={styles.inputArea} id="cd-input-area">
            <div className={styles.characterGrid}>
              {activeGuess.map((char, idx) => (
                <button
                  key={idx}
                  className={styles.charBox}
                  onClick={() => handleBoxClick(idx)}
                  aria-label={`Character slot ${idx}`}
                >
                  {char}
                </button>
              ))}
            </div>
            <button className={styles.submitBtn} onClick={handleSubmitGuess}>
              DECRYPT
            </button>
          </div>
        )}
      </div>

      {/* Control Console */}
      <div className={styles.sidebar} id="cd-sidebar">
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
            <div className={styles.title}>CIPHER CODETEST PROFILE</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>ATTEMPTS BUFFER</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("easy")}>EASY (10 Tries)</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("medium")}>MEDIUM (8 Tries)</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("hard")}>HARD (6 Tries)</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Complexity Character Space</span>
                <span className={styles.val}>HEX (0-F)</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={muted} onChange={() => setMuted(!muted)} />
                  Mute Sound FX
                </label>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "10px" }}>
                Boot Decryption Matrix
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>DECRYPTION LOG</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Remaining Buffers</span>
                <span className={styles.val} style={{ color: maxAttempts - attemptsList.length <= 2 ? "var(--error-color)" : "#fff" }}>
                  {maxAttempts - attemptsList.length} / {maxAttempts} Attempts
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Clue Format</span>
                <span className={styles.val}>LCK = Correct, ALT = Present</span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", marginTop: "10px" }}>
                Tip: Click on each slot to cycle hex values.
              </p>

              <button className={styles.abandonBtn} onClick={handleAbandon} style={{ marginTop: "15px" }}>
                Sever Decrypt Matrix
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>DECRYPTION TERMINATED SUCCESS</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Hex code successfully solved. Firewall cipher defused. Streaks cached.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Passcode</span>
                <span className={styles.val} style={{ letterSpacing: "2px", color: "var(--success-color)" }}>{secretCode.join(" ")}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Attempts Logged</span>
                <span className={styles.val}>{attemptsList.length}</span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Sync Points Transferred</span>
                <span className={styles.val} style={{ color: "var(--success-color)", fontSize: "18px" }}>+{pointsWon}</span>
              </div>

              <button className={styles.deployBtn} onClick={startMission} style={{ marginTop: "15px" }}>
                Decrypt Next Cipher
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Return to Config
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>SYS DECRYPT FAILURE</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Attempts exhausted. Anomaly code locked and shifted. win streaks have reset.
              </p>
              <div className={styles.statRow} style={{ marginBottom: "10px" }}>
                <span className={styles.label}>Passcode Solution</span>
                <span className={styles.val} style={{ letterSpacing: "2px", color: "var(--error-color)" }}>{secretCode.join(" ")}</span>
              </div>
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
