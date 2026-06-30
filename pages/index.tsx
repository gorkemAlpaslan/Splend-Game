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
  },
  {
    id: "lights_out",
    title: "LIGHTS OUT ANOMALY",
    desc: "A grid of glowing nodes. Clicking a node toggles it and its orthogonal neighbors. Extinguish all nodes to bypass the block.",
    link: "/game/lights-out",
    category: "Grid"
  },
  {
    id: "grid_lock_2048",
    title: "GRID LOCK (2048)",
    desc: "Slide data blocks across a grid. Identical numerical bytes merge upon contact. Achieve the 2048 byte limit to compile the master key.",
    link: "/game/grid-lock-2048",
    category: "Math"
  },
  {
    id: "node_path_slider",
    title: "NODE PATH SLIDER",
    desc: "Rearrange scrambled optical track sections to create a clean, unbroken path connecting the start power core to the end output node.",
    link: "/game/node-path-slider",
    category: "Grid"
  },
  {
    id: "binary_matrix_hitori",
    title: "BINARY HITORI",
    desc: "Eliminate duplicate numbers in a network row or column by shading them out, ensuring remaining numbers don't touch shaded squares orthogonally.",
    link: "/game/binary-matrix-hitori",
    category: "Logic"
  },
  {
    id: "crossed_signal",
    title: "CROSSED SIGNAL",
    desc: "Untangle a web of logic nodes. Drag nodes around the screen to ensure no connection lines intersect or cross paths.",
    link: "/game/crossed-signal",
    category: "Logic"
  },
  {
    id: "laser_bounce",
    title: "LASER BOUNCE",
    desc: "Place and rotate angled optical mirrors to deflect a neon laser beam, guiding it around blockades and routing it into the target grid receptor.",
    link: "/game/laser-bounce",
    category: "Logic"
  },
  {
    id: "color_flood",
    title: "COLOR FLOOD",
    desc: "Start from the top-left node and flood the network grid by selecting colors, converting the entire grid into a single uniform color in limited steps.",
    link: "/game/color-flood",
    category: "Grid"
  },
  {
    id: "pattern_simon",
    title: "PATTERN SIMON",
    desc: "A cognitive memory test. Memorize the glowing cyber pattern sequence and replicate it precisely to access deeper directories.",
    link: "/game/pattern-simon",
    category: "Memory"
  },
  {
    id: "minesweeper_solo",
    title: "MINESWEEPER SOLO",
    desc: "Scan a grid of network sectors to identify hidden system mines. Use surrounding numerical clues to safely flag all dangerous sectors.",
    link: "/game/minesweeper-solo",
    category: "Grid"
  },
  {
    id: "block_match_tetris",
    title: "BLOCK MATCH",
    desc: "Rotate and position cascading data blocks into a neat solid stack. Clear lines of blocks to prevent stack overflows.",
    link: "/game/block-match-tetris",
    category: "Speed"
  },
  {
    id: "word_encryption_wordle",
    title: "WORD ENCRYPTION",
    desc: "Guess the secret 5-letter administrative keyword in 6 tries, using color coded feedback about letter matches.",
    link: "/game/word-encryption",
    category: "Word"
  },
  {
    id: "cipher_grid_kakuro",
    title: "CIPHER SUMS (KAKURO)",
    desc: "Fill in empty cells in a grid structure with numbers 1-9 so that the sum of each run matches the numeric clues given.",
    link: "/game/cipher-grid-kakuro",
    category: "Math"
  },
  {
    id: "path_tracer",
    title: "PATH TRACER",
    desc: "Draw a single, continuous, non-overlapping path that starts at the core and visits every square on the grid exactly once.",
    link: "/game/path-tracer",
    category: "Grid"
  },
  {
    id: "number_sum_kenken",
    title: "KENKEN MATRIX",
    desc: "Solve a grid puzzle using arithmetic rules. Fill cells with digits such that each row and column contains unique numbers matching target math equations.",
    link: "/game/number-sum-kenken",
    category: "Math"
  },
  {
    id: "chain_reactor",
    title: "CHAIN REACTOR",
    desc: "Trigger chain-reaction explosions in a grid by clicking cells. Expand cells to trigger neighbor bursts to clear all grid cells.",
    link: "/game/chain-reactor",
    category: "Logic"
  },
  {
    id: "pipe_connect",
    title: "PIPE CONNECT",
    desc: "Rotate separate pipe connectors to link the water grid together, preventing leaks and establishing a closed signal loop.",
    link: "/game/pipe-connect",
    category: "Grid"
  },
  {
    id: "slitherlink",
    title: "SLITHERLINK LOOP",
    desc: "Connect grid dots to form a single continuous loop. Numerical clues in cells dictate how many of its four borders must contain line segments.",
    link: "/game/slitherlink",
    category: "Grid"
  },
  {
    id: "hashi_bridges",
    title: "HASHI BRIDGES",
    desc: "Draw bridges between isolated node islands. Islands specify the exact number of connecting bridges needed, with no bridges crossing each other.",
    link: "/game/hashi-bridges",
    category: "Grid"
  },
  {
    id: "futoshiki",
    title: "FUTOSHIKI INEQUALITY",
    desc: "Fill a grid with numbers 1-N obeying inequality symbols (<, >) placed between adjacent cells.",
    link: "/game/futoshiki",
    category: "Math"
  },
  {
    id: "nurikabe",
    title: "NURIKABE ISLANDS",
    desc: "Shade a grid of nodes to form separate white islands of specified sizes, keeping all shaded tiles connected and without forming 2x2 pools.",
    link: "/game/nurikabe",
    category: "Grid"
  },
  {
    id: "tent_placement",
    title: "TENT PLACEMENT",
    desc: "Pitch virtual tents next to matching trees in a grid layout. Tents cannot touch each other, and column/row counts must align.",
    link: "/game/tent-placement",
    category: "Logic"
  },
  {
    id: "nonogram",
    title: "NONOGRAM LOGIC",
    desc: "Reveal hidden pixel art matrices by filling grid cells according to numeric run codes listed at the start of each row and column.",
    link: "/game/puzzle-hub?id=nonogram",
    category: "Grid"
  },
  {
    id: "cryptogram",
    title: "CRYPTOGRAM KEY",
    desc: "Decode an encrypted cybersecurity quote by figuring out the letter substitution cipher scheme used to scramble it.",
    link: "/game/puzzle-hub?id=cryptogram",
    category: "Word"
  },
  {
    id: "word_search",
    title: "WORD SEARCH GRID",
    desc: "Locate a hidden list of cyber terminology words buried inside a random jumble of letters horizontally, vertically, or diagonally.",
    link: "/game/puzzle-hub?id=word_search",
    category: "Word"
  },
  {
    id: "peg_solitaire",
    title: "PEG SOLITAIRE",
    desc: "Jump logic pegs over adjacent pegs into empty slots to eliminate them, trying to leave only a single center peg.",
    link: "/game/puzzle-hub?id=peg_solitaire",
    category: "Logic"
  },
  {
    id: "sudoku_master",
    title: "SUDOKU MASTER",
    desc: "A classic 9x9 sudoku logic solver. Fill every row, column, and 3x3 subgrid with numbers 1-9 without duplicates.",
    link: "/game/puzzle-hub?id=sudoku_master",
    category: "Grid"
  },
  {
    id: "anagram_decoder",
    title: "ANAGRAM DECODER",
    desc: "Rearrange scrambled letters to discover correct cybersecurity and terminal command keywords before the clock runs out.",
    link: "/game/puzzle-hub?id=anagram_decoder",
    category: "Word"
  },
  {
    id: "hex_hexagon_puzzle",
    title: "HEX HEXAGON",
    desc: "Drag and drop polygon shapes onto a hexagonal board, forming complete lines to dismantle blocks and optimize memory.",
    link: "/game/puzzle-hub?id=hex_hexagon_puzzle",
    category: "Grid"
  },
  {
    id: "logic_gates",
    title: "LOGIC GATE LINK",
    desc: "Configure input values to flow through logic gates (AND, OR, XOR) to trigger a positive True voltage at the final receiver.",
    link: "/game/puzzle-hub?id=logic_gates",
    category: "Logic"
  },
  {
    id: "number_pyramid",
    title: "NUMBER PYRAMID",
    desc: "Solve a numerical block pyramid. The value of each block is the sum of the two blocks directly beneath it.",
    link: "/game/puzzle-hub?id=number_pyramid",
    category: "Math"
  },
  {
    id: "matchstick_puzzles",
    title: "MATCHSTICK EQUATIONS",
    desc: "Move or remove a limited number of matchsticks to correct broken mathematical equations or geometric shapes.",
    link: "/game/puzzle-hub?id=matchstick_puzzles",
    category: "Math"
  },
  {
    id: "unblock_me_traffic",
    title: "GRID ESCAPE (UNBLOCK)",
    desc: "Slide horizontal and vertical blockades out of the path to guide the main red security key block to the exit gate.",
    link: "/game/puzzle-hub?id=unblock_me_traffic",
    category: "Grid"
  }
];

