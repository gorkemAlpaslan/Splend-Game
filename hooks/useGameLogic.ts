import { useState, useCallback, useEffect } from 'react';
import { useAudio } from './useAudio';
import { useStats } from './useStats';

export interface GridCell {
  value: number; // 0 = hidden, 1 = revealed
  effect: number; // The actual +/- value
}

export interface NeighborInfo {
  sum: number;
  positiveCount: number;
  negativeCount: number;
  zeroCount: number;
}

export type Difficulty = "easy" | "medium" | "hard";

export const useGameLogic = () => {
  const { playSound, isMuted, toggleMute } = useAudio();
  const { stats, updateStats } = useStats();

  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(16);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [radarEnabled, setRadarEnabled] = useState<boolean>(true);

  const [grid, setGrid] = useState<GridCell[]>([]);
  const [score, setScore] = useState<number>(0);
  const [cancelLeft, setCancelLeft] = useState<number>(10);

  const [positiveStats, setPositiveStats] = useState({ count: 0, value: 0 });
  const [negativeStats, setNegativeStats] = useState({ count: 0, value: 0 });

  const [goalEasy, setGoalEasy] = useState<number>(0);
  const [goalMedium, setGoalMedium] = useState<number>(0);
  const [goalHard, setGoalHard] = useState<number>(0);

  const getSizeMultiplier = (size: number) => {
    if (size === 12) return 0.8;
    if (size === 20) return 1.3;
    return 1.0;
  };

  const getDiffMultiplier = (diff: Difficulty) => {
    if (diff === "easy") return 1.0;
    if (diff === "hard") return 2.0;
    return 1.5;
  };

  const getRadarMultiplier = (enabled: boolean) => {
    return enabled ? 1.0 : 2.0;
  };

  const getMultiplier = useCallback(() => {
    return getSizeMultiplier(gridSize) * getDiffMultiplier(difficulty) * getRadarMultiplier(radarEnabled);
  }, [gridSize, difficulty, radarEnabled]);

  const getMaxCloses = (diff: Difficulty) => {
    if (diff === "easy") return 12;
    if (diff === "hard") return 5;
    return 8;
  };

  const calculateSum = (currentGrid: GridCell[], level: number) => {
    let posSum = 0;
    let negSum = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    for (let i = 0; i < currentGrid.length; i++) {
      if (currentGrid[i].effect > 0) {
        posSum += currentGrid[i].effect;
        positiveCount++;
      } else if (currentGrid[i].effect < 0) {
        negSum += currentGrid[i].effect;
        negativeCount++;
      }
    }
    if (posSum + negSum >= 0) {
      return positiveCount > 0 ? (posSum / positiveCount) * level : level;
    } else {
      return negativeCount > 0 ? (negSum / negativeCount) * level : -level;
    }
  };

  const generateNewGrid = useCallback((size: number = gridSize, diff: Difficulty = difficulty) => {
    const totalCells = size * size;
    let range = 9;
    let offset = 4;
    if (diff === "easy") {
      range = 7;
      offset = 3;
    } else if (diff === "hard") {
      range = 11;
      offset = 5;
    }

    const tempGrid = Array(totalCells)
      .fill(0)
      .map(() => ({
        value: 0,
        effect: Math.floor(Math.random() * range) - offset,
      }));

    const easy = calculateSum(tempGrid, 10);
    const med = calculateSum(tempGrid, 20);
    const hard = calculateSum(tempGrid, 30);

    setGrid(tempGrid);
    setScore(0);
    setCancelLeft(getMaxCloses(diff));
    setPositiveStats({ count: 0, value: 0 });
    setNegativeStats({ count: 0, value: 0 });
    setGoalEasy(easy);
    setGoalMedium(med);
    setGoalHard(hard);
  }, [gridSize, difficulty]);

  const startGame = useCallback(() => {
    generateNewGrid(gridSize, difficulty);
    setGameStarted(true);
  }, [generateNewGrid, gridSize, difficulty]);

  const getHighestTierReached = useCallback((currentScore: number) => {
    if (goalEasy > 0) {
      if (currentScore >= goalHard) return 3;
      if (currentScore >= goalMedium) return 2;
      if (currentScore >= goalEasy) return 1;
    } else if (goalEasy < 0) {
      if (currentScore <= goalHard) return 3;
      if (currentScore <= goalMedium) return 2;
      if (currentScore <= goalEasy) return 1;
    }
    return 0;
  }, [goalEasy, goalMedium, goalHard]);

  const recordWin = useCallback((points: number) => {
    const mult = getMultiplier();
    const finalPoints = Math.round(points * mult);
    updateStats(finalPoints, true);
  }, [getMultiplier, updateStats]);

  const recordLoss = useCallback(() => {
    updateStats(0, false);
  }, [updateStats]);

  const retreat = useCallback(() => {
    const tier = getHighestTierReached(score);
    if (tier > 0) {
      playSound("victory");
      recordWin(tier);
      generateNewGrid();
    }
  }, [getHighestTierReached, score, playSound, recordWin, generateNewGrid]);

  const resetGrid = useCallback(() => {
    const limit = Math.floor(getMaxCloses(difficulty) / 2);
    if (cancelLeft > limit) {
      generateNewGrid();
      playSound("undo");
    }
  }, [cancelLeft, difficulty, generateNewGrid, playSound]);

  const toggleCell = useCallback((index: number) => {
    if (index < 0 || index >= grid.length) return;

    const isOpened = grid[index].value === 1;

    const newGrid = [...grid];
    const isClosing = isOpened;

    if (isClosing) {
      if (cancelLeft <= 0) return;
      newGrid[index].value = 0;
      setCancelLeft((prev) => prev - 1);
      playSound("undo");
    } else {
      newGrid[index].value = 1;
      const val = newGrid[index].effect;
      if (val > 0) playSound("positive");
      else if (val < 0) playSound("negative");
      else playSound("click");
    }

    setGrid(newGrid);

    let newScore = 0;
    let pos = { count: 0, value: 0 };
    let neg = { count: 0, value: 0 };

    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i].value === 1) {
        const effect = newGrid[i].effect;
        newScore += effect;
        if (effect > 0) {
          pos.count++;
          pos.value += effect;
        } else if (effect < 0) {
          neg.count++;
          neg.value += effect;
        }
      }
    }

    setScore(newScore);
    setPositiveStats(pos);
    setNegativeStats(neg);
  }, [grid, cancelLeft, playSound]);

  // Monitor end of round conditions
  useEffect(() => {
    if (grid.length === 0 || !gameStarted) return;

    if (cancelLeft === 0) {
      const tier = getHighestTierReached(score);
      if (tier > 0) {
        playSound("victory");
        recordWin(tier);
      } else {
        playSound("defeat");
        recordLoss();
      }
      generateNewGrid();
    }
  }, [score, cancelLeft, grid.length, gameStarted, getHighestTierReached, playSound, recordWin, recordLoss, generateNewGrid]);

  const getNeighborInfo = useCallback((idx: number): NeighborInfo => {
    if (idx < 0 || idx >= grid.length) return { sum: 0, positiveCount: 0, negativeCount: 0, zeroCount: 0 };
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    let sum = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let zeroCount = 0;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          const neighborIdx = r * gridSize + c;
          const effect = grid[neighborIdx]?.effect || 0;
          sum += effect;
          if (effect > 0) positiveCount++;
          else if (effect < 0) negativeCount++;
          else zeroCount++;
        }
      }
    }
    return { sum, positiveCount, negativeCount, zeroCount };
  }, [grid, gridSize]);

  return {
    gameStarted,
    startGame,
    gridSize,
    setGridSize,
    difficulty,
    setDifficulty,
    radarEnabled,
    setRadarEnabled,
    getMultiplier,
    getMaxCloses,
    
    grid,
    score,
    cancelLeft,
    positiveStats,
    negativeStats,
    goalEasy,
    goalMedium,
    goalHard,
    
    getNeighborInfo,
    toggleCell,
    retreat,
    resetGrid,
    getHighestTierReached,
    
    stats,
    isMuted,
    toggleMute,
  };
};
