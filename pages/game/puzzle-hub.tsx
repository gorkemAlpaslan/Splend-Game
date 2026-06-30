import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/PuzzleHub.module.sass";

interface GameConfig {
  id: string;
  title: string;
  desc: string;
  category: string;
}

const ALL_GAMES_DB: { [key: string]: GameConfig } = {
  // Single Player
  lights_out: { id: "lights_out", title: "LIGHTS OUT ANOMALY", desc: "A grid of glowing nodes. Clicking a node toggles it and its orthogonal neighbors. Extinguish all nodes to bypass the block.", category: "Grid" },
  grid_lock_2048: { id: "grid_lock_2048", title: "GRID LOCK (2048)", desc: "Slide data blocks across a grid. Identical numerical bytes merge upon contact. Achieve the 2048 byte limit to compile the master key.", category: "Math" },
  pattern_simon: { id: "pattern_simon", title: "PATTERN SIMON", desc: "A cognitive memory test. Memorize the glowing cyber pattern sequence and replicate it precisely to access deeper directories.", category: "Memory" },
  node_path_slider: { id: "node_path_slider", title: "NODE PATH SLIDER", desc: "Rearrange scrambled optical track sections to create a clean, unbroken path connecting the start power core to the end output node.", category: "Grid" },
  binary_matrix_hitori: { id: "binary_matrix_hitori", title: "BINARY HITORI", desc: "Eliminate duplicate numbers in a network row or column by shading them out, ensuring remaining numbers don't touch shaded squares orthogonally.", category: "Logic" },
  // Online Multiplayer
  online_tic_tac_toe: { id: "online_tic_tac_toe", title: "TIC TAC TOE DUEL", desc: "A lightning-fast 3x3 duel. Chain three markers in a row while blocking your opponent under speed-hacking timers.", category: "Board" },
  online_connect_four: { id: "online_connect_four", title: "CONNECT FOUR ARENA", desc: "Drop gravity-guided chips down columns. Align four matching chips horizontally, vertically, or diagonally before your opponent does.", category: "Board" }
};

const DEFAULT_GAME_CONFIG: GameConfig = {
  id: "generic",
  title: "DATA COMPILER PUZZLE",
  desc: "Slide the numeric blocks to sort the sequence into ascending order. Fix the index alignment to complete sector decryption.",
  category: "Logic"
};

