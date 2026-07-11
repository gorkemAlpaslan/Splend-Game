import React, { memo } from 'react';
import styles from './Cell.module.sass';

interface CellProps {
  index: number;
  value: number; // 0 = hidden, 1 = revealed
  effect: number;
  neighborSum: number;
  radarEnabled: boolean;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
}

const Cell: React.FC<CellProps> = memo(({
  index,
  value,
  effect,
  neighborSum,
  radarEnabled,
  isHovered,
  onHover,
  onClick
}) => {
  const isOpened = value === 1;

  let stateClass = styles.hidden;
  if (isOpened) {
    if (effect > 0) stateClass = styles.positive;
    else if (effect < 0) stateClass = styles.negative;
    else stateClass = styles.neutral;
  }

  // Hover indicator logic
  let hoverStyle = {};
  if (isHovered && !isOpened && radarEnabled) {
    if (neighborSum > 0) {
      hoverStyle = { borderColor: 'var(--positive-color)', boxShadow: '0 0 15px var(--positive-glow)', zIndex: 10 };
    } else if (neighborSum < 0) {
      hoverStyle = { borderColor: 'var(--negative-color)', boxShadow: '0 0 15px var(--negative-glow)', zIndex: 10 };
    } else {
      hoverStyle = { borderColor: 'var(--neutral-color)', boxShadow: '0 0 15px var(--neutral-glow)', zIndex: 10 };
    }
  }

  return (
    <div
      className={`${styles.cell} ${stateClass} ${isHovered ? styles.hovered : ''}`}
      style={hoverStyle}
      onClick={() => onClick(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={styles.content}>
        {isOpened && (
          <span className={styles.effectText}>
            {effect > 0 ? `+${effect}` : effect}
          </span>
        )}
      </div>
    </div>
  );
});

Cell.displayName = "Cell";
export default Cell;
