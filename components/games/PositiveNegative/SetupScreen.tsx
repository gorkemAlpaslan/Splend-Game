import React from 'react';
import styles from './SetupScreen.module.sass';

interface SetupScreenProps {
  gridSize: number;
  setGridSize: (size: number) => void;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (diff: "easy" | "medium" | "hard") => void;
  radarEnabled: boolean;
  setRadarEnabled: (enabled: boolean) => void;
  getMultiplier: () => number;
  startGame: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  gridSize,
  setGridSize,
  difficulty,
  setDifficulty,
  radarEnabled,
  setRadarEnabled,
  getMultiplier,
  startGame
}) => {
  return (
    <div className={styles.setupContainer}>
      <div className={styles.setupCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>DEPLOYMENT SETUP</h1>
          <p className={styles.subtitle}>Configure anomaly sector parameters before launch.</p>
        </div>

        <div className={styles.optionsWrapper}>
          {/* Grid Size */}
          <div className={styles.optionGroup}>
            <span className={styles.groupLabel}>SECTOR DIMENSIONS</span>
            <div className={styles.optionCards}>
              {[
                { size: 12, label: "Small", mult: "0.8x" },
                { size: 16, label: "Standard", mult: "1.0x" },
                { size: 20, label: "Large", mult: "1.3x" },
              ].map((opt) => (
                <div
                  key={opt.size}
                  className={`${styles.optionCard} ${gridSize === opt.size ? styles.active : ""}`}
                  onClick={() => setGridSize(opt.size)}
                >
                  <span className={styles.value}>{opt.size}x{opt.size}</span>
                  <span className={styles.label}>{opt.label} ({opt.mult})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className={styles.optionGroup}>
            <span className={styles.groupLabel}>ANOMALY SEVERITY</span>
            <div className={styles.optionCards}>
              {[
                { diff: "easy" as const, label: "Range [-3, +3]", mult: "1.0x" },
                { diff: "medium" as const, label: "Range [-4, +4]", mult: "1.5x" },
                { diff: "hard" as const, label: "Range [-5, +5]", mult: "2.0x" },
              ].map((opt) => (
                <div
                  key={opt.diff}
                  className={`${styles.optionCard} ${difficulty === opt.diff ? styles.active : ""}`}
                  onClick={() => setDifficulty(opt.diff)}
                >
                  <span className={styles.value}>{opt.diff.toUpperCase()}</span>
                  <span className={styles.label}>{opt.label} ({opt.mult})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Radar */}
          <div className={styles.optionGroup}>
            <span className={styles.groupLabel}>PROXIMITY SENSOR</span>
            <div className={styles.optionCards}>
              <div
                className={`${styles.optionCard} ${radarEnabled ? styles.active : ""}`}
                onClick={() => setRadarEnabled(true)}
              >
                <span className={styles.value}>ENABLED</span>
                <span className={styles.label}>Radar active (1.0x)</span>
              </div>
              <div
                className={`${styles.optionCard} ${!radarEnabled ? styles.active : ""}`}
                onClick={() => setRadarEnabled(false)}
              >
                <span className={styles.value}>DISABLED</span>
                <span className={styles.label}>Radar off (2.0x)</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actionArea}>
          <div className={styles.multiplierBadge}>
            <span className={styles.badgeLabel}>ESTIMATED REWARD MULTIPLIER</span>
            <span className={styles.multiplierVal}>{getMultiplier().toFixed(1)}x</span>
          </div>

          <button className={styles.launchButton} onClick={startGame}>
            LAUNCH MISSION
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
