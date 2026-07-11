import { useState, useCallback } from 'react';

export interface GameStats {
  score: number;
  losses: number;
  winStreak: number;
  highScore: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<GameStats>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pn_local_stats");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse local stats", e);
        }
      }
    }
    return { score: 0, losses: 0, winStreak: 0, highScore: 0 };
  });

  const updateStats = useCallback((pointsAdded: number, isWin: boolean) => {
    setStats((prev) => {
      let newScore = prev.score;
      let newLosses = prev.losses;
      let newStreak = prev.winStreak;
      let newHighScore = prev.highScore;

      if (isWin) {
        newScore += pointsAdded;
        newStreak += 1;
        if (newStreak > newHighScore) {
          newHighScore = newStreak;
        }
      } else {
        newLosses += 1;
        newStreak = 0;
      }

      const next = {
        score: newScore,
        losses: newLosses,
        winStreak: newStreak,
        highScore: newHighScore,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("pn_local_stats", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  return { stats, updateStats };
};
