import React from 'react';
import SetupScreen from './SetupScreen';
import GameBoardContainer from './GameBoardContainer';
import { useGameLogic } from '../../../hooks/useGameLogic';
import styles from './GameEngine.module.sass';

const GameEngine: React.FC = () => {
  const logic = useGameLogic();

  return (
    <div className={styles.engineWrapper}>
      {!logic.gameStarted ? (
        <SetupScreen
          gridSize={logic.gridSize}
          setGridSize={logic.setGridSize}
          difficulty={logic.difficulty}
          setDifficulty={logic.setDifficulty}
          radarEnabled={logic.radarEnabled}
          setRadarEnabled={logic.setRadarEnabled}
          getMultiplier={logic.getMultiplier}
          startGame={logic.startGame}
        />
      ) : (
        <GameBoardContainer logic={logic} />
      )}
    </div>
  );
};

export default GameEngine;
