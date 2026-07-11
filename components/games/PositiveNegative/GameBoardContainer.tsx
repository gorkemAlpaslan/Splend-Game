import React, { useState, useEffect } from 'react';
import styles from './GameBoardContainer.module.sass';
import HUD from './HUD';
import Board from './Board';
import Inspector from './Inspector';
import TopProgressPanel from './TopProgressPanel';
import type { useGameLogic } from '../../../hooks/useGameLogic';

interface GameBoardContainerProps {
  logic: ReturnType<typeof useGameLogic>;
}

const GameBoardContainer: React.FC<GameBoardContainerProps> = ({ logic }) => {
  const {
    grid, gridSize, difficulty, radarEnabled, score, cancelLeft,
    goalEasy, goalMedium, goalHard, stats, isMuted, toggleMute,
    getMultiplier, getMaxCloses, getNeighborInfo, toggleCell, retreat, resetGrid
  } = logic;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
    }
  }, []);

  const currentNeighborInfo = hoveredIndex !== null ? getNeighborInfo(hoveredIndex) : { sum: 0, positiveCount: 0, negativeCount: 0, zeroCount: 0 };

  const scoreSign = goalEasy >= 0 ? 1 : -1;
  const isEasyReached = scoreSign * score >= scoreSign * goalEasy;

  return (
    <div className={styles.container}>
      <aside className={styles.leftPanel}>
        <HUD
          totalScore={stats.score}
          winStreak={stats.winStreak}
          highScore={stats.highScore}
          multiplier={getMultiplier()}
          cancelLeft={cancelLeft}
          maxCloses={getMaxCloses(difficulty)}
          isMuted={isMuted}
          toggleMute={toggleMute}
          retreat={retreat}
          resetGrid={resetGrid}
          isEasyReached={isEasyReached}
        />
      </aside>

      <main className={styles.centerPanel}>
        <TopProgressPanel
          score={score}
          goalEasy={goalEasy}
          goalMedium={goalMedium}
          goalHard={goalHard}
          multiplier={getMultiplier()}
        />
        <Board
          grid={grid}
          gridSize={gridSize}
          radarEnabled={radarEnabled}
          toggleCell={toggleCell}
          getNeighborInfo={getNeighborInfo}
          isTouchDevice={isTouchDevice}
          setExternalHoveredIndex={setHoveredIndex}
        />
      </main>

      <aside className={styles.rightPanel}>
        <Inspector
          radarEnabled={radarEnabled}
          hoveredIndex={hoveredIndex}
          gridSize={gridSize}
          neighborInfo={currentNeighborInfo}
        />
      </aside>
    </div>
  );
};

export default GameBoardContainer;
