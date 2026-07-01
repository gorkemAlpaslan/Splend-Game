import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/Leaderboard.module.sass";

interface RankItem {
  uid: string;
  displayName: string;
  globalScore: number;
  games?: {
    [gameId: string]: {
      score: number;
      losses: number;
      winStreak: number;
      highScore: number;
    };
  };
}

const LEADERBOARD_TABS = [
  { id: "global", label: "GLOBAL RANKING", path: "globalScore" },
  { id: "pn", label: "POSITIVE & NEGATIVE", path: "games.positive_negative.score" },
  { id: "gs", label: "QUANTUM LINK", path: "games.grid_solver.score" },
  { id: "mm", label: "MEMORY MATRIX", path: "games.memory_matrix.score" },
  { id: "wt", label: "WAVE TUNER", path: "games.wave_tuner.score" },
  { id: "fd", label: "FIREWALL DEFUSE", path: "games.firewall_defuse.score" },
  { id: "mr", label: "MATRIX RUNNER", path: "games.matrix_runner.score" },
  { id: "ps", label: "PROTOCOL STACK", path: "games.protocol_stack.score" },
  { id: "cd", label: "CIPHER DECRYPTOR", path: "games.cipher_decryptor.score" },
  { id: "hs", label: "HEX SUDOKU", path: "games.hex_sudoku.score" }
];

