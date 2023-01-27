import React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./score-game-style.module.sass";

const ScoreGame: React.FC<{}> = () => {
  const [grid, setGrid] = useState(
    Array(256)
      .fill(0)
      .map((val, index) => {
        return { value: 0, effect: Math.floor(Math.random() * 9) - 4 };
      })
  );
  const [score, setScore] = useState<number>(0);
  const [cancelLeft, setCancelLeft] = useState(10);
  const calculateSum = (hardness: any) => {
    let posSum = 0;
    let negSum = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].effect > 0) {
        posSum += grid[i].effect;
        positiveCount++;
      } else if (grid[i].effect < 0) {
        negSum += grid[i].effect;
        negativeCount++;
      }
    }
    if (posSum + negSum >= 0) {
      return (posSum / positiveCount) * hardness;
    } else {
      return (negSum / negativeCount) * hardness;
    }
  };
  const [goalEasy, setGoalEasy] = useState(() => calculateSum(10));
  const [goalMedium, setGoalMedium] = useState(() => calculateSum(20));
  const [goalHard, setGoalHard] = useState(() => calculateSum(30));
  const [level, setLevel] = useState(1);

  const [positive, setPositive] = useState<{}>({ count: 0, value: 0 });
  const [negative, setNegative] = useState<{}>({ count: 0, value: 0 });

  const handleClick = (index: any) => {
    const newGrid = [...grid];
    let newScore = 0;
    let pos = { count: 0, value: 0 };
    let neg = { count: 0, value: 0 };
    newGrid[index].value = newGrid[index].value === 0 ? 1 : 0;
    if (newGrid[index].value === 0) {
      setCancelLeft(cancelLeft - 1);
    }
    setGrid(newGrid);

    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i].value === 1) {
        newScore += newGrid[i].effect;
        if (newGrid[i].effect > 0) {
          pos.count++;
          pos.value += newGrid[i].effect;
        } else if (newGrid[i].effect < 0) {
          neg.count++;
          neg.value += newGrid[i].effect;
        }
      }
    }
    setScore(newScore);
    setPositive(pos);
    setNegative(neg);
    console.log(pos);
  };

  const resetHandler = () => {
    setScore(0);
    setCancelLeft(10);
    setGrid(
      Array(256)
        .fill(0)
        .map((val, index) => {
          return { value: 0, effect: Math.floor(Math.random() * 9) - 4 };
        })
    );
    setPositive(0);
    setNegative(0);
    setGoalEasy(calculateSum(10));
    setGoalMedium(calculateSum(20));
    setGoalHard(calculateSum(30));
    console.log(goalEasy, goalMedium, goalHard);
  };

  useEffect(() => {
    if (goalEasy <= score && goalEasy > 0) {
      resetHandler();
    }
    if (goalEasy >= score && goalEasy < 0) {
      resetHandler();
    }
  }, [score]);
  return (
    <div className={styles.game}>
      <Box sx={{ width: "100%" }}>
        <LinearProgress
          variant="determinate"
          value={score < 0 ? -score : 0}
          className={styles.negativeBar}
          color="secondary"
        />
        <LinearProgress
          variant="determinate"
          value={score > 0 ? score : 0}
          className={styles.positiveBar}
          color="success"
        />
      </Box>
      <div className={styles.goalsPositive}>
        {goalEasy > 0 && (
          <div
            className={`${styles.goalEasy} ${styles.goal}`}
            style={{ width: `${goalEasy}%` }}
          ></div>
        )}
        {goalMedium > 0 && (
          <div
            className={`${styles.goalEasy} ${styles.goal}`}
            style={{ width: `${goalMedium}%` }}
          ></div>
        )}
        {goalHard > 0 && (
          <div
            className={`${styles.goalEasy} ${styles.goal}`}
            style={{ width: `${goalHard}%` }}
          ></div>
        )}
      </div>
      <div className={styles.goalsNegative}>
        {goalEasy < 0 && (
          <div
            className={`${styles.goalEasy} ${styles.goal}`}
            style={{ width: `${-goalEasy}%` }}
          ></div>
        )}
        {goalMedium < 0 && (
          <div
            className={`${styles.goalEasy} ${styles.goal}`}
            style={{ width: `${-goalMedium}%` }}
          ></div>
        )}
        {goalHard < 0 && (
          <div
            className={`${styles.goalEasy} ${styles.goal}`}
            style={{ width: `${-goalHard}%` }}
          ></div>
        )}
      </div>
      <div className={styles.header}>
        <h1 className={styles.gameHeader}>Score: {score}</h1>
        <h3> Cancel : {cancelLeft}/10</h3>
        <div className={styles.counterWrapper}>
          <p className={styles.positiveCounter}>
            Positive Count: {positive.count}
          </p>
          <p className={styles.positiveCounter}>
            Positive Value: {positive.value}
          </p>
          <p className={styles.negativeCounter}>
            Negative Count: {negative.count}
          </p>
          <p className={styles.negativeCounter}>
            Negative Value: {negative.value}
          </p>
        </div>
      </div>
      <div className={styles.gameGrid}>
        {grid.map((value, index) => (
          <button
            key={index}
            className={`${styles.gameGridItem} ${
              value.value === 1 && styles.gameGridItemActive
            } ${
              value.effect < 0 &&
              value.value === 1 &&
              styles.gameGridItemNegative
            } ${
              value.effect === 0 && value.value === 1 && styles.gameGridItemZero
            }`}
            onClick={() => handleClick(index)}
            disabled={value.value === 1 && cancelLeft < 1}
          >
            {value.value === 1 ? value.effect : ""}
          </button>
        ))}
      </div>
      <button onClick={resetHandler} className={styles.button36}>
        Reset Game
      </button>
    </div>
  );
};

export default ScoreGame;
