import React, { useState } from "react";
import Head from "next/head";
import HexSudokuGame from "@/components/games/hex-sudoku-game";
import style from "@/styles/Home.module.sass";

export default function HexSudokuGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Hex Sudoku - Splend Game</title>
        <meta name="description" content="Align hex code digits in the 4x4 subgrid matrix. Solve quadrants and lanes without repeating values under shield buffers." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>HEX SUDOKU</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <HexSudokuGame />

      {/* Rules Information Modal */}
      {isPopupActive && (
        <div className={style.infoModal} onClick={infoPopupHandler} id="rules-modal">
          <div
            className={style.infoContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={style.modalHeader}>
              <span className={style.modalTitle}>HOW TO PLAY</span>
              <button className={style.closeButton} onClick={infoPopupHandler} id="btn-close-modal">×</button>
            </div>

            <div className={style.rulesList}>
              <div className={style.ruleItem}>
                <div className={style.ruleNum}>1</div>
                <div className={style.ruleText}><strong>Hex Matrix:</strong> The grid is a 4x4 matrix comprising sixteen slots. Several slots are prefilled starting clue values (white text) which cannot be modified.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Sudoku Stacking Constraints:</strong> Fill the empty slots using numbers 1, 2, 3, and 4 so that each digit appears exactly once in:
                  <br />- Each of the 4 horizontal rows.
                  <br />- Each of the 4 vertical columns.
                  <br />- Each of the 4 quadrants (2x2 subgrids).
                </div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Cycling Inputs:</strong> Click on any empty/blue slot to cycle its value: &quot;&quot; &rarr; 1 &rarr; 2 &rarr; 3 &rarr; 4 &rarr; &quot;&quot;.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Verify Validation:</strong> Click the VERIFY MATRIX button to test your values. Wrong values will flash red. Each verification check containing errors consumes one shield.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Shield Capacity:</strong> You have 3 shields. Running out of shields causes matrix overload (defeat).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>6</div>
                <div className={style.ruleText}><strong>Scoring:</strong> Solving the matrix successfully grants points (1 for Easy, 2 for Medium, 3 for Hard) times the points multiplier. Errors reset streak logs.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