const ONLINE_GAMES: GameInfo[] = [
  {
    id: "online_chess",
    title: "MULTIPLAYER CHESS",
    desc: "Deploy your tactical chess piece algorithms in a real-time battle for the king core against an online opponent.",
    link: "/game/online/chess",
    category: "Board"
  },
  {
    id: "online_battleship",
    title: "MULTIPLAYER BATTLESHIP",
    desc: "Coordinate fleet placements, sweep radar lines, and deploy missile payloads to sink your rival's online grid ships.",
    link: "/game/online/battleship",
    category: "Board"
  },
  {
    id: "online_tic_tac_toe",
    title: "TIC TAC TOE DUEL",
    desc: "A lightning-fast 3x3 duel. Chain three markers in a row while blocking your opponent under speed-hacking timers.",
    link: "/online?gameId=online_tic_tac_toe",
    category: "Board"
  },
  {
    id: "online_connect_four",
    title: "CONNECT FOUR ARENA",
    desc: "Drop gravity-guided chips down columns. Align four matching chips horizontally, vertically, or diagonally before your opponent does.",
    link: "/online?gameId=online_connect_four",
    category: "Board"
  },
  {
    id: "online_checkers",
    title: "CHECKERS ONLINE",
    desc: "Jump diagonally across tiles to capture and eliminate your rival's network nodes in standard checker layout.",
    link: "/online?gameId=online_checkers",
    category: "Board"
  },
  {
    id: "online_reversi",
    title: "REVERSI BATTLE",
    desc: "Trap your opponent's tokens between yours to flip them. Maximize your colored discs count on the board in a strategy duel.",
    link: "/online?gameId=online_reversi",
    category: "Board"
  },
  {
    id: "online_dots_and_boxes",
    title: "DOTS & BOXES ARENA",
    desc: "Take turns connecting adjacent dots with lines. Complete boxes to claim ownership and gain extra turn moves.",
    link: "/online?gameId=online_dots_and_boxes",
    category: "Board"
  },
  {
    id: "online_mancala",
    title: "MANCALA DUEL",
    desc: "An ancient game of seed sowing and capture. Strategically distribute stones to fill your home database reservoir.",
    link: "/online?gameId=online_mancala",
    category: "Board"
  },
  {
    id: "online_gomoku",
    title: "GOMOKU PRO",
    desc: "Take turns placing pieces on an expansive grid. The first operator to line up exactly five pieces in a row is victorious.",
    link: "/online?gameId=online_gomoku",
    category: "Board"
  },
  {
    id: "online_type_racer",
    title: "CYBER SPEED TYPER",
    desc: "Race down a digital highway by typing cyber paragraphs. Precision and speed compile code blocks faster than your rival.",
    link: "/online?gameId=online_type_racer",
    category: "Speed"
  },
  {
    id: "online_memory_match",
    title: "MEMORY DUEL",
    desc: "Compete head-to-head to flip and match identical symbol tiles. High score wins the memory extraction round.",
    link: "/online?gameId=online_memory_match",
    category: "Memory"
  },
  {
    id: "online_minesweeper_race",
    title: "MINESWEEPER RACE",
    desc: "Race on a shared mines grid. Uncover safe spaces to earn points, but trigger mines to lose score multipliers.",
    link: "/online?gameId=online_minesweeper_race",
    category: "Grid"
  },
  {
    id: "online_hexxagon",
    title: "HEXXAGON INVASION",
    desc: "Clone or jump your cells across a hexagonal board. Capture neighboring opposing cells by converting them to your system color.",
    link: "/online?gameId=online_hexxagon",
    category: "Grid"
  },
  {
    id: "online_word_battle",
    title: "WORD BATTLE DUEL",
    desc: "Form highest-scoring vocabulary words from a shared scrambled alphabet letters pool under collapsing timer limits.",
    link: "/online?gameId=online_word_battle",
    category: "Word"
  },
  {
    id: "online_quiz_duel",
    title: "TRIVIA DUEL",
    desc: "Prove your supremacy in coding, computer history, and security protocols in a real-time round-based quiz.",
    link: "/online?gameId=online_quiz_duel",
    category: "Logic"
  },
  {
    id: "online_ludo",
    title: "LUDO ARENA",
    desc: "Roll virtual dice and race your four system security tokens around the active perimeter board to reach the home terminal.",
    link: "/online?gameId=online_ludo",
    category: "Board"
  },
  {
    id: "online_card_battle",
    title: "NET CARD STRATEGY",
    desc: "Draw, trade, and play arithmetic hacking action cards to overwhelm your opponent's shielding database.",
    link: "/online?gameId=online_card_battle",
    category: "Logic"
  },
  {
    id: "online_rock_paper_scissors",
    title: "RPS ARENA",
    desc: "Test your predictive hacking loops in a fast-paced classic Rock, Paper, Scissors game with special action multipliers.",
    link: "/online?gameId=online_rock_paper_scissors",
    category: "Logic"
  },
  {
    id: "online_speed_slide",
    title: "SLIDE PUZZLE RACE",
    desc: "Compete in real time to solve identical 3x3 sliding block configurations. First to match the layout secures the win.",
    link: "/online?gameId=online_speed_slide",
    category: "Grid"
  },
  {
    id: "online_backgammon",
    title: "BACKGAMMON ARENA",
    desc: "Roll tactical binary dice, navigate checkers, and bear off pieces while blocking your opponent in a backgammon arena.",
    link: "/online?gameId=online_backgammon",
    category: "Board"
  }
];