export default function PuzzleHubPage() {
  const router = useRouter();
  const { id, roomId } = router.query;
  const gameId = (id as string) || "generic";
  const { user, updateStats } = useAuth();

  const config = ALL_GAMES_DB[gameId] || {
    ...DEFAULT_GAME_CONFIG,
    title: gameId.replace("online_", "").replace("_", " ").toUpperCase() + " SECTOR",
  };

  const [score, setScore] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameSolved, setGameSolved] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<any>(null);

  // --- 1. Lights Out State & Logic ---
  const [lights, setLights] = useState<boolean[][]>([]);
  const initLightsOut = () => {
    const grid: boolean[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < 5; c++) {
        row.push(Math.random() > 0.4); // Random initial lit states
      }
      grid.push(row);
    }
    setLights(grid);
    setMoves(0);
    setGameSolved(false);
  };
  const toggleLight = (r: number, c: number) => {
    if (gameSolved) return;
    const grid = lights.map((row) => [...row]);
    const coords = [
      [0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]
    ];
    coords.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
        grid[nr][nc] = !grid[nr][nc];
      }
    });
    setLights(grid);
    setMoves((m) => m + 1);

    // Verify all off
    const allOff = grid.every((row) => row.every((val) => !val));
    if (allOff) {
      setGameSolved(true);
      updateStats(gameId, 40, true);
    }
  };

  // --- 2. Simon Memory Logic ---
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [simonActiveIdx, setSimonActiveIdx] = useState<number | null>(null);
  const [simonStatus, setSimonStatus] = useState<string>("Click Start");

  const startSimon = () => {
    setSequence([Math.floor(Math.random() * 4)]);
    setUserSequence([]);
    setSimonStatus("Watch sequence");
    setMoves(0);
    setGameSolved(false);
  };
  useEffect(() => {
    if (sequence.length === 0) return;
    let i = 0;
    const interval = setInterval(() => {
      setSimonActiveIdx(sequence[i]);
      setTimeout(() => setSimonActiveIdx(null), 400);
      i++;
      if (i >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => setSimonStatus("Your turn!"), 500);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [sequence]);

  const handleSimonClick = (idx: number) => {
    if (simonStatus !== "Your turn!") return;
    const newSeq = [...userSequence, idx];
    setUserSequence(newSeq);

    // Verify last click
    const currentStep = newSeq.length - 1;
    if (newSeq[currentStep] !== sequence[currentStep]) {
      setSimonStatus("FAIL! Try again.");
      setSequence([]);
      return;
    }

    if (newSeq.length === sequence.length) {
      setMoves((m) => m + 1);
      if (sequence.length >= 5) {
        setSimonStatus("SUCCESS! Access granted.");
        setGameSolved(true);
        updateStats(gameId, 45, true);
      } else {
        setSimonStatus("Good! Next code.");
        setTimeout(() => {
          setSequence([...sequence, Math.floor(Math.random() * 4)]);
          setUserSequence([]);
        }, 1000);
      }
    }
  };

  // --- 3. Slider Grid Puzzle logic (Generic Puzzle Solver) ---
  const [sliderBoard, setSliderBoard] = useState<number[]>([]);
  const initSlider = () => {
    const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    // Simple shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    setSliderBoard(tiles);
    setMoves(0);
    setGameSolved(false);
  };
  const handleSliderMove = (idx: number) => {
    if (gameSolved) return;
    const emptyIdx = sliderBoard.indexOf(0);
    const validMoves = [
      emptyIdx - 1, emptyIdx + 1, emptyIdx - 3, emptyIdx + 3
    ];
    // prevent row wraps
    if (emptyIdx % 3 === 0 && idx === emptyIdx - 1) return;
    if (emptyIdx % 3 === 2 && idx === emptyIdx + 1) return;

    if (validMoves.includes(idx)) {
      const newBoard = [...sliderBoard];
      newBoard[emptyIdx] = sliderBoard[idx];
      newBoard[idx] = 0;
      setSliderBoard(newBoard);
      setMoves((m) => m + 1);

      // Check win
      const isWin = newBoard.slice(0, 8).every((val, index) => val === index + 1);
      if (isWin) {
        setGameSolved(true);
        updateStats(gameId, 35, true);
      }
    }
  };

  // --- 4. Mini 2048 Logic ---
  const [grid2048, setGrid2048] = useState<number[][]>([]);
  const init2048 = () => {
    const grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    // Spawn 2 items
    grid[Math.floor(Math.random() * 4)][Math.floor(Math.random() * 4)] = 2;
    grid[Math.floor(Math.random() * 4)][Math.floor(Math.random() * 4)] = 2;
    setGrid2048(grid);
    setScore(0);
    setGameSolved(false);
  };
  const handle2048Move = (direction: "up" | "down" | "left" | "right") => {
    if (gameSolved) return;
    let grid = grid2048.map((row) => [...row]);
    let points = 0;
    let moved = false;

    // Simple slider merge implementation for 2048
    const slideRowLeft = (row: number[]) => {
      const filtered = row.filter((v) => v !== 0);
      const result = [];
      for (let i = 0; i < filtered.length; i++) {
        if (filtered[i] === filtered[i + 1]) {
          result.push(filtered[i] * 2);
          points += filtered[i] * 2;
          i++;
          moved = true;
        } else {
          result.push(filtered[i]);
        }
      }
      while (result.length < 4) {
        result.push(0);
      }
      return result;
    };

    if (direction === "left") {
      for (let r = 0; r < 4; r++) {
        const nextRow = slideRowLeft(grid[r]);
        if (JSON.stringify(grid[r]) !== JSON.stringify(nextRow)) moved = true;
        grid[r] = nextRow;
      }
    } else if (direction === "right") {
      for (let r = 0; r < 4; r++) {
        const reversed = [...grid[r]].reverse();
        const merged = slideRowLeft(reversed);
        const finalRow = merged.reverse();
        if (JSON.stringify(grid[r]) !== JSON.stringify(finalRow)) moved = true;
        grid[r] = finalRow;
      }
    } else if (direction === "up") {
      for (let c = 0; c < 4; c++) {
        const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        const merged = slideRowLeft(col);
        for (let r = 0; r < 4; r++) {
          if (grid[r][c] !== merged[r]) moved = true;
          grid[r][c] = merged[r];
        }
      }
    } else if (direction === "down") {
      for (let c = 0; c < 4; c++) {
        const col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
        const merged = slideRowLeft(col);
        const finalCol = merged.reverse();
        for (let r = 0; r < 4; r++) {
          if (grid[r][c] !== finalCol[r]) moved = true;
          grid[r][c] = finalCol[r];
        }
      }
    }

    if (moved) {
      // Spawn new 2
      const emptyCells: [number, number][] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === 0) emptyCells.push([r, c]);
        }
      }
      if (emptyCells.length > 0) {
        const [nr, nc] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[nr][nc] = Math.random() > 0.9 ? 4 : 2;
      }

      setGrid2048(grid);
      setScore((s) => s + points);

      // check target victory 2048
      const has2048 = grid.some((r) => r.includes(2048));
      const has256 = grid.some((r) => r.includes(256)); // Simpler target score win
      if (has2048 || has256) {
        setGameSolved(true);
        updateStats(gameId, 50, true);
      }
    }
  };

  // --- 5. Real-time Multiplayer Tic-Tac-Toe / Duel state sync ---
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId as string);
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
        if (data.status === "ended" && data.winnerId === user?.uid) {
          setGameSolved(true);
          updateStats(gameId, 40, true);
        }
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  const handleTTTClick = async (idx: number) => {
    if (!roomData || roomData.status !== "playing" || roomData.turn !== user?.uid) return;

    const boardState = roomData.gameState.board || Array(9).fill("");
    if (boardState[idx] !== "") return;

    const symbol = roomData.players.player1.uid === user?.uid ? "X" : "O";
    const nextBoard = [...boardState];
    nextBoard[idx] = symbol;

    // Check win combos
    const combos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    let isWin = false;
    combos.forEach(([a, b, c]) => {
      if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
        isWin = true;
      }
    });

    const isDraw = !isWin && nextBoard.every((cell) => cell !== "");

    const p1 = roomData.players.player1;
    const p2 = roomData.players.player2;
    const nextTurnUid = roomData.turn === p1.uid ? p2.uid : p1.uid;

    const roomRef = doc(db, "rooms", roomId as string);
    if (isWin) {
      await updateDoc(roomRef, {
        "gameState.board": nextBoard,
        status: "ended",
        winnerId: user?.uid
      });
    } else if (isDraw) {
      await updateDoc(roomRef, {
        "gameState.board": nextBoard,
        status: "ended",
        winnerId: "draw"
      });
    } else {
      await updateDoc(roomRef, {
        "gameState.board": nextBoard,
        turn: nextTurnUid
      });
    }
  };

  // --- Initializer hooks ---
  useEffect(() => {
    if (gameId === "lights_out") {
      initLightsOut();
    } else if (gameId === "grid_lock_2048") {
      init2048();
    } else if (gameId === "pattern_simon") {
      // Wait for user to trigger start button
    } else if (!roomId) {
      initSlider();
    }
  }, [gameId, roomId]);

  // Render correct playable element
  const renderGameInterface = () => {
    if (roomId) {
      // Multiplayer Tic-Tac-Toe / Duel sync
      if (!roomData) return <div>Connecting match stream...</div>;
      const boardState = roomData.gameState.board || Array(9).fill("");
      const isMyTurn = roomData.turn === user?.uid && roomData.status === "playing";

      return (
        <div className={styles.consoleArea}>
          <div className={styles.scoreBoard}>
            <div>TURN: <span>{isMyTurn ? "YOURS" : "OPPONENT'S"}</span></div>
            <div>STATUS: <span>{roomData.status.toUpperCase()}</span></div>
          </div>
          <div className={styles.tttGrid}>
            {boardState.map((cell: string, idx: number) => (
              <div
                key={idx}
                onClick={() => handleTTTClick(idx)}
                className={`${styles.tttCell} ${cell === "X" ? styles.tttX : styles.tttO}`}
              >
                {cell}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (gameId === "lights_out") {
      return (
        <div className={styles.consoleArea}>
          <div className={styles.scoreBoard}>
            <div>Moves: <span>{moves}</span></div>
          </div>
          <div className={styles.lightsGrid}>
            {lights.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  onClick={() => toggleLight(r, c)}
                  className={`${styles.lightCell} ${val ? styles.lightOn : styles.lightOff}`}
                />
              ))
            )}
          </div>
          <button onClick={initLightsOut} className={styles.btnAction} style={{ marginTop: "10px" }}>
            Reset Grid
          </button>
        </div>
      );
    }

    if (gameId === "grid_lock_2048") {
      return (
        <div className={styles.consoleArea}>
          <div className={styles.scoreBoard}>
            <div>Score: <span>{score}</span></div>
          </div>
          <div className={styles.grid2048}>
            {grid2048.map((row) =>
              row.map((val, idx) => (
                <div key={idx} className={styles.cell2048} style={{
                  background: val > 0 ? `rgba(0, 210, 255, ${Math.min(1, 0.1 + Math.log2(val) * 0.15)})` : "",
                  borderColor: val > 0 ? "var(--primary-color)" : "",
                  color: val > 0 ? "#ffffff" : ""
                }}>
                  {val > 0 ? val : ""}
                </div>
              ))
            )}
          </div>
          <div className={styles.controls2048} style={{ marginTop: "10px" }}>
            <div />
            <button onClick={() => handle2048Move("up")} className={styles.controlBtn}>▲</button>
            <div />
            <button onClick={() => handle2048Move("left")} className={styles.controlBtn}>◀</button>
            <button onClick={() => handle2048Move("down")} className={styles.controlBtn}>▼</button>
            <button onClick={() => handle2048Move("right")} className={styles.controlBtn}>▶</button>
          </div>
        </div>
      );
    }

    if (gameId === "pattern_simon") {
      const colors = ["#ff2a6d", "#00d2ff", "#00e676", "#ffd54f"];
      return (
        <div className={styles.consoleArea}>
          <div className={styles.scoreBoard}>
            <div>Status: <span>{simonStatus}</span></div>
            <div>Score: <span>{sequence.length}</span></div>
          </div>
          <div className={styles.simonGrid}>
            {colors.map((color, idx) => (
              <div
                key={idx}
                onClick={() => handleSimonClick(idx)}
                className={styles.simonCell}
                style={{
                  background: simonActiveIdx === idx ? color : `${color}33`,
                  borderColor: color,
                  color: color
                }}
              />
            ))}
          </div>
          <button onClick={startSimon} className={styles.btnAction} style={{ marginTop: "20px" }}>
            Deploy Memory Test
          </button>
        </div>
      );
    }

    // Default slider layout
    return (
      <div className={styles.consoleArea}>
        <div className={styles.scoreBoard}>
          <div>Moves: <span>{moves}</span></div>
        </div>
        <div className={styles.sliderGrid}>
          {sliderBoard.map((val, idx) => (
            <div
              key={idx}
              onClick={() => handleSliderMove(idx)}
              className={`${styles.sliderCell} ${val === 0 ? styles.sliderEmpty : ""}`}
            >
              {val > 0 ? val : ""}
            </div>
          ))}
        </div>
        <button onClick={initSlider} className={styles.btnAction} style={{ marginTop: "10px" }}>
          Shuffle Grid
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container} id="puzzle-hub-page">
      <Head>
        <title>{config.title} - Splend Game</title>
      </Head>

      <div className={styles.header}>
        <h1 className={styles.title}>{config.title}</h1>
        <span className={styles.category}>{config.category.toUpperCase()}</span>
      </div>

      <div className={styles.gameCard}>
        <p className={styles.desc}>{config.desc}</p>

        {renderGameInterface()}
      </div>

      {gameSolved && (
        <div className={styles.winOverlay} id="puzzle-victory-overlay">
          <div className={styles.winModal}>
            <span className={styles.winTitle}>COMPILER ERROR RESOLVED</span>
            <p className={styles.winText}>
              Decryption is fully complete. User score records have been updated to the database cloud.
            </p>
            <Link href="/" className={styles.btnAction} id="btn-victory-home">
              Return Lobby database
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
