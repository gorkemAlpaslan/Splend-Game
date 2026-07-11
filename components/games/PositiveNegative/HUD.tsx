import React from 'react';
import styles from './HUD.module.sass';

interface HUDProps {
  totalScore: number;
  winStreak: number;
  highScore: number;
  multiplier: number;
  cancelLeft: number;
  maxCloses: number;
  isMuted: boolean;
  toggleMute: () => void;
  retreat: () => void;
  resetGrid: () => void;
  isEasyReached: boolean;
}

const HUD: React.FC<HUDProps> = ({
  totalScore,
  winStreak,
  highScore,
  multiplier,
  cancelLeft,
  maxCloses,
  isMuted,
  toggleMute,
  retreat,
  resetGrid,
  isEasyReached
}) => {
  return (
    <div className={styles.hudContainer}>
      {/* Top Stats */}
      <div className={styles.topStats}>
        <div className={styles.statPill}>
          <span className={styles.statLabel}>SCORE</span>
          <span className={styles.statValue}>{totalScore}</span>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statLabel}>STREAK</span>
          <span className={styles.statValue}>{winStreak}</span>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statLabel}>BEST</span>
          <span className={styles.statValue}>{highScore}</span>
        </div>
        <button className={styles.iconBtn} onClick={toggleMute} aria-label="Toggle sound">
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Action Controls */}
      <div className={styles.actionControls}>
        <div className={styles.closesWrapper}>
          <span className={styles.closesLabel}>CLOSES</span>
          <span className={`${styles.closesValue} ${cancelLeft <= Math.max(1, Math.floor(maxCloses / 3)) ? styles.warning : ''}`}>
            {cancelLeft}/{maxCloses}
          </span>
        </div>

        <div className={styles.buttons}>
          <button 
            className={styles.resetBtn} 
            onClick={resetGrid}
            disabled={cancelLeft <= Math.floor(maxCloses / 2)}
            title="Requires at least half of your closes"
          >
            RESET
          </button>
          <button 
            className={`${styles.retreatBtn} ${isEasyReached ? styles.activeRetreat : ''}`}
            onClick={retreat}
            disabled={!isEasyReached}
          >
            RETREAT
          </button>
        </div>
      </div>
    </div>
  );
};

export default HUD;
