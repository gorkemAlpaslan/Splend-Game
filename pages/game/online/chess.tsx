import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/Chess.module.sass";

type Piece = string;
type Board = Piece[][];

const INITIAL_BOARD: Board = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

const PIECE_SYMBOLS: { [key: string]: string } = {
  "r": "♜", "n": "♞", "b": "♝", "q": "♛", "k": "♚", "p": "♟",
  "R": "♖", "N": "♘", "B": "♗", "Q": "♕", "K": "♔", "P": "♙",
  "": ""
};

// Check if a piece is White
const isWhitePiece = (p: string): boolean => {
  return p !== "" && p === p.toUpperCase();
};

// Simple Chess Move Validator
const isValidMove = (
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  piece: string,
  board: Board
): boolean => {
  if (fromRow === toRow && fromCol === toCol) return false;
  
  const target = board[toRow][toCol];
  const isWhite = isWhitePiece(piece);
  
  // Cannot capture own pieces
  if (target !== "" && isWhite === isWhitePiece(target)) {
    return false;
  }

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

  switch (piece.toUpperCase()) {
    case "P": // Pawn
      if (isWhite) {
        // Forward 1 step
        if (toCol === fromCol && toRow === fromRow - 1 && target === "") {
          return true;
        }
        // Forward 2 steps from initial row
        if (toCol === fromCol && fromRow === 6 && toRow === 4 && board[5][fromCol] === "" && target === "") {
          return true;
        }
        // Capture diagonally
        if (colDiff === 1 && toRow === fromRow - 1 && target !== "" && !isWhitePiece(target)) {
          return true;
        }
      } else {
        // Black forward 1
        if (toCol === fromCol && toRow === fromRow + 1 && target === "") {
          return true;
        }
        // Black forward 2 from row 1
        if (toCol === fromCol && fromRow === 1 && toRow === 3 && board[2][fromCol] === "" && target === "") {
          return true;
        }
        // Capture diagonally
        if (colDiff === 1 && toRow === fromRow + 1 && target !== "" && isWhitePiece(target)) {
          return true;
        }
      }
      return false;

    case "R": // Rook
      if (fromRow !== toRow && fromCol !== toCol) return false;
      // Check path blocking
      let r = fromRow + rowStep;
      let c = fromCol + colStep;
      while (r !== toRow || c !== toCol) {
        if (board[r][c] !== "") return false;
        r += rowStep;
        c += colStep;
      }
      return true;

    case "B": // Bishop
      if (rowDiff !== colDiff) return false;
      // Check path blocking
      let br = fromRow + rowStep;
      let bc = fromCol + colStep;
      while (br !== toRow && bc !== toCol) {
        if (board[br][bc] !== "") return false;
        br += rowStep;
        bc += colStep;
      }
      return true;

    case "Q": // Queen (Rook + Bishop combination)
      if (rowDiff !== colDiff && fromRow !== toRow && fromCol !== toCol) return false;
      // Check path
      let qr = fromRow + rowStep;
      let qc = fromCol + colStep;
      while (qr !== toRow || qc !== toCol) {
        if (board[qr][qc] !== "") return false;
        qr += rowStep;
        qc += colStep;
      }
      return true;

    case "N": // Knight (L-Shape)
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

    case "K": // King
      return rowDiff <= 1 && colDiff <= 1;

    default:
      return false;
  }
};

