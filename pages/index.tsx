import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import GamePreview from "@/components/games/GamePreview";
import styles from "@/styles/Lobby.module.sass";

interface GameInfo {
  id: string;
  title: string;
  desc: string;
  link: string;
  category: "Logic" | "Grid" | "Word" | "Math" | "Memory" | "Board" | "Speed";
}

const SINGLE_PLAYER_GAMES: GameInfo[] = [
  {
    id: "positive_negative",
    title: "POSITIVE & NEGATIVE",
    desc: "A strategic game of numbers, targets, and risk management. Reveal boxes, use the proximity radar to scan surrounding values, and retreat safely once you reach your goal to secure multipliers and win streaks.",
    link: "/game/positive-negative",
    category: "Math"
  },
  {
    id: "grid_solver",
    title: "QUANTUM LINK",
    desc: "Rotate optical node conduits to establish a secure data stream from the Transmitter core to all Data Receivers. Evade system firewall blocks to secure maximum throughput.",
    link: "/game/grid-solver",
    category: "Grid"
  },
  {
    id: "memory_matrix",
    title: "MEMORY MATRIX",
    desc: "Deconstruct temporary encrypted sectors. Memorize flashing coordinates in a high-speed matrix and restore the memory alignment correctly to bypass network defenses.",
    link: "/game/memory-matrix",
    category: "Memory"
  },
  {
    id: "wave_tuner",
    title: "WAVE TUNER",
    desc: "Adjust and tune Amplitude, Frequency, and Phase sliders to match encrypted wave signals and bypass security checks.",
    link: "/game/wave-tuner",
    category: "Logic"
  },
  {
    id: "firewall_defuse",
    title: "FIREWALL DEFUSE",
    desc: "Tackle a grid of firewall nodes. Activating a node flips its state and neighbors. Defuse all active nodes to override the security lock.",
    link: "/game/firewall-defuse",
    category: "Grid"
  },
  {
    id: "matrix_runner",
    title: "MATRIX RUNNER",
    desc: "Steer a high-speed light stream (snake) through a network grid. Consume data packets to compile files, avoiding wall firewalls.",
    link: "/game/matrix-runner",
    category: "Speed"
  },
  {
    id: "protocol_stack",
    title: "PROTOCOL STACK",
    desc: "Re-organize network protocol packets in a Hanoi Tower model. Move stacks from Terminal A to C, ensuring packet sizes stack correctly.",
    link: "/game/protocol-stack",
    category: "Logic"
  },
  {
    id: "cipher_decryptor",
    title: "CIPHER DECRYPTOR",
    desc: "Perform a brute-force decryption. Guess the 4-digit hexadecimal passcode using matching lock indicators and digit alerts.",
    link: "/game/cipher-decryptor",
    category: "Logic"
  },
  {
    id: "hex_sudoku",
    title: "HEX SUDOKU",
    desc: "Restore encrypted hex code blocks. Complete a 4x4 matrix using digits 1-4 without any overlaps in lines, columns, or quadrants.",
    link: "/game/hex-sudoku",
    category: "Grid"
  }
];

export default function LobbyPage() {
  const { user, isVisitor, stats } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);

  const getDisplayName = () => {
    if (user) return user.displayName || user.email?.split("@")[0] || "Player";
    if (isVisitor) return "Guest Player";
    return "Player";
  };

  const categories = ["All", "Logic", "Grid", "Word", "Math", "Memory", "Board", "Speed"];

  const filteredGames = SINGLE_PLAYER_GAMES.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.lobbyContainer} id="lobby-page">
      <Head>
        <title>Splend Game - Cyber Puzzle Portal</title>
        <meta name="description" content="Welcome to Splend Game, a futuristic collection of strategic numbers and logic puzzles. Play, earn points, and climb the global leaderboards." />
      </Head>

      {/* Greeting and General Stats Section */}
      <section className={styles.welcomeBlock} id="welcome-block">
        <h1 className={styles.greeting} id="lobby-greeting">
          WELCOME, {getDisplayName().toUpperCase()}
        </h1>
        <p className={styles.subGreeting}>
          Access sector anomalies and resolve compiler errors. Connect to real-time multiplayer duels or clear 41 custom mathematical logic grids.
        </p>

        <div className={styles.statsOverview} id="stats-overview">
          <div className={styles.statCard}>
            <div className={styles.statVal}>{stats.globalScore}</div>
            <div className={styles.statLabel}>GLOBAL SCORE</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>
              {user ? "ONLINE MATRIX" : isVisitor ? "LOCAL MATRIX" : "OFFLINE"}
            </div>
            <div className={styles.statLabel}>COMPILER STATUS</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>
              {SINGLE_PLAYER_GAMES.length}
            </div>
            <div className={styles.statLabel}>SECTOR ANOMALIES LOGGED</div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className={styles.searchFilterBar} id="search-filter-bar">
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Search ${SINGLE_PLAYER_GAMES.length} anomalies...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="input-game-search"
        />

        <div className={styles.categoryContainer}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryChip} ${selectedCategory === cat ? styles.activeCategoryChip : ""}`}
              onClick={() => setSelectedCategory(cat)}
              id={`btn-cat-${cat.toLowerCase()}`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Games Catalog Section */}
      <section className={styles.gamesSection} id="games-section">
        <h2 className={styles.sectionTitle}>
          SINGLE-PLAYER SYSTEM FILES
        </h2>

        {filteredGames.length === 0 ? (
          <div className={styles.emptyState} id="lobby-empty-state">
            NO CORRESPONDING SECTORS LOCATED IN DATABASE.
          </div>
        ) : (
          <div className={styles.gamesGrid} id="games-grid">
            {filteredGames.map((game) => {
              const gameStats = stats.games[game.id] || { score: 0, losses: 0, winStreak: 0, highScore: 0 };
              const isHovered = hoveredGameId === game.id;

              return (
                <div
                  key={game.id}
                  className={styles.gameCard}
                  onMouseEnter={() => setHoveredGameId(game.id)}
                  onMouseLeave={() => setHoveredGameId(null)}
                  id={`card-${game.id}-game`}
                >
                  {/* Canvas Hover Preview Component */}
                  <div className={styles.previewContainer}>
                    <GamePreview gameId={game.id} isHovered={isHovered} />
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{game.title}</h3>
                      <span className={styles.cardBadge}>
                        {game.category.toUpperCase()}
                      </span>
                    </div>

                    <p className={styles.cardDesc}>{game.desc}</p>

                    <div className={styles.cardStats}>
                      <div className={styles.cardStatItem}>
                        <span className={styles.val}>{gameStats.score}</span>
                        <span className={styles.lbl}>Score</span>
                      </div>
                      <div className={styles.cardStatItem}>
                        <span className={styles.val}>{gameStats.highScore}</span>
                        <span className={styles.lbl}>Streak</span>
                      </div>
                      <div className={styles.cardStatItem}>
                        <span className={styles.val}>{gameStats.losses}</span>
                        <span className={styles.lbl}>Losses</span>
                      </div>
                    </div>

                    <Link href={game.link} className={styles.playBtn} id={`btn-play-${game.id}`}>
                      Decrypt Sector
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
