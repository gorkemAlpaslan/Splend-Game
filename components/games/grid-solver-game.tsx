import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./grid-solver-style.module.sass";

// Synthesized sound effects engine using browser Web Audio API
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSynthSound = (
  type: "click" | "powerup" | "victory" | "defeat" | "block",
  muted: boolean
) => {
  if (muted) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    switch (type) {
      case "click": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case "block": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.setValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case "powerup": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case "victory": {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
        notes.forEach((freq, idx) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

          osc.connect(gain);
          gain.connect(audioCtx!.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
        break;
      }
      case "defeat": {
        const notes = [311.13, 293.66, 277.18, 261.63]; // Eb4, D4, C#4, C4 sliding down
        notes.forEach((freq, idx) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          const filter = audioCtx!.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(300, now + idx * 0.12);

          gain.gain.setValueAtTime(0.0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx!.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.4);
        });
        break;
      }
    }
  } catch (e) {
    console.error("Synthesizer sound playback failed:", e);
  }
};

type TileType = "source" | "receiver" | "block" | "straight" | "elbow" | "t" | "cross" | "end";

interface Tile {
  id: string;
  type: TileType;
  baseConnections: number[]; // directions out of [0: UP, 1: RIGHT, 2: DOWN, 3: LEFT]
  rotation: number; // 0, 1, 2, 3 (represents * 90 degrees clockwise)
  isPowered: boolean;
  row: number;
  col: number;
}