const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [rankings, setRankings] = useState<{ [tabId: string]: RankItem[] }>({});
  const [loadingRankings, setLoadingRankings] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { user, isVisitor } = useAuth();

  useEffect(() => {
    const fetchRankings = async () => {
      setLoadingRankings(true);
      try {
        const usersRef = collection(db, "users");
        const newRankings: { [tabId: string]: RankItem[] } = {};

        // Fetch all rankings in parallel
        await Promise.all(
          LEADERBOARD_TABS.map(async (tab) => {
            try {
              const q = query(usersRef, orderBy(tab.path, "desc"), limit(20));
              const snap = await getDocs(q);
              const list: RankItem[] = [];
              snap.forEach((doc) => {
                list.push({ uid: doc.id, ...doc.data() } as RankItem);
              });
              newRankings[tab.id] = list;
            } catch (err) {
              console.error(`Failed to fetch rankings for ${tab.id}:`, err);
              newRankings[tab.id] = [];
            }
          })
        );

        setRankings(newRankings);
      } catch (err) {
        console.error("Failed to fetch leaderboards from firestore:", err);
      } finally {
        setLoadingRankings(false);
      }
    };

    fetchRankings();
  }, []);

  const getRankBadge = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return <span className={`${styles.rankBadge} ${styles.rank1}`}>1</span>;
    if (rank === 2) return <span className={`${styles.rankBadge} ${styles.rank2}`}>2</span>;
    if (rank === 3) return <span className={`${styles.rankBadge} ${styles.rank3}`}>3</span>;
    return <span>{rank}</span>;
  };

  const isCurrentUser = (rowUid: string) => {
    return user && user.uid === rowUid;
  };

  const activeRankings = rankings[activeTab] || [];

  const getActiveGameKey = () => {
    if (activeTab === "pn") return "positive_negative";
    if (activeTab === "gs") return "grid_solver";
    if (activeTab === "mm") return "memory_matrix";
    if (activeTab === "wt") return "wave_tuner";
    if (activeTab === "fd") return "firewall_defuse";
    if (activeTab === "mr") return "matrix_runner";
    if (activeTab === "ps") return "protocol_stack";
    if (activeTab === "cd") return "cipher_decryptor";
    return "hex_sudoku";
  };

  // Filter rankings by search query
  const filteredRankings = activeRankings.filter((row) => {
    const name = row.displayName || "Anonymous Player";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Podium (Top 3 of current tab)
  const podiumEntries = activeRankings.slice(0, 3);
  const secondPlace = podiumEntries[1] || null;
  const firstPlace = podiumEntries[0] || null;
  const thirdPlace = podiumEntries[2] || null;

  // Aggregate values for general stats
  const totalCompetitors = activeRankings.length;
  const highestScoreVal = activeRankings[0]
    ? activeTab === "global"
      ? activeRankings[0].globalScore
      : activeRankings[0].games?.[getActiveGameKey()]?.score || 0
    : 0;
  const averageScoreVal =
    totalCompetitors > 0
      ? Math.round(
          activeRankings.reduce((sum, row) => {
            const score =
              activeTab === "global" ? row.globalScore : row.games?.[getActiveGameKey()]?.score || 0;
            return sum + score;
          }, 0) / totalCompetitors
        )
      : 0;

  return (
    <div className={styles.container} id="leaderboard-page">
      <Head>
        <title>Leaderboard - Splend Game</title>
        <meta name="description" content="View global rankings and top scores for all games in the Splend Game collection." />
      </Head>

      <div className={styles.card}>
        <h1 className={styles.title}>LEADERBOARD MATRIX</h1>

        {isVisitor && (
          <div className={styles.guestWarning} id="leaderboard-guest-warning">
            You are currently playing as a <strong>Guest</strong>. Your scores are only stored locally. 
            <Link href="/auth">Sign In</Link> to publish your scores and join the global database rankings!
          </div>
        )}

        {/* Global Statistics Cards */}
        <div className={styles.statsGrid} id="leaderboard-stats-grid">
          <div className={styles.statsCard}>
            <div className={styles.statsVal}>{totalCompetitors}</div>
            <div className={styles.statsLabel}>SECTOR OPERATORS</div>
          </div>
          <div className={styles.statsCard}>
            <div className={styles.statsVal}>{highestScoreVal}</div>
            <div className={styles.statsLabel}>HIGH SCORE</div>
          </div>
          <div className={styles.statsCard}>
            <div className={styles.statsVal}>{averageScoreVal}</div>
            <div className={styles.statsLabel}>AVERAGE SCORE</div>
          </div>
        </div>

        {/* Dynamic Podium Showcase */}
        {!loadingRankings && activeRankings.length > 0 && (
          <div className={styles.podiumSection} id="leaderboard-podium">
            {/* 2nd Place */}
            {secondPlace && (
              <div className={`${styles.podiumCard} ${styles.rank2Card}`} id="podium-rank-2">
                <span className={styles.podiumBadge} style={{ color: "#e0e0e0" }}>RANK 02</span>
                <div className={styles.podiumAvatar}>
                  {secondPlace.displayName ? secondPlace.displayName.substring(0, 2).toUpperCase() : "G2"}
                </div>
                <div className={styles.podiumName}>{secondPlace.displayName || "Anonymous"}</div>
                <div className={styles.podiumScore}>
                  {activeTab === "global" ? secondPlace.globalScore : secondPlace.games?.[getActiveGameKey()]?.score || 0}
                </div>
              </div>
            )}

            {/* 1st Place */}
            {firstPlace && (
              <div className={`${styles.podiumCard} ${styles.rank1Card}`} id="podium-rank-1">
                <span className={styles.podiumBadge} style={{ color: "#ffd700" }}>RANK 01</span>
                <div className={styles.podiumAvatar}>
                  {firstPlace.displayName ? firstPlace.displayName.substring(0, 2).toUpperCase() : "G1"}
                </div>
                <div className={styles.podiumName}>{firstPlace.displayName || "Anonymous"}</div>
                <div className={styles.podiumScore}>
                  {activeTab === "global" ? firstPlace.globalScore : firstPlace.games?.[getActiveGameKey()]?.score || 0}
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <div className={`${styles.podiumCard} ${styles.rank3Card}`} id="podium-rank-3">
                <span className={styles.podiumBadge} style={{ color: "#cd7f32" }}>RANK 03</span>
                <div className={styles.podiumAvatar}>
                  {thirdPlace.displayName ? thirdPlace.displayName.substring(0, 2).toUpperCase() : "G3"}
                </div>
                <div className={styles.podiumName}>{thirdPlace.displayName || "Anonymous"}</div>
                <div className={styles.podiumScore}>
                  {activeTab === "global" ? thirdPlace.globalScore : thirdPlace.games?.[getActiveGameKey()]?.score || 0}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Filters */}
        <div className={styles.tabs} id="leaderboard-tabs">
          {LEADERBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
              id={`tab-leaderboard-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar} id="leaderboard-search">
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filter database by operator name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-leaderboard-search"
          />
        </div>

        {/* Rankings Table */}
        {loadingRankings ? (
          <div className={styles.noData} id="leaderboard-loading">LOADING MATRIX DATA...</div>
        ) : filteredRankings.length === 0 ? (
          <div className={styles.noData} id="leaderboard-empty">NO CORRESPONDING SECTORS RECORDED.</div>
        ) : (
          <div className={styles.tableWrapper} id="leaderboard-table-wrapper">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Rank</th>
                  <th className={styles.th}>Player Name</th>
                  {activeTab === "global" ? (
                    <th className={styles.th}>Global Score</th>
                  ) : (
                    <>
                      <th className={styles.th}>Game Score</th>
                      <th className={styles.th}>Losses</th>
                      <th className={styles.th}>Best Streak</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRankings.map((row, idx) => (
                  <tr
                    key={row.uid}
                    className={isCurrentUser(row.uid) ? styles.rowHighlight : ""}
                    id={`leaderboard-row-${idx}`}
                  >
                    <td className={styles.td}>{getRankBadge(idx)}</td>
                    <td className={styles.td}>{row.displayName || "Anonymous Player"}</td>
                    {activeTab === "global" ? (
                      <td className={styles.td} style={{ fontFamily: "var(--font-display)", fontWeight: "bold" }}>
                        {row.globalScore}
                      </td>
                    ) : (
                      <>
                        <td className={styles.td} style={{ fontFamily: "var(--font-display)", fontWeight: "bold" }}>
                          {row.games?.[getActiveGameKey()]?.score || 0}
                        </td>
                        <td className={styles.td}>{row.games?.[getActiveGameKey()]?.losses || 0}</td>
                        <td className={styles.td}>{row.games?.[getActiveGameKey()]?.highScore || 0}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
