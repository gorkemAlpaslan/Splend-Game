import React from 'react';
import styles from './Inspector.module.sass';
import type { NeighborInfo } from '../../../hooks/useGameLogic';

interface InspectorProps {
  radarEnabled: boolean;
  hoveredIndex: number | null;
  gridSize: number;
  neighborInfo: NeighborInfo;
}

const Inspector: React.FC<InspectorProps> = ({ radarEnabled, hoveredIndex, gridSize, neighborInfo }) => {
  if (!radarEnabled) {
    return (
      <div className={styles.inspectorContainer}>
        <div className={styles.disabled}>
          <span className={styles.icon}>📡</span>
          <span>RADAR OFFLINE</span>
          <small>+2.0x Reward Multiplier Active</small>
        </div>
      </div>
    );
  }

  if (hoveredIndex === null) {
    return (
      <div className={styles.inspectorContainer}>
        <div className={styles.idle}>
          <span className={styles.pulse}></span>
          <span>AWAITING SCAN...</span>
        </div>
      </div>
    );
  }

  const row = Math.floor(hoveredIndex / gridSize) + 1;
  const col = (hoveredIndex % gridSize) + 1;

  return (
    <div className={styles.inspectorContainer}>
      <div className={styles.header}>
        <span className={styles.title}>SCANNER DATA</span>
        <span className={styles.coords}>R:{row} C:{col}</span>
      </div>

      <div className={styles.dataBlock}>
        <span className={styles.label}>NEIGHBOR SUM</span>
        <span className={`${styles.sumValue} ${neighborInfo.sum > 0 ? styles.pos : neighborInfo.sum < 0 ? styles.neg : ''}`}>
          {neighborInfo.sum > 0 ? `+${neighborInfo.sum}` : neighborInfo.sum}
        </span>
      </div>

      <div className={styles.composition}>
        <span className={styles.label}>COMPOSITION</span>
        <div className={styles.compStats}>
          <div className={styles.compStat}>
            <span className={styles.posNum}>{neighborInfo.positiveCount}</span>
            <span className={styles.subLabel}>POS</span>
          </div>
          <div className={styles.compStat}>
            <span className={styles.negNum}>{neighborInfo.negativeCount}</span>
            <span className={styles.subLabel}>NEG</span>
          </div>
          <div className={styles.compStat}>
            <span className={styles.neuNum}>{neighborInfo.zeroCount}</span>
            <span className={styles.subLabel}>NEU</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inspector;
