import React, { useState, useCallback } from 'react';
import styles from './Board.module.sass';
import Cell from './Cell';
import type { GridCell, NeighborInfo } from '../../../hooks/useGameLogic';

interface BoardProps {
  grid: GridCell[];
  gridSize: number;
  radarEnabled: boolean;
  toggleCell: (index: number) => void;
  getNeighborInfo: (idx: number) => NeighborInfo;
  isTouchDevice: boolean;
  setExternalHoveredIndex: (idx: number | null) => void;
}

const Board: React.FC<BoardProps> = ({
  grid,
  gridSize,
  radarEnabled,
  toggleCell,
  getNeighborInfo,
  isTouchDevice,
  setExternalHoveredIndex
}) => {
  const [localHoveredIndex, setLocalHoveredIndex] = useState<number | null>(null);

  const handleHover = useCallback((index: number | null) => {
    if (isTouchDevice) return; // Hover is meaningless on touch
    setLocalHoveredIndex(index);
    setExternalHoveredIndex(index);
  }, [isTouchDevice, setExternalHoveredIndex]);

  const handleClick = useCallback((index: number) => {
    const isOpened = grid[index].value === 1;

    // Mobile tap-to-inspect logic
    if (isTouchDevice && radarEnabled && !isOpened) {
      if (localHoveredIndex !== index) {
        setLocalHoveredIndex(index);
        setExternalHoveredIndex(index);
        return; // First tap only scans
      }
    }

    // Second tap or desktop click reveals
    toggleCell(index);
    if (!isOpened) {
      setLocalHoveredIndex(null);
      setExternalHoveredIndex(null);
    }
  }, [isTouchDevice, radarEnabled, grid, localHoveredIndex, toggleCell, setExternalHoveredIndex]);

  return (
    <div className={styles.boardWrapper}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }}
      >
        {grid.map((cell, index) => {
          const neighborInfo = (radarEnabled && localHoveredIndex === index) ? getNeighborInfo(index) : { sum: 0, positiveCount: 0, negativeCount: 0, zeroCount: 0 };
          return (
            <Cell
              key={index}
              index={index}
              value={cell.value}
              effect={cell.effect}
              neighborSum={neighborInfo.sum}
              radarEnabled={radarEnabled}
              isHovered={localHoveredIndex === index}
              onHover={handleHover}
              onClick={handleClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Board;
