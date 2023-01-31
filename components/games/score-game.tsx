import React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./score-game-style.module.sass";
import { createTheme, ThemeProvider } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface PaletteOptions {
    positive?: PaletteOptions["primary"];
    negative?: PaletteOptions["secondary"];
  }
}

const theme = createTheme({
  palette: {
    positive: {
      main: "#228B22",
    },
    negative: {
      main: "#8B0000",
    },
  },
});
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
  const [animated, setAnimated] = useState(false);
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

  const [positive, setPositive] = useState<{ count: number; value: number }>({
    count: 0,
    value: 0,
  });
  const [negative, setNegative] = useState<{ count: number; value: number }>({
    count: 0,
    value: 0,
  });

  const handleClick = (index: any) => {
    const newGrid = [...grid];
    let newScore = 0;
    let pos = { count: 0, value: 0 };
    let neg = { count: 0, value: 0 };
    newGrid[index].value = newGrid[index].value === 0 ? 1 : 0;
    if (newGrid[index].value === 0) {
      setCancelLeft(cancelLeft - 1);
      setAnimated(true);
      setTimeout(() => setAnimated(false), 500);
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
    setPositive({ count: 0, value: 0 });
    setNegative({ count: 0, value: 0 });
    setGoalEasy(calculateSum(10));
    setGoalMedium(calculateSum(20));
    setGoalHard(calculateSum(30));
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
    <div className={styles.gameWrapper}>
      <div className={styles.gameContainer}>
        <div className={styles.gameTitle}>Negative & Positive</div>
        <div className={styles.scoreLine}>
          <ThemeProvider theme={theme}>
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
          </ThemeProvider>

          <div className={styles.goalsPositive}>
            {goalEasy > 0 && (
              <div
                className={`${styles.goalEasy} ${styles.goal}`}
                style={{ width: `${goalEasy}%` }}
              >
                <div className={styles.positiveInner}>
                  {Math.round(goalEasy)}
                </div>
              </div>
            )}
            {goalMedium > 0 && (
              <div
                className={`${styles.goalMedium} ${styles.goal}`}
                style={{ width: `${goalMedium}%` }}
              >
                <div className={styles.positiveInner}>
                  {Math.round(goalMedium)}
                </div>
              </div>
            )}
            {goalHard > 0 && (
              <div
                className={`${styles.goalHard} ${styles.goal}`}
                style={{ width: `${goalHard}%` }}
              >
                <div className={styles.positiveInner}>
                  {Math.round(goalHard)}
                </div>
              </div>
            )}
          </div>
          <div className={styles.goalsNegative}>
            {goalEasy < 0 && (
              <div
                className={`${styles.goalEasy} ${styles.goal} ${styles.negativeGoal}`}
                style={{ width: `${-goalEasy}%` }}
              >
                <div className={styles.negativeInner}>
                  {Math.round(-goalEasy)}
                </div>
              </div>
            )}
            {goalMedium < 0 && (
              <div
                className={`${styles.goalMedium} ${styles.goal} ${styles.negativeGoal}`}
                style={{ width: `${-goalMedium}%` }}
              >
                <div className={styles.negativeInner}>
                  {Math.round(-goalMedium)}
                </div>
              </div>
            )}
            {goalHard < 0 && (
              <div
                className={`${styles.goalHard} ${styles.goal} ${styles.negativeGoal}`}
                style={{ width: `${-goalHard}%` }}
              >
                <div className={styles.negativeInner}>
                  {Math.round(-goalHard)}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.playArea}>
          <div className={styles.gameGrid}>
            {grid.map((value, index) => (
              <button
                key={index}
                className={`${styles.gameGridButtons} ${
                  value.value === 1 && styles.gameGridItemActive
                } ${
                  value.effect < 0 &&
                  value.value === 1 &&
                  styles.gameGridItemNegative
                } ${
                  value.effect === 0 &&
                  value.value === 1 &&
                  styles.gameGridItemZero
                }`}
                onClick={() => handleClick(index)}
                disabled={value.value === 1 && cancelLeft < 1}
              >
                {value.value === 1 ? value.effect : ""}
              </button>
            ))}
          </div>
          <div className={styles.gameStats}>
            <h3
              className={`${styles.cancelLeft} ${
                animated ? styles.animated : ""
              }`}
            >
              Cancel : {cancelLeft}/10
            </h3>
            <p className={styles.positiveCounter}>
              Positive Value: {positive.value}
            </p>
            <p className={styles.positiveCounter}>
              Positive Count: {positive.count}
            </p>
            <p className={styles.negativeCounter}>
              Negative Value: {negative.value}
            </p>
            <p className={styles.negativeCounter}>
              Negative Count: {negative.count}
            </p>
            <button onClick={resetHandler} className={styles.resetButton}>
              Reset Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreGame;