export default function ChessGamePage() {
  const router = useRouter();
  const { roomId } = router.query;
  const { user, isVisitor, updateStats } = useAuth();

  const [roomData, setRoomData] = useState<any>(null);
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [validDestinations, setValidDestinations] = useState<[number, number][]>([]);
  const [clientPlayerColor, setClientPlayerColor] = useState<"White" | "Black" | "Observer">("Observer");
  const [gameOverHandled, setGameOverHandled] = useState<boolean>(false);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId as string);
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
        if (data.gameState && data.gameState.board) {
          setBoard(data.gameState.board);
        } else {
          // Initialize board in firebase if not present
          updateDoc(roomRef, {
            "gameState.board": INITIAL_BOARD
          });
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Determine local user's role/color
  useEffect(() => {
    if (!roomData || !user) return;

    if (roomData.players.player1.uid === user.uid) {
      setClientPlayerColor("White");
    } else if (roomData.players.player2 && roomData.players.player2.uid === user.uid) {
      setClientPlayerColor("Black");
    } else {
      setClientPlayerColor("Observer");
    }
  }, [roomData, user]);

  // Handle victory scoring once
  useEffect(() => {
    if (!roomData || gameOverHandled || clientPlayerColor === "Observer") return;

    if (roomData.status === "ended" && roomData.winnerId) {
      setGameOverHandled(true);
      const isWin = roomData.winnerId === user?.uid;
      updateStats("online_chess", 50, isWin);
    }
  }, [roomData, gameOverHandled, clientPlayerColor]);

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
        CONNECTING TO CHESS CORE NETWORK...
      </div>
    );
  }

  const p1 = roomData.players.player1;
  const p2 = roomData.players.player2;

  // Active status message
  const getStatusText = () => {
    if (roomData.status === "waiting") return "WAITING FOR OPPONENT TO LINK IN...";
    if (roomData.status === "ended") {
      const winnerName = roomData.winnerId === p1.uid ? p1.displayName : p2?.displayName || "Player 2";
      return `SECTOR SECURED. WINNER: ${winnerName.toUpperCase()}`;
    }
    const currentTurnUser = roomData.turn === p1.uid ? p1 : p2;
    return `TRANSMITTING MOVES. ACTIVE: ${currentTurnUser?.displayName.toUpperCase()}`;
  };

  const isMyTurn = () => {
    return roomData.status === "playing" && roomData.turn === user?.uid;
  };

  const calculateValidDestinations = (row: number, col: number, piece: string) => {
    const valid: [number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isValidMove(row, col, r, c, piece, board)) {
          valid.push([r, c]);
        }
      }
    }
    setValidDestinations(valid);
  };

  const handleCellClick = async (row: number, col: number) => {
    if (!isMyTurn() || clientPlayerColor === "Observer") return;

    const piece = board[row][col];

    // If a cell is already selected
    if (selectedCell) {
      const [fromRow, fromCol] = selectedCell;
      const selectedPiece = board[fromRow][fromCol];

      // If clicked on valid destination, make the move
      const isDestinationValid = validDestinations.some(([vr, vc]) => vr === row && vc === col);
      if (isDestinationValid) {
        const newBoard = board.map((r) => [...r]);
        newBoard[row][col] = selectedPiece;
        newBoard[fromRow][fromCol] = "";

        // Check if opposing king is captured to trigger victory
        const opponentKing = selectedPiece.toUpperCase() === "K" ? "k" : "K"; // Not fully legal checkmate, but solid king capture
        let isKingCaptured = true;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (newBoard[r][c] === (selectedPiece === selectedPiece.toUpperCase() ? "k" : "K")) {
              isKingCaptured = false;
            }
          }
        }

        const nextTurnUid = roomData.turn === p1.uid ? p2.uid : p1.uid;
        const roomRef = doc(db, "rooms", roomId as string);

        if (isKingCaptured) {
          await updateDoc(roomRef, {
            "gameState.board": newBoard,
            status: "ended",
            winnerId: user?.uid
          });
        } else {
          await updateDoc(roomRef, {
            "gameState.board": newBoard,
            turn: nextTurnUid
          });
        }

        setSelectedCell(null);
        setValidDestinations([]);
        return;
      }
    }

    // Select piece if it belongs to current player
    if (piece !== "") {
      const pieceIsWhite = isWhitePiece(piece);
      const isMyPiece = (clientPlayerColor === "White" && pieceIsWhite) || (clientPlayerColor === "Black" && !pieceIsWhite);

      if (isMyPiece) {
        setSelectedCell([row, col]);
        calculateValidDestinations(row, col, piece);
      } else {
        setSelectedCell(null);
        setValidDestinations([]);
      }
    } else {
      setSelectedCell(null);
      setValidDestinations([]);
    }
  };

  // Flip coordinates if rendering from Black piece perspective
  const getRenderCell = (r: number, c: number) => {
    const row = clientPlayerColor === "Black" ? 7 - r : r;
    const col = clientPlayerColor === "Black" ? 7 - c : c;

    const piece = board[row][col];
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const isHighlighted = validDestinations.some(([vr, vc]) => vr === row && vc === col);
    const isLightCell = (row + col) % 2 === 0;

    return (
      <div
        key={`${row}-${col}`}
        className={`${styles.cell} ${isLightCell ? styles.cellLight : styles.cellDark} ${
          isSelected ? styles.cellSelected : ""
        } ${isHighlighted ? styles.cellHighlighted : ""}`}
        onClick={() => handleCellClick(row, col)}
      >
        {PIECE_SYMBOLS[piece]}
      </div>
    );
  };

  return (
    <div className={styles.container} id="chess-game-page">
      <Head>
        <title>Multiplayer Chess - Splend Game</title>
      </Head>

      <div className={styles.header}>
        <h1 className={styles.title}>CHESS PROTOCOL MULTIPLAYER</h1>
        <span className={styles.roomCode}>ENCRYPTED CHANNEL: {roomId}</span>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.leftPanel}>
          <div className={styles.statusBox}>
            <span className={styles.statusTitle}>CHANNEL LINK SIGNAL</span>
            <span
              className={`${styles.statusVal} ${
                roomData.status === "playing" ? styles.statusValTurn : ""
              }`}
              id="game-status-label"
            >
              {getStatusText()}
            </span>
          </div>

          <div className={styles.playersCard} id="players-card">
            <span className={styles.statusTitle}>CONNECTED PROTOCOLS</span>
            <div className={`${styles.playerRow} ${roomData.turn === p1.uid ? styles.playerActive : ""}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`${styles.colorIndicator} ${styles.whiteInd}`} />
                <span>{p1.displayName}</span>
              </div>
              <span style={{ fontSize: "10px", opacity: 0.6 }}>WHITE</span>
            </div>
            {p2 ? (
              <div className={`${styles.playerRow} ${roomData.turn === p2.uid ? styles.playerActive : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={`${styles.colorIndicator} ${styles.blackInd}`} />
                  <span>{p2.displayName}</span>
                </div>
                <span style={{ fontSize: "10px", opacity: 0.6 }}>BLACK</span>
              </div>
            ) : (
              <div className={styles.playerRow} style={{ opacity: 0.5 }}>
                <span>WAITING PLAYER...</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.boardContainer}>
          <div className={styles.board} id="chess-board">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => getRenderCell(r, c))
            )}
          </div>
        </div>
      </div>

      {roomData.status === "ended" && (
        <div className={styles.winOverlay} id="game-over-overlay">
          <div className={styles.winModal}>
            <span className={styles.winTitle}>CONNECTION STABILIZED</span>
            <p className={styles.winText}>
              The chess king core has been captured. User profile database scores have been updated correctly.
            </p>
            <Link href="/" className={styles.btnAction} id="btn-victory-home">
              Return Database
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