export default function LobbyPage() {
  const { user, isVisitor, stats } = useAuth();
  const [activeTab, setActiveTab] = useState<"single" | "multi">("single");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);

  const getDisplayName = () => {
    if (user) return user.displayName || user.email?.split("@")[0] || "Player";
    if (isVisitor) return "Guest Player";
    return "Player";
  };

  const getGamesList = () => {
    return activeTab === "single" ? SINGLE_PLAYER_GAMES : ONLINE_GAMES;
  };

  const categories = ["All", "Logic", "Grid", "Word", "Math", "Memory", "Board", "Speed"];

  const filteredGames = getGamesList().filter((game) => {
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
              {SINGLE_PLAYER_GAMES.length + ONLINE_GAMES.length}
            </div>
            <div className={styles.statLabel}>SECTOR ANOMALIES LOGGED</div>
          </div>
        </div>
      </section>

      {/* Main Category Tabs */}
      <div className={styles.tabsContainer} id="main-lobby-tabs">
        <button
          className={`${styles.tabButton} ${activeTab === "single" ? styles.activeTabButton : ""}`}
          onClick={() => {
            setActiveTab("single");
            setSelectedCategory("All");
          }}
          id="btn-tab-single"
        >
          SINGLE PLAYER ANOMALIES ({SINGLE_PLAYER_GAMES.length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "multi" ? styles.activeTabButton : ""}`}
          onClick={() => {
            setActiveTab("multi");
            setSelectedCategory("All");
          }}
          id="btn-tab-multi"
        >
          MULTIPLAYER ARENA ({ONLINE_GAMES.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchFilterBar} id="search-filter-bar">
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Search ${activeTab === "single" ? "41 anomalies" : "20 arenas"}...`}
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
          {activeTab === "single" ? "SINGLE-PLAYER SYSTEM FILES" : "ONLINE PROTOCOL STREAM"}
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
                      <span className={activeTab === "single" ? styles.cardBadge : styles.cardBadgeOnline}>
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
                      {activeTab === "single" ? "Decrypt Sector" : "Connect Terminal"}
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
