import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { collection, query, where, onSnapshot, setDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/OnlineLobby.module.sass";

interface RoomInfo {
  id: string;
  gameId: string;
  status: "waiting" | "playing" | "ended";
  players: {
    player1: { uid: string; displayName: string; symbol: string };
    player2?: { uid: string; displayName: string; symbol: string };
  };
}

const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getGameName = (gameId: string) => {
  if (gameId === "online_chess") return "MULTIPLAYER CHESS";
  if (gameId === "online_battleship") return "MULTIPLAYER BATTLESHIP";
  // Format online_tic_tac_toe -> Tic Tac Toe Duel
  const parts = gameId.replace("online_", "").split("_");
  return parts.map(p => p.toUpperCase()).join(" ") + " DUEL";
};

export default function OnlineLobby() {
  const router = useRouter();
  const { gameId } = router.query;
  const activeGameId = (gameId as string) || "online_chess";

  const { user, isVisitor } = useAuth();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [manualCode, setManualCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!router.isReady) return;

    // Fetch waiting rooms for active game
    const roomsRef = collection(db, "rooms");
    const q = query(
      roomsRef,
      where("gameId", "==", activeGameId),
      where("status", "==", "waiting")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const activeRooms: RoomInfo[] = [];
      snap.forEach((doc) => {
        activeRooms.push({ id: doc.id, ...doc.data() } as RoomInfo);
      });
      setRooms(activeRooms);
    });

    return () => unsubscribe();
  }, [activeGameId, router.isReady]);

  const getPlayerDetails = () => {
    const uid = user ? user.uid : "guest_" + Math.random().toString(36).substr(2, 9);
    const displayName = user
      ? user.displayName || user.email?.split("@")[0] || "Player"
      : isVisitor
      ? "Guest Player"
      : "Player";
    return { uid, displayName };
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setErrorMsg("");
    const { uid, displayName } = getPlayerDetails();
    const roomCode = generateRoomCode();

    const initialGameState = activeGameId === "online_chess"
      ? { fens: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"] }
      : activeGameId === "online_battleship"
      ? { player1Grid: null, player2Grid: null, player1Ships: null, player2Ships: null, shots: [] }
      : { moves: [] }; // Generic multiplayer state

    const roomData = {
      gameId: activeGameId,
      status: "waiting",
      createdAt: serverTimestamp(),
      players: {
        player1: { uid, displayName, symbol: "White" }
      },
      turn: uid,
      gameState: initialGameState
    };

    try {
      await setDoc(doc(db, "rooms", roomCode), roomData);
      
      // Route player to the match page
      if (activeGameId === "online_chess") {
        router.push(`/game/online/chess?roomId=${roomCode}`);
      } else if (activeGameId === "online_battleship") {
        router.push(`/game/online/battleship?roomId=${roomCode}`);
      } else {
        router.push(`/game/puzzle-hub?id=${activeGameId}&roomId=${roomCode}`);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
      setErrorMsg("DATABASE OVERFLOW. CANNOT INITIALIZE ROOM.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setErrorMsg("");
    const { uid, displayName } = getPlayerDetails();

    try {
      const roomRef = doc(db, "rooms", code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setErrorMsg("DECRYPTION ERROR: INVALID ROOM CODE.");
        setLoading(false);
        return;
      }

      const data = roomSnap.data();
      if (data.status !== "waiting") {
        setErrorMsg("ANOMALY RESOLVED: ROOM IS ALREADY PLAYING OR ENDED.");
        setLoading(false);
        return;
      }

      if (data.players.player1.uid === uid) {
        // Re-join own room
        if (activeGameId === "online_chess") {
          router.push(`/game/online/chess?roomId=${code}`);
        } else if (activeGameId === "online_battleship") {
          router.push(`/game/online/battleship?roomId=${code}`);
        } else {
          router.push(`/game/puzzle-hub?id=${activeGameId}&roomId=${code}`);
        }
        return;
      }

      // Join room as Player 2
      await updateDoc(roomRef, {
        status: "playing",
        "players.player2": { uid, displayName, symbol: "Black" }
      });

      if (activeGameId === "online_chess") {
        router.push(`/game/online/chess?roomId=${code}`);
      } else if (activeGameId === "online_battleship") {
        router.push(`/game/online/battleship?roomId=${code}`);
      } else {
        router.push(`/game/puzzle-hub?id=${activeGameId}&roomId=${code}`);
      }
    } catch (err) {
      console.error("Failed to join room:", err);
      setErrorMsg("CONNECTION REJECTED: COULD NOT BIND TO ROOM.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} id="online-lobby-page">
      <Head>
        <title>Match Lobby - Splend Game</title>
      </Head>

      <div className={styles.card}>
        <h1 className={styles.title}>{getGameName(activeGameId)} LOBBY</h1>

        {errorMsg && (
          <div
            style={{
              background: "rgba(255, 42, 109, 0.1)",
              border: "1px solid var(--error-color)",
              color: "var(--error-color)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
              textAlign: "center",
              fontWeight: "bold",
              fontFamily: "var(--font-display)"
            }}
            id="lobby-error"
          >
            {errorMsg}
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className={styles.btn}
            id="btn-create-lobby"
          >
            {loading ? "INITIALIZING SECTOR..." : "CREATE MATCH BLOCK"}
          </button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.secTitle}>JOIN MANUAL DECRYPT CODE</h2>
          <div className={styles.joinForm}>
            <input
              type="text"
              placeholder="ENTER 6-DIGIT CODE..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className={styles.input}
              maxLength={6}
              id="input-manual-code"
            />
            <button
              onClick={() => handleJoinRoom(manualCode)}
              disabled={loading || !manualCode}
              className={`${styles.btn} ${styles.btnAlt}`}
              style={{ flex: "none", padding: "12px 24px" }}
              id="btn-join-code"
            >
              CONNECT
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.secTitle}>ACTIVE DECRYPT CHANNELS</h2>
          <div className={styles.roomList} id="online-active-channels">
            {rooms.length === 0 ? (
              <div className={styles.noRooms} id="lobby-no-rooms">
                NO WAITING ROOMS FOUND. INITIALIZE A NEW MATCH BLOCK.
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className={styles.roomItem} id={`room-item-${room.id}`}>
                  <div className={styles.roomInfo}>
                    <span className={styles.roomCode}>CODE: {room.id}</span>
                    <span className={styles.roomHost}>
                      HOST: {room.players.player1.displayName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={loading}
                    className={`${styles.btn} ${styles.btnAlt}`}
                    style={{ flex: "none", padding: "8px 16px", fontSize: "10px" }}
                    id={`btn-join-room-${room.id}`}
                  >
                    CONNECT LINK
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
