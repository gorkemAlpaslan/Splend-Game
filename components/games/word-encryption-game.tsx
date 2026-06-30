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

const playSound = (type: "victory" | "click" | "incorrect" | "defeat", muted: boolean) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === "click") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === "incorrect") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === "defeat") {
      const notes = [150, 120, 90];
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
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
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

const SECRET_WORDS = [
  "CYBER", "PROXY", "PORTS", "STACK", "TOKEN",
  "SHELL", "PATCH", "ROBOT", "LOGIC", "CODES",
  "INDEX", "NODES", "ENTER", "KEYS", "LASER",
  "ROUTE", "SOLVE", "FIBER", "GUARD", "MOUSE"
];

export default function WordEncryptionGame() {
  const { updateStats } = useAuth();
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [secretWord, setSecretWord] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);

  const startNewGame = () => {
    const word = SECRET_WORDS[Math.floor(Math.random() * SECRET_WORDS.length)];
    setSecretWord(word);
    setGuesses([]);
    setCurrentGuess("");
    setGameState("playing");
    playSound("click", muted);
  };

  const handleKeyPress = (char: string) => {
    if (gameState !== "playing") return;
    
    if (char === "ENTER") {
      if (currentGuess.length !== 5) {
        playSound("incorrect", muted);
        return;
      }

      const nextGuesses = [...guesses, currentGuess];
      setGuesses(nextGuesses);
      setCurrentGuess("");

      if (currentGuess === secretWord) {
        setGameState("victory");
        playSpecialSoundWrapper("victory");
        updateStats("word_encryption", 40, true);
      } else if (nextGuesses.length >= 6) {
        setGameState("defeat");
        playSpecialSoundWrapper("defeat");
        updateStats("word_encryption", 0, false);
      } else {
        playSound("click", muted);
      }
    } else if (char === "BACKSPACE") {
      setCurrentGuess((g) => g.slice(0, -1));
      playSound("click", muted);
    } else {
      if (currentGuess.length < 5) {
        setCurrentGuess((g) => (g + char).toUpperCase());
        playSound("click", muted);
      }
    }
  };

  const playSpecialSoundWrapper = (type: "victory" | "defeat") => {
    playSound(type, muted);
  };

  // Keyboard hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else {
        const char = e.key.toUpperCase();
        if (char.length === 1 && char >= "A" && char <= "Z") {
          handleKeyPress(char);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentGuess, guesses]);

  const getLetterStatus = (letter: string, index: number, guess: string) => {
    if (secretWord[index] === letter) return "correct"; // Green
    if (secretWord.includes(letter)) {
      // Handle duplicates yellow constraints (simplified)
      return "present"; // Yellow
    }
    return "absent"; // Gray
  };

  const getCellColor = (status: "correct" | "present" | "absent" | "typing") => {
    if (status === "correct") return "var(--success-color)";
    if (status === "present") return "var(--primary-color)";
    if (status === "absent") return "rgba(255, 255, 255, 0.1)";
    return "rgba(255, 255, 255, 0.02)";
  };

  const renderRow = (rowIdx: number) => {
    const isCompleted = rowIdx < guesses.length;
    const isCurrent = rowIdx === guesses.length;
    const word = isCompleted ? guesses[rowIdx] : isCurrent ? currentGuess : "";

    return (
      <div key={rowIdx} style={{ display: "flex", gap: "6px" }}>
        {Array.from({ length: 5 }).map((_, cIdx) => {
          const letter = word[cIdx] || "";
          const status = isCompleted
            ? getLetterStatus(letter, cIdx, guesses[rowIdx])
            : letter !== ""
            ? "typing"
            : "";

          return (
            <div
              key={cIdx}
              style={{
                width: "40px",
                height: "40px",
                border: "1px solid var(--glass-border)",
                borderRadius: "4px",
                background: getCellColor(status as any),
                borderColor: status === "correct" ? "var(--success-color)" : status === "present" ? "var(--primary-color)" : "",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#ffffff",
                fontFamily: "var(--font-display)",
                textShadow: "0 0 5px rgba(255,255,255,0.2)"
              }}
            >
              {letter}
            </div>
          );
        })}
      </div>
    );
  };

  if (gameState === "lobby") {
    return (
      <div className={styles.gameCard}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary-color)", margin: "0 0 10px 0" }}>DECRYPTION METHOD</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", maxWidth: "450px", lineHeight: "1.5" }}>
          Uncover the administrative credentials by decoding a 5-letter cybersecurity term in 6 guesses.
        </p>
        <button onClick={startNewGame} className={styles.btnAction} style={{ marginTop: "20px" }}>
          START DECRYPTION
        </button>
      </div>
    );
  }

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
  ];

  return (
    <div className={styles.gameCard}>
      <div className={styles.scoreBoard}>
        <div>Attempts: <span>{guesses.length} / 6</span></div>
        <div>Objective: <span>5-LETTER WORD</span></div>
        <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          {muted ? "MUTED" : "SOUND ON"}
        </button>
      </div>

      {/* Guesses Board */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "15px 0" }}>
        {Array.from({ length: 6 }).map((_, rIdx) => renderRow(rIdx))}
      </div>

      {/* On-screen Keyboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "400px", margin: "10px 0" }} id="wordle-keyboard">
        {keyboardRows.map((row, rIdx) => (
          <div key={rIdx} style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
            {row.map((char) => {
              const isSpecial = char === "ENTER" || char === "BACKSPACE";
              return (
                <button
                  key={char}
                  onClick={() => handleKeyPress(char)}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontFamily: "var(--font-sans)",
                    fontSize: isSpecial ? "10px" : "12px",
                    fontWeight: "bold",
                    padding: isSpecial ? "8px 10px" : "8px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--primary-color)"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "transparent"}
                >
                  {char === "BACKSPACE" ? "DEL" : char}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={startNewGame} className={styles.btnAction} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--primary-color)", color: "#ffffff" }}>
          Reset Board
        </button>
        <button onClick={() => setGameState("lobby")} className={styles.btnAction} style={{ background: "none", border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          Abandon
        </button>
      </div>

      {gameState === "victory" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <span className={styles.winTitle}>KEYWORD COMPRESSED</span>
            <p className={styles.winText}>
              Decryption successful. Secret word was: <strong>{secretWord}</strong>. Database core unmasked.
            </p>
            <Link href="/" className={styles.btnAction}>
              Secure Key
            </Link>
          </div>
        </div>
      )}

      {gameState === "defeat" && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal} style={{ borderColor: "var(--error-color)", boxShadow: "0 0 25px var(--error-glow)" }}>
            <span className={styles.winTitle} style={{ color: "var(--error-color)" }}>DECRYPTION SHIELD OVERLOAD</span>
            <p className={styles.winText}>
              Security check failed. The correct administrative credential word was: <strong>{secretWord}</strong>.
            </p>
            <button onClick={startNewGame} className={styles.btnAction} style={{ background: "var(--error-color)", color: "#000" }}>
              Re-Decrypt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
