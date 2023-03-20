import React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./score-game-style.module.sass";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import helpIcon from "public/help-icon.svg";
import Image from "next/image";
const ScoreGame: React.FC<{}> = () => {
  const [score, setScore] = useState<number>(0);

  const [cancelLeft, setCancelLeft] = useState(10);

  const [grid, setGrid] = useState(
    Array(256)
      .fill(0)
      .map((val, index) => {
        return { value: 0, effect: Math.floor(Math.random() * 9) - 4 };
      })
  );

  const [positive, setPositive] = useState<{ count: number; value: number }>({
    count: 0,
    value: 0,
  });

  const [negative, setNegative] = useState<{ count: number; value: number }>({
    count: 0,
    value: 0,
  });

  const calculateSum = (level: any) => {
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
      return (posSum / positiveCount) * level;
    } else {
      return (negSum / negativeCount) * level;
    }
  };

  const [goalEasy, setGoalEasy] = useState(() => calculateSum(10));

  const [goalMedium, setGoalMedium] = useState(() => calculateSum(20));

  const [goalHard, setGoalHard] = useState(() => calculateSum(30));

  const [totalWin, SetTotalWin] = useState(0);

  const [totalLose, SetTotalLose] = useState(0);

  const [currentRetreat, SetCurrentRetreat] = useState(0);

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
  };

  const gameReset = () => {
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
    SetCurrentRetreat(0);
  };

  const resetHandler = (type: string) => {
    if (type === "auto") {
      gameReset();
    } else if (type === "manuel" && cancelLeft > 5) {
      gameReset();
    }
  };

  const retreatHandler = () => {
    if (goalEasy <= score && goalEasy > 0) {
      SetTotalWin(totalWin + 1);
      resetHandler("auto");
    }
    if (goalEasy >= score && goalEasy < 0) {
      SetTotalWin(totalWin + 1);
      resetHandler("auto");
    }
    if (goalMedium <= score && goalMedium > 0) {
      SetTotalWin(totalWin + 2);
      resetHandler("auto");
    }
    if (goalMedium >= score && goalMedium < 0) {
      SetTotalWin(totalWin + 2);
      resetHandler("auto");
    }
    if (goalHard <= score && goalHard > 0) {
      SetTotalWin(totalWin + 3);
      resetHandler("auto");
    }
    if (goalHard >= score && goalHard < 0) {
      SetTotalWin(totalWin + 3);
      resetHandler("auto");
    }
  };

  useEffect(() => {
    if (goalEasy <= score && goalEasy > 0) {
      SetCurrentRetreat(1);
      if (cancelLeft === 0) {
        SetTotalWin(totalWin + 1);
        resetHandler("auto");
      }
    }
    if (goalEasy >= score && goalEasy < 0) {
      SetCurrentRetreat(1);
      if (cancelLeft === 0) {
        SetTotalWin(totalWin + 1);
        resetHandler("auto");
      }
    }
    if (goalMedium <= score && goalMedium > 0) {
      SetCurrentRetreat(2);
      if (cancelLeft === 0) {
        SetTotalWin(totalWin + 2);
        resetHandler("auto");
      }
    }
    if (goalMedium >= score && goalMedium < 0) {
      SetCurrentRetreat(2);
      if (cancelLeft === 0) {
        SetTotalWin(totalWin + 2);
        resetHandler("auto");
      }
    }
    if (goalHard <= score && goalHard > 0) {
      SetCurrentRetreat(3);
      if (cancelLeft === 0) {
        SetTotalWin(totalWin + 3);
        resetHandler("auto");
      }
    }
    if (goalHard >= score && goalHard < 0) {
      SetCurrentRetreat(3);
      if (cancelLeft === 0) {
        SetTotalWin(totalWin + 3);
        resetHandler("auto");
      }
    }
    if (goalEasy > score && goalEasy > 0 && cancelLeft === 0) {
      SetTotalLose(totalLose + 1);
      resetHandler("auto");
    }
    if (goalEasy < score && goalEasy < 0 && cancelLeft === 0) {
      SetTotalLose(totalLose + 1);
      resetHandler("auto");
    }
  }, [score, cancelLeft]);

  return (
    <div className={styles.playArea}>
      <div className={styles.gameGridWrapper}>
        <div className={styles.gameGrid}>
          {grid.map((value, index) => (
            <div
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
            >
              {value.value === 1 ? value.effect : ""}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.gameStats}>
        <div className={styles.scoreLine}>
          <Box sx={{ width: "100%" }}>
            <LinearProgress
              variant="determinate"
              value={score < 0 ? -score : 0}
              className={styles.negativeBar}
              sx={{
                backgroundColor: "#333",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "red",
                },
              }}
            />
            <LinearProgress
              variant="determinate"
              value={score > 0 ? score : 0}
              className={styles.positiveBar}
              sx={{
                backgroundColor: "#333",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "green",
                },
              }}
            />
          </Box>
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
        <div className={styles.totalScores}>
          <div className={`${styles.totalWin} ${styles.totalScore}`}>
            Total Wins : {totalWin}
          </div>

          <div className={`${styles.totalLose} ${styles.totalScore}`}>
            Total Losses : {totalLose}
          </div>
        </div>

        <div className={styles.counters}>
          <p className={`${styles.positiveCounter} ${styles.counter}`}>
            Positive Value: {positive.value}
          </p>

          <p className={`${styles.negativeCounter} ${styles.counter}`}>
            Negative Value: {negative.value}
          </p>

          <p className={`${styles.positiveCounter} ${styles.counter}`}>
            Positive Count: {positive.count}
          </p>

          <p className={`${styles.negativeCounter} ${styles.counter}`}>
            Negative Count: {negative.count}
          </p>
        </div>
        <h3 className={styles.cancelLeft}>Close : {cancelLeft}/10</h3>

        <div className={styles.Buttons}>
          <button className={styles.Button} onClick={retreatHandler}>
            Retreat{" "}
            <p className={currentRetreat > 0 ? styles.currentRetreat : ""}>
              {currentRetreat}
            </p>
            Now
          </button>

          <button
            onClick={() => {
              resetHandler("manuel");
            }}
            className={styles.Button}
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreGame;