export default function GridSolverGame() {
  const { stats, updateStats } = useAuth();
  
  // Game Stats
  const gsStats = stats.games.grid_solver || { score: 0, losses: 0, winStreak: 0, highScore: 0 };

  // Setup options
  const [gridSize, setGridSize] = useState<number>(5); // 5x5 default
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [muted, setMuted] = useState<boolean>(false);
  const [sourcePos, setSourcePos] = useState<{ row: number; col: number }>({ row: 0, col: 2 });

  // Runtime states
  const [grid, setGrid] = useState<Tile[]>([]);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "victory" | "defeat">("lobby");
  const [movesTaken, setMovesTaken] = useState<number>(0);
  const [maxMoves, setMaxMoves] = useState<number>(30);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);
  const [pointsWon, setPointsWon] = useState<number>(0);

  // Initialize game params based on difficulty
  const applySettings = (diff: "easy" | "medium" | "hard", size: number) => {
    setDifficulty(diff);
    setGridSize(size);

    // Multipliers
    let mult = 1.0;
    if (size === 6) mult += 0.5;
    if (size === 7) mult += 1.0;
    if (diff === "medium") mult += 0.5;
    if (diff === "hard") mult += 1.0;
    setScoreMultiplier(parseFloat(mult.toFixed(1)));

    // Max moves allowed
    if (diff === "easy") setMaxMoves(30);
    else if (diff === "medium") setMaxMoves(35);
    else setMaxMoves(40);
  };

  const handleDifficultySelection = (diff: "easy" | "medium" | "hard") => {
    if (diff === "easy") applySettings(diff, 5);
    else if (diff === "medium") applySettings(diff, 6);
    else applySettings(diff, 7);
  };

  // Generate solvable network
  const startNewMission = () => {
    initAudio();
    setMovesTaken(0);
    setGameState("playing");
    setPointsWon(0);

    const size = gridSize;
    const borderType = Math.random() < 0.5 ? "top-bottom" : "left-right";

    let srcRow = 0;
    let srcCol = 0;
    const recs: { row: number; col: number }[] = [];

    if (borderType === "top-bottom") {
      // Source is randomized on top row, receivers on bottom row
      srcRow = 0;
      srcCol = Math.floor(Math.random() * size);

      if (difficulty === "easy") {
        recs.push({ row: size - 1, col: Math.floor(Math.random() * size) });
      } else if (difficulty === "medium") {
        recs.push({ row: size - 1, col: 0 });
        recs.push({ row: size - 1, col: size - 1 });
      } else {
        recs.push({ row: size - 1, col: 0 });
        recs.push({ row: size - 1, col: Math.floor(size / 2) });
        recs.push({ row: size - 1, col: size - 1 });
      }
    } else {
      // Source is randomized on left column, receivers on right column
      srcRow = Math.floor(Math.random() * size);
      srcCol = 0;

      if (difficulty === "easy") {
        recs.push({ row: Math.floor(Math.random() * size), col: size - 1 });
      } else if (difficulty === "medium") {
        recs.push({ row: 0, col: size - 1 });
        recs.push({ row: size - 1, col: size - 1 });
      } else {
        recs.push({ row: 0, col: size - 1 });
        recs.push({ row: Math.floor(size / 2), col: size - 1 });
        recs.push({ row: size - 1, col: size - 1 });
      }
    }

    setSourcePos({ row: srcRow, col: srcCol });

    // 1. Spanning Tree Builder using Prim's algorithm
    const inTree: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    const parentMap: Map<string, string> = new Map(); // childKey -> parentKey
    const adjacentEdges: { from: string; to: string; dir: number }[] = [];

    const getKey = (r: number, c: number) => `${r},${c}`;
    const parseKey = (key: string) => {
      const [r, c] = key.split(",").map(Number);
      return { r, c };
    };

    const addEdges = (r: number, c: number) => {
      inTree[r][c] = true;
      const directions = [
        { dr: -1, dc: 0, d: 0 }, // UP
        { dr: 0, dc: 1, d: 1 },  // RIGHT
        { dr: 1, dc: 0, d: 2 },  // DOWN
        { dr: 0, dc: -1, d: 3 }  // LEFT
      ];
      directions.forEach(({ dr, dc, d }) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (!inTree[nr][nc]) {
            adjacentEdges.push({ from: getKey(r, c), to: getKey(nr, nc), dir: d });
          }
        }
      });
    };

    // Initialize Prim's from source
    addEdges(srcRow, srcCol);

    const treeConnections: Map<string, Set<number>> = new Map();
    const initializeSet = (key: string) => {
      if (!treeConnections.has(key)) {
        treeConnections.set(key, new Set());
      }
    };
    initializeSet(getKey(srcRow, srcCol));

    while (adjacentEdges.length > 0) {
      // Pick a random edge
      const idx = Math.floor(Math.random() * adjacentEdges.length);
      const edge = adjacentEdges[idx];
      adjacentEdges.splice(idx, 1);

      const toNode = parseKey(edge.to);
      if (!inTree[toNode.r][toNode.c]) {
        parentMap.set(edge.to, edge.from);
        initializeSet(edge.from);
        initializeSet(edge.to);

        // Record bidirectional connection in the tree
        treeConnections.get(edge.from)!.add(edge.dir);
        treeConnections.get(edge.to)!.add((edge.dir + 2) % 4);

        addEdges(toNode.r, toNode.c);
      }
    }

    // 2. Prune Tree: Keep only paths connecting Source to Receivers
    const essentialNodes: Set<string> = new Set();
    essentialNodes.add(getKey(srcRow, srcCol));
    const essentialConnections: Map<string, Set<number>> = new Map();

    const addEssentialEdge = (u: string, v: string, dir: number) => {
      essentialNodes.add(u);
      essentialNodes.add(v);
      if (!essentialConnections.has(u)) essentialConnections.set(u, new Set());
      if (!essentialConnections.has(v)) essentialConnections.set(v, new Set());
      essentialConnections.get(u)!.add(dir);
      essentialConnections.get(v)!.add((dir + 2) % 4);
    };

    // Backpropagate from each receiver along the parent map
    recs.forEach((rec) => {
      let curr = getKey(rec.row, rec.col);
      while (curr !== getKey(srcRow, srcCol)) {
        const parent = parentMap.get(curr);
        if (!parent) break;

        // Find edge direction parent -> curr
        const pNode = parseKey(parent);
        const cNode = parseKey(curr);
        let dir = 0;
        if (cNode.r < pNode.r) dir = 0; // UP
        else if (cNode.c > pNode.c) dir = 1; // RIGHT
        else if (cNode.r > pNode.r) dir = 2; // DOWN
        else if (cNode.c < pNode.c) dir = 3; // LEFT

        addEssentialEdge(parent, curr, dir);
        curr = parent;
      }
    });

    // 3. Set Block Nodes for Hard difficulty
    const blocks: Set<string> = new Set();
    if (difficulty === "hard") {
      let blockCount = 0;
      let attempts = 0;
      while (blockCount < 4 && attempts < 50) {
        attempts++;
        const r = Math.floor(Math.random() * size);
        const c = Math.floor(Math.random() * size);
        const key = getKey(r, c);
        // Blocks cannot be source, receiver, or essential path nodes
        const isRec = recs.some((rec) => rec.row === r && rec.col === c);
        const isSrc = srcRow === r && srcCol === c;
        if (!isSrc && !isRec && !essentialNodes.has(key)) {
          blocks.add(key);
          blockCount++;
        }
      }
    }

    // 4. Construct Final Grid Tiles
    const newGrid: Tile[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = getKey(r, c);
        const isSrc = srcRow === r && srcCol === c;
        const isRec = recs.some((rec) => rec.row === r && rec.col === c);

        if (blocks.has(key)) {
          newGrid.push({
            id: key,
            type: "block",
            baseConnections: [],
            rotation: 0,
            isPowered: false,
            row: r,
            col: c
          });
          continue;
        }

        let actualSet = essentialConnections.get(key) || new Set<number>();
        let type: TileType = "straight";
        let baseConnections: number[] = [0, 2]; // straight base
        let targetRotation = 0;

        if (isSrc) {
          type = "source";
          // Transmitter connects downwards or outwards into essential tree
          if (actualSet.size === 0) {
            actualSet.add(2); // default points down
          }
        } else if (isRec) {
          type = "receiver";
          if (actualSet.size === 0) {
            actualSet.add(0); // default points up
          }
        }

        const conns = Array.from(actualSet).sort();

        if (type !== "source" && type !== "receiver") {
          if (conns.length === 0) {
            // Noise tile: populate random shape
            const shapes: TileType[] = ["straight", "elbow", "t", "end"];
            type = shapes[Math.floor(Math.random() * shapes.length)];
            
            if (type === "straight") baseConnections = [0, 2];
            else if (type === "elbow") baseConnections = [0, 1];
            else if (type === "t") baseConnections = [0, 1, 2];
            else baseConnections = [0]; // end cap
            
            targetRotation = Math.floor(Math.random() * 4);
          } else if (conns.length === 1) {
            type = "end";
            baseConnections = [0];
            targetRotation = conns[0]; // Rotate end to face connecting dir
          } else if (conns.length === 2) {
            const diff = Math.abs(conns[0] - conns[1]);
            if (diff === 2) {
              type = "straight";
              baseConnections = [0, 2];
              targetRotation = conns[0]; // 0 or 1
            } else {
              type = "elbow";
              baseConnections = [0, 1];
              // Map connection endpoints to standard rotation
              if (conns[0] === 0 && conns[1] === 1) targetRotation = 0;
              else if (conns[0] === 1 && conns[1] === 2) targetRotation = 1;
              else if (conns[0] === 2 && conns[1] === 3) targetRotation = 2;
              else targetRotation = 3; // [0, 3] or [3, 0]
            }
          } else if (conns.length === 3) {
            type = "t";
            baseConnections = [0, 1, 2];
            // T-junction mapping
            if (conns.includes(0) && conns.includes(1) && conns.includes(2)) targetRotation = 0;
            else if (conns.includes(1) && conns.includes(2) && conns.includes(3)) targetRotation = 1;
            else if (conns.includes(2) && conns.includes(3) && conns.includes(0)) targetRotation = 2;
            else targetRotation = 3;
          } else {
            type = "cross";
            baseConnections = [0, 1, 2, 3];
            targetRotation = 0;
          }
        } else {
          // Source & Receivers are single terminals (end caps)
          baseConnections = [0];
          targetRotation = conns[0] || 0;
        }

        // Randomize initial rotation for rotatable pieces
        let initRotation = targetRotation;
        if (type !== "source" && type !== "receiver") {
          // Ensure it's rotated away from solved state
          const randomOffset = Math.floor(Math.random() * 3) + 1; // offset 1, 2, or 3
          initRotation = (targetRotation + randomOffset) % 4;
        }

        newGrid.push({
          id: key,
          type,
          baseConnections,
          rotation: initRotation,
          isPowered: false,
          row: r,
          col: c
        });
      }
    }

    // Solve initial power flow (should not be completed immediately)
    const initialPowerGrid = computePowerGrid(newGrid, srcRow, srcCol, size);
    setGrid(initialPowerGrid);
    playSynthSound("powerup", muted);
  };

  // Traversal to solve power flow
  const computePowerGrid = (currentGrid: Tile[], srcR: number, srcC: number, size: number): Tile[] => {
    // 1. Reset all power states
    const workingGrid = currentGrid.map((tile) => ({ ...tile, isPowered: false }));
    const tileMap = new Map<string, Tile>();
    workingGrid.forEach((tile) => tileMap.set(`${tile.row},${tile.col}`, tile));

    // Get actual connection directions at current rotation
    const getActualConnections = (tile: Tile): number[] => {
      if (tile.type === "block") return [];
      return tile.baseConnections.map((d) => (d + tile.rotation) % 4);
    };

    // DFS/BFS queue
    const queue: string[] = [];
    const srcKey = `${srcR},${srcC}`;
    const srcTile = tileMap.get(srcKey);

    if (srcTile) {
      srcTile.isPowered = true;
      queue.push(srcKey);
    }

    while (queue.length > 0) {
      const currKey = queue.shift()!;
      const currTile = tileMap.get(currKey)!;
      const currConns = getActualConnections(currTile);

      currConns.forEach((dir) => {
        let nr = currTile.row;
        let nc = currTile.col;

        if (dir === 0) nr -= 1;      // UP
        else if (dir === 1) nc += 1; // RIGHT
        else if (dir === 2) nr += 1; // DOWN
        else if (dir === 3) nc -= 1; // LEFT

        const neighKey = `${nr},${nc}`;
        const neighTile = tileMap.get(neighKey);

        if (neighTile && neighTile.type !== "block" && !neighTile.isPowered) {
          const neighConns = getActualConnections(neighTile);
          const oppDir = (dir + 2) % 4;

          // Connection check: neighbor must connect back to current tile
          if (neighConns.includes(oppDir)) {
            neighTile.isPowered = true;
            queue.push(neighKey);
          }
        }
      });
    }

    return Array.from(tileMap.values());
  };

  // Rotate tile click handler
  const handleTileClick = (tileId: string) => {
    if (gameState !== "playing") return;

    const tileIdx = grid.findIndex((t) => t.id === tileId);
    const tile = grid[tileIdx];

    // Source, receivers, and block elements cannot be rotated
    if (tile.type === "source" || tile.type === "receiver" || tile.type === "block") {
      if (tile.type === "block") {
        playSynthSound("block", muted);
      }
      return;
    }

    // Play click sound
    playSynthSound("click", muted);

    // Perform rotation
    const updatedGrid = [...grid];
    const newRotation = tile.rotation + 1;
    updatedGrid[tileIdx] = {
      ...tile,
      rotation: newRotation
    };

    // Increment moves
    const newMoves = movesTaken + 1;
    setMovesTaken(newMoves);

    // Compute updated power flow
    const poweredGrid = computePowerGrid(updatedGrid, sourcePos.row, sourcePos.col, gridSize);
    setGrid(poweredGrid);

    // Check if won
    const receivers = poweredGrid.filter((t) => t.type === "receiver");
    const allPowered = receivers.every((t) => t.isPowered);

    if (allPowered) {
      setGameState("victory");
      playSynthSound("victory", muted);
      
      // Calculate points
      const basePoints = gridSize === 5 ? 1 : gridSize === 6 ? 2 : 3;
      const efficiencyBonus = newMoves <= Math.floor(maxMoves / 2) ? 1 : 0;
      const totalPoints = Math.round((basePoints + efficiencyBonus) * scoreMultiplier);
      
      setPointsWon(totalPoints);
      updateStats("grid_solver", totalPoints, true);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "victory" } }));
    } else if (newMoves >= maxMoves) {
      setGameState("defeat");
      playSynthSound("defeat", muted);
      updateStats("grid_solver", 0, false);
      window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
    }
  };

  const handleAbandon = () => {
    setGameState("defeat");
    playSynthSound("defeat", muted);
    updateStats("grid_solver", 0, false);
    window.dispatchEvent(new CustomEvent("matrix-event", { detail: { type: "defeat" } }));
  };

  // SVG drawing logic based on tile connection directions
  const renderTileSVG = (tile: Tile) => {
    const isPowered = tile.isPowered;
    
    // Draw blocked firewall block
    if (tile.type === "block") {
      return (
        <svg className={styles.tileSvg} viewBox="0 0 100 100">
          {/* Outer Warning Border */}
          <rect x="10" y="10" width="80" height="80" rx="8" fill="none" stroke="#ff2a6d" strokeWidth="2" strokeDasharray="4,4" />
          {/* Lock Icon */}
          <path d="M50 30c-7 0-12 5-12 12v6h24v-6c0-7-5-12-12-12zm-8 18v-6c0-5 3.5-8 8-8s8 3 8 8v6" stroke="#ff2a6d" strokeWidth="4" fill="none" />
          <rect x="34" y="48" width="32" height="24" rx="4" fill="#ff2a6d" opacity="0.8" />
          <circle cx="50" cy="60" r="3" fill="#000" />
        </svg>
      );
    }

    const conns = tile.baseConnections;
    const paths: JSX.Element[] = [];

    // Draw central node socket
    let centerColor = isPowered ? (tile.type === "source" ? "var(--primary-color)" : "var(--success-color)") : "rgba(255,255,255,0.15)";
    let centerRadius = 8;
    if (tile.type === "source") centerRadius = 14;
    else if (tile.type === "receiver") centerRadius = 12;

    conns.forEach((dir, idx) => {
      let pathString = "";
      if (dir === 0) pathString = "M 50 50 L 50 0";    // UP
      else if (dir === 1) pathString = "M 50 50 L 100 50"; // RIGHT
      else if (dir === 2) pathString = "M 50 50 L 50 100"; // DOWN
      else if (dir === 3) pathString = "M 50 50 L 0 50";   // LEFT

      paths.push(<path key={idx} d={pathString} />);
    });

    return (
      <svg
        className={styles.tileSvg}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${tile.rotation * 90}deg)` }}
      >
        {/* Draw paths */}
        <g>{paths}</g>

        {/* Draw center indicator */}
        {tile.type === "source" ? (
          <>
            <circle cx="50" cy="50" r={centerRadius + 4} fill="none" stroke={centerColor} strokeWidth="2" strokeDasharray="4,4" className="pulsing" />
            <circle cx="50" cy="50" r={centerRadius} fill={centerColor} opacity="0.8" />
            <path d="M44 50 L56 50 M50 44 L50 56" stroke="#000" strokeWidth="2.5" />
          </>
        ) : tile.type === "receiver" ? (
          <>
            <rect x="36" y="36" width="28" height="28" rx="4" fill="none" stroke={centerColor} strokeWidth="3" />
            <circle cx="50" cy="50" r="5" fill={centerColor} />
          </>
        ) : (
          <circle cx="50" cy="50" r={centerRadius} fill={centerColor} />
        )}
      </svg>
    );
  };

  return (
    <div className={styles.playArea} id="gs-play-area">
      {/* 1. Left side - Game Area */}
      <div className={styles.gameGridWrapper} id="gs-grid-wrapper">
        {gameState === "lobby" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80" fill="var(--primary-color)" style={{ filter: "drop-shadow(0 0 15px var(--primary-glow))" }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--primary-color)", margin: 0 }}>MISSION CONTROL</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", maxWidth: "450px", margin: 0 }}>
              Adjust difficulty parameters and initialize the decryption matrix to route the optical power link. Secure connections to bypass firewall anomalies.
            </p>
          </div>
        ) : (
          <div
            className={styles.gameGrid}
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
            id="gs-game-grid"
          >
            {grid.map((tile) => {
              const extraClass = 
                tile.type === "source" ? styles.tileSource :
                tile.type === "receiver" ? styles.tileReceiver :
                tile.type === "block" ? styles.tileBlock :
                "";
              const powerClass = tile.isPowered ? styles.tilePowered + " powered" : "";

              return (
                <button
                  key={tile.id}
                  className={`${styles.tile} ${extraClass} ${powerClass}`}
                  onClick={() => handleTileClick(tile.id)}
                  aria-label={`Tile ${tile.row},${tile.col}`}
                >
                  {renderTileSVG(tile)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Right side - Control Dashboard & Stats */}
      <div className={styles.sidebar} id="gs-sidebar">
        {/* Game Stats Widget */}
        <div className={styles.gameStatsGroup}>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gsStats.score}</div>
            <div className={styles.lbl}>Total Points</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gsStats.highScore}</div>
            <div className={styles.lbl}>Best Streak</div>
          </div>
          <div className={styles.gameStatBox}>
            <div className={styles.num}>{gsStats.losses}</div>
            <div className={styles.lbl}>Losses</div>
          </div>
        </div>

        {/* Dashboard state cards */}
        {gameState === "lobby" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>PARAMETER DEPLOYMENT</div>
            <div className={styles.controlBlock}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>DIFFICULTY PROFILE</span>
                <div className={styles.setupGrid}>
                  <button className={`${styles.setupButton} ${difficulty === "easy" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("easy")}>EASY</button>
                  <button className={`${styles.setupButton} ${difficulty === "medium" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("medium")}>MEDIUM</button>
                  <button className={`${styles.setupButton} ${difficulty === "hard" ? styles.activeSetup : ""}`} onClick={() => handleDifficultySelection("hard")}>HARD</button>
                </div>
              </div>

              <div className={styles.statRow} style={{ marginTop: "10px" }}>
                <span className={styles.label}>Grid Resolution</span>
                <span className={styles.val}>{gridSize} x {gridSize}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Max Rotations Allowed</span>
                <span className={styles.val}>{maxMoves}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={muted} onChange={() => setMuted(!muted)} />
                  Mute Audio FX
                </label>
              </div>

              <button className={styles.deployBtn} onClick={startNewMission} style={{ marginTop: "10px" }}>
                Initialize Matrix
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className={styles.infoCard}>
            <div className={styles.title}>QUANTUM CONNECTIVITY</div>
            <div className={styles.controlBlock}>
              <div className={styles.statRow}>
                <span className={styles.label}>Difficulty</span>
                <span className={styles.val} style={{ textTransform: "uppercase", color: "var(--primary-color)" }}>{difficulty}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Rotations Dispatched</span>
                <span className={styles.val} style={{ color: movesTaken > maxMoves * 0.8 ? "var(--error-color)" : "#fff" }}>
                  {movesTaken} / {maxMoves}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Points Multiplier</span>
                <span className={styles.val}>{scoreMultiplier}x</span>
              </div>

              <button className={styles.abandonBtn} onClick={handleAbandon} style={{ marginTop: "15px" }}>
                Sever Matrix link
              </button>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className={`${styles.infoCard} ${styles.victoryCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>DECRYPTION SUCCESS</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Link established! Optical grid routing complete. Score synchronized with matrix cloud db.
              </p>
              <div className={styles.statRow}>
                <span className={styles.label}>Moves Dispatched</span>
                <span className={styles.val}>{movesTaken}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Base Score</span>
                <span className={styles.val}>+{gridSize === 5 ? 1 : gridSize === 6 ? 2 : 3}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Efficiency Bonus</span>
                <span className={styles.val}>+{movesTaken <= Math.floor(maxMoves / 2) ? 1 : 0}</span>
              </div>
              <div className={styles.statRow} style={{ borderBottom: "none" }}>
                <span className={styles.label}>Sync Points (Score)</span>
                <span className={styles.val} style={{ color: "var(--success-color)", fontSize: "18px" }}>+{pointsWon}</span>
              </div>

              <button className={styles.deployBtn} onClick={startNewMission} style={{ marginTop: "15px" }}>
                Decrypt Next Sector
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Return to Config
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className={`${styles.infoCard} ${styles.defeatCard}`}>
            <div className={styles.title} style={{ fontSize: "20px", fontWeight: "900", textAlign: "center" }}>LINK FAILURE</div>
            <div className={styles.controlBlock} style={{ textAlign: "center", marginTop: "10px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                Target link severed. Max network rotations exceeded, trigger lockouts enabled. Win streak reset.
              </p>
              <button className={styles.deployBtn} onClick={startNewMission} style={{ marginTop: "10px" }}>
                Deploy Retry Code
              </button>
              <button className={styles.actionBtn} onClick={() => setGameState("lobby")} style={{ marginTop: "5px" }}>
                Lobby Console
              </button>
            </div>
          </div>
        )}

        {/* Global Exit Navigation */}
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
