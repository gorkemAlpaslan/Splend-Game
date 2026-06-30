import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/Battleship.module.sass";

interface Shot {
  attacker: string;
  row: number;
  col: number;
  isHit: boolean;
}

export default function BattleshipGamePage() {
  const router = useRouter();
  const { roomId } = router.query;
  const { user, updateStats } = useAuth();

  const [roomData, setRoomData] = useState<any>(null);
  const [placedShips, setPlacedShips] = useState<string[]>([]); // Array of 'row,col' strings local placement
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [clientRole, setClientRole] = useState<"player1" | "player2" | "Observer">("Observer");
  const [gameOverHandled, setGameOverHandled] = useState<boolean>(false);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId as string);
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Determine role/player indexing
  useEffect(() => {
    if (!roomData || !user) return;

    if (roomData.players.player1.uid === user.uid) {
      setClientRole("player1");
      if (roomData.gameState && roomData.gameState.player1Ships) {
        setIsDeployed(true);
      }
    } else if (roomData.players.player2 && roomData.players.player2.uid === user.uid) {
      setClientRole("player2");
      if (roomData.gameState && roomData.gameState.player2Ships) {
        setIsDeployed(true);
      }
    } else {
      setClientRole("Observer");
    }
  }, [roomData, user]);

  // Handle victory scoring once
  useEffect(() => {
    if (!roomData || gameOverHandled || clientRole === "Observer") return;

    if (roomData.status === "ended" && roomData.winnerId) {
      setGameOverHandled(true);
      const isWin = roomData.winnerId === user?.uid;
      updateStats("online_battleship", 60, isWin);
    }
  }, [roomData, gameOverHandled, clientRole]);

  if (!roomData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#030308",
          color: "var(--primary-color)",
          fontFamily: "var(--font-display)",
          fontSize: "20px"
        }}
      >
        CONNECTING TO BATTLESHIP RADAR SYSTEM...
      </div>
    );
  }

  const p1 = roomData.players.player1;
  const p2 = roomData.players.player2;

  const player1Ships = roomData.gameState?.player1Ships || [];
  const player2Ships = roomData.gameState?.player2Ships || [];
  const shots: Shot[] = roomData.gameState?.shots || [];

  const bothDeployed = player1Ships.length > 0 && player2Ships.length > 0;

  const isMyTurn = () => {
    return roomData.status === "playing" && bothDeployed && roomData.turn === user?.uid;
  };

  const getStatusText = () => {
    if (!p2) return "WAITING FOR OPPONENT TO CONNECT PROTOCOL...";
    
    if (!bothDeployed) {
      const p1Ready = player1Ships.length > 0;
      const p2Ready = player2Ships.length > 0;
      if (!p1Ready && !p2Ready) return "DEPLOY PHASE: BOTH NETWORKS CONFIGURING SHIPS.";
      if (p1Ready && !p2Ready) return `DEPLOY PHASE: WAITING FOR ${p2.displayName.toUpperCase()} TO DEPLOY.`;
      if (!p1Ready && p2Ready) return `DEPLOY PHASE: WAITING FOR ${p1.displayName.toUpperCase()} TO DEPLOY.`;
    }

    if (roomData.status === "ended") {
      const winnerName = roomData.winnerId === p1.uid ? p1.displayName : p2.displayName;
      return `SECTOR COMPLETED. WINNER: ${winnerName.toUpperCase()}`;
    }

    const currentTurnUser = roomData.turn === p1.uid ? p1 : p2;
    return `COMBAT PHASE: ACTIVE RADAR CONTROL TO: ${currentTurnUser?.displayName.toUpperCase()}`;
  };

  // Toggle placement cell
  const handlePlacementClick = (row: number, col: number) => {
    if (isDeployed || clientRole === "Observer") return;

    const coord = `${row},${col}`;
    if (placedShips.includes(coord)) {
      setPlacedShips(placedShips.filter((c) => c !== coord));
    } else {
      if (placedShips.length < 5) {
        setPlacedShips([...placedShips, coord]);
      }
    }
  };

  const handleConfirmDeployment = async () => {
    if (placedShips.length !== 5 || clientRole === "Observer") return;

    const roomRef = doc(db, "rooms", roomId as string);
    const updates: any = {};

    if (clientRole === "player1") {
      updates["gameState.player1Ships"] = placedShips;
    } else {
      updates["gameState.player2Ships"] = placedShips;
    }

    // If opponent has already deployed, change room status to active combat playing
    const opponentShips = clientRole === "player1" ? player2Ships : player1Ships;
    if (opponentShips.length > 0) {
      updates.status = "playing";
    }

    await updateDoc(roomRef, updates);
    setIsDeployed(true);
  };

  // Handle combat targeting fire
  const handleFireClick = async (row: number, col: number) => {
    if (!isMyTurn() || clientRole === "Observer") return;

    const coord = `${row},${col}`;
    // Check if we already targeted this cell
    const alreadyShot = shots.some(
      (s) => s.attacker === user?.uid && s.row === row && s.col === col
    );
    if (alreadyShot) return;

    // Check hit
    const opponentShips = clientRole === "player1" ? player2Ships : player1Ships;
    const isHit = opponentShips.includes(coord);

    const newShots = [...shots, { attacker: user!.uid, row, col, isHit }];

    const opponentRole = clientRole === "player1" ? "player2" : "player1";
    const opponentUid = roomData.players[opponentRole].uid;

    // Check if opponent is completely defeated (all ships hit)
    const hitsOnOpponent = newShots.filter((s) => s.attacker === user?.uid && s.isHit);
    const isDefeated = hitsOnOpponent.length >= 5;

    const roomRef = doc(db, "rooms", roomId as string);
    const updates: any = {
      "gameState.shots": newShots,
      turn: opponentUid
    };

    if (isDefeated) {
      updates.status = "ended";
      updates.winnerId = user?.uid;
    }

    await updateDoc(roomRef, updates);
  };

  const renderPlacementGrid = () => {
    return (
      <div className={styles.gridWrapper}>
        <span className={styles.gridTitle}>DEPLOY SECURE FLEET CORES (5 SECTORS)</span>
        <div className={styles.grid} id="battleship-placement-grid">
          {Array.from({ length: 10 }).map((_, r) =>
            Array.from({ length: 10 }).map((_, c) => {
              const coord = `${r},${c}`;
              const isSelected = placedShips.includes(coord);
              return (
                <div
                  key={coord}
                  onClick={() => handlePlacementClick(r, c)}
                  className={`${styles.cell} ${isSelected ? styles.cellShip : styles.cellOcean}`}
                />
              );
            })
          )}
        </div>
        <button
          onClick={handleConfirmDeployment}
          disabled={placedShips.length !== 5 || isDeployed}
          className={styles.btnAction}
          id="btn-confirm-deployment"
          style={{ marginTop: "10px" }}
        >
          {isDeployed ? "DEPLOYED SECURE" : "CONFIRM DEPLOYMENT"}
        </button>
      </div>
    );
  };

  const renderCombatGrids = () => {
    const opponentRole = clientRole === "player1" ? "player2" : "player1";
    const opponentName = roomData.players[opponentRole]?.displayName || "Opponent";
    const myShips = clientRole === "player1" ? player1Ships : player2Ships;

    return (
      <div className={styles.combatContainer} id="battleship-combat-view">
        {/* Opponent Radar Grid - Where we click to target and fire */}
        <div className={styles.gridWrapper}>
          <span className={styles.gridTitle}>RADAR TARGET SCREEN: {opponentName.toUpperCase()}</span>
          <div className={styles.grid} id="radar-target-grid">
            {Array.from({ length: 10 }).map((_, r) =>
              Array.from({ length: 10 }).map((_, c) => {
                // Find if we have already shot here
                const shot = shots.find(
                  (s) => s.attacker === user?.uid && s.row === r && s.col === c
                );
                
                let cellClass = styles.cellOcean;
                let symbol = "";
                if (shot) {
                  cellClass = shot.isHit ? styles.cellHit : styles.cellMiss;
                  symbol = shot.isHit ? "X" : "O";
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleFireClick(r, c)}
                    className={`${styles.cell} ${cellClass}`}
                  >
                    {symbol}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Local Grid - Where opponent's shots show on our ships */}
        <div className={styles.gridWrapper}>
          <span className={styles.gridTitle}>MY FLEET SHIELDS SYSTEM</span>
          <div className={styles.grid} id="my-shields-grid">
            {Array.from({ length: 10 }).map((_, r) =>
              Array.from({ length: 10 }).map((_, c) => {
                const coord = `${r},${c}`;
                const hasShip = myShips.includes(coord);
                // Find if opponent shot here
                const opponentUid = roomData.players[opponentRole].uid;
                const shot = shots.find(
                  (s) => s.attacker === opponentUid && s.row === r && s.col === c
                );

                let cellClass = hasShip ? styles.cellShip : styles.cellOcean;
                let symbol = "";
                if (shot) {
                  cellClass = shot.isHit ? styles.cellHit : styles.cellMiss;
                  symbol = shot.isHit ? "X" : "O";
                }

                return (
                  <div key={coord} className={`${styles.cell} ${cellClass}`}>
                    {symbol}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container} id="battleship-game-page">
      <Head>
        <title>Multiplayer Battleship - Splend Game</title>
      </Head>

      <div className={styles.header}>
        <h1 className={styles.title}>BATTLESHIP CORE INTERFACE</h1>
        <span className={styles.roomCode}>DECRYPT CODE: {roomId}</span>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.leftPanel}>
          <div className={styles.statusBox}>
            <span className={styles.statusTitle}>RADAR COMPILER DATA</span>
            <span
              className={`${styles.statusVal} ${isMyTurn() ? styles.statusValTurn : ""}`}
              id="game-status-label"
            >
              {getStatusText()}
            </span>
          </div>

          {p2 && (
            <div className={styles.playersCard} id="players-card">
              <span className={styles.statusTitle}>FLEET LINK STATS</span>
              <div className={`${styles.playerRow} ${roomData.turn === p1.uid ? styles.playerActive : ""}`}>
                <span>{p1.displayName}</span>
                <span style={{ fontSize: "10px", opacity: 0.6 }}>READY</span>
              </div>
              <div className={`${styles.playerRow} ${roomData.turn === p2.uid ? styles.playerActive : ""}`}>
                <span>{p2.displayName}</span>
                <span style={{ fontSize: "10px", opacity: 0.6 }}>READY</span>
              </div>
            </div>
          )}
        </div>

        {/* Render grid placement or active combat */}
        {!bothDeployed && clientRole !== "Observer" ? renderPlacementGrid() : renderCombatGrids()}
      </div>

      {roomData.status === "ended" && (
        <div className={styles.winOverlay} id="game-over-overlay">
          <div className={styles.winModal}>
            <span className={styles.winTitle}>RADAR MATCH SECURED</span>
            <p className={styles.winText}>
              All enemy ship data structures have been destroyed. Multipliers and global points added.
            </p>
            <Link href="/" className={styles.btnAction} id="btn-victory-home">
              Close Socket Connection
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
