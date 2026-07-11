import React from 'react';
import styles from './TopProgressPanel.module.sass';

interface TopProgressPanelProps {
  score: number;
  goalEasy: number;
  goalMedium: number;
  goalHard: number;
  multiplier: number;
}

const TopProgressPanel: React.FC<TopProgressPanelProps> = ({
  score,
  goalEasy,
  goalMedium,
  goalHard,
  multiplier
}) => {
  const maxGoalVal = Math.max(Math.abs(goalEasy), Math.abs(goalMedium), Math.abs(goalHard), 40);
  const getPercent = (value: number) => Math.min(Math.max((Math.abs(value) / maxGoalVal) * 100, 0), 100);

  const scoreSign = goalEasy >= 0 ? 1 : -1;
  const isEasyReached = scoreSign * score >= scoreSign * goalEasy;
  const isMedReached = scoreSign * score >= scoreSign * goalMedium;
  const isHardReached = scoreSign * score >= scoreSign * goalHard;

  // Compute tier logic
  let activeTier = 'NONE';
  let nextTargetVal = goalEasy;
  if (isHardReached) {
    activeTier = 'HARD (MAX)';
    nextTargetVal = score;
  } else if (isMedReached) {
    activeTier = 'MEDIUM';
    nextTargetVal = goalHard;
  } else if (isEasyReached) {
    activeTier = 'EASY';
    nextTargetVal = goalMedium;
  }

  const distanceToNext = Math.abs(nextTargetVal - score);

  const scoreClass = score > 0 ? styles.pos : score < 0 ? styles.neg : styles.neu;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.topBar}>
        <div className={styles.scoreBlock}>
          <span className={styles.scoreLabel}>CURRENT SCORE</span>
          <span className={`${styles.mainScore} ${scoreClass}`}>
            {score > 0 ? `+${score}` : score}
          </span>
        </div>

        <div className={styles.metadataBlock}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>TIER</span>
            <span className={`${styles.metaValue} ${isEasyReached ? styles.highlightTier : ''}`}>{activeTier}</span>
          </div>
          {!isHardReached && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>NEXT IN</span>
              <span className={styles.metaValue}>{Math.round(distanceToNext)}</span>
            </div>
          )}
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>MULTIPLIER</span>
            <span className={styles.metaValue}>{multiplier.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      <div className={styles.trackArea}>
        <div className={styles.progressBarWrapper}>
          <div className={styles.trackHalf}>
            <div className={`${styles.fill} ${styles.fillNeg}`} style={{ width: score < 0 ? `${getPercent(score)}%` : '0%' }} />
            {goalEasy < 0 && (
              <>
                <div className={`${styles.marker} ${styles.markerNeg} ${isEasyReached ? styles.reached : ''}`} style={{ right: `${getPercent(goalEasy)}%`, transform: `translateX(${getPercent(goalEasy)}%)` }}>EASY</div>
                <div className={`${styles.marker} ${styles.markerNeg} ${isMedReached ? styles.reached : ''}`} style={{ right: `${getPercent(goalMedium)}%`, transform: `translateX(${getPercent(goalMedium)}%)` }}>MED</div>
                <div className={`${styles.marker} ${styles.markerNeg} ${isHardReached ? styles.reached : ''}`} style={{ right: `${getPercent(goalHard)}%`, transform: `translateX(${getPercent(goalHard)}%)` }}>HARD</div>
              </>
            )}
          </div>
          <div className={styles.centerDivider} />
          <div className={styles.trackHalf}>
            <div className={`${styles.fill} ${styles.fillPos}`} style={{ width: score > 0 ? `${getPercent(score)}%` : '0%' }} />
            {goalEasy > 0 && (
              <>
                <div className={`${styles.marker} ${styles.markerPos} ${isEasyReached ? styles.reached : ''}`} style={{ left: `${getPercent(goalEasy)}%`, transform: `translateX(-${getPercent(goalEasy)}%)` }}>EASY</div>
                <div className={`${styles.marker} ${styles.markerPos} ${isMedReached ? styles.reached : ''}`} style={{ left: `${getPercent(goalMedium)}%`, transform: `translateX(-${getPercent(goalMedium)}%)` }}>MED</div>
                <div className={`${styles.marker} ${styles.markerPos} ${isHardReached ? styles.reached : ''}`} style={{ left: `${getPercent(goalHard)}%`, transform: `translateX(-${getPercent(goalHard)}%)` }}>HARD</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopProgressPanel;
