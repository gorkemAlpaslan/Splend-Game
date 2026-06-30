import React, { useState } from "react";
import Head from "next/head";
import KenKenMatrixGame from "@/components/games/number-sum-kenken-game";
import style from "@/styles/Home.module.sass";

export default function KenKenMatrixGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>KenKen Matrix - Splend Game</title>
        <meta name="description" content="Solve arithmetic cages in a grid matrix while satisfying Latin Square unique constraints." />
      </Head>

      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>KENKEN MATRIX</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <KenKenMatrixGame />
      </div>

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
                <div className={style.ruleText}><strong>Arithmetic Cages:</strong> The grid cells are grouped into cages marked by dashed borders. The target value and math operator (e.g. 5+, 6x, 2-) are listed in the top-left of each cage.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Latin Square:</strong> Fill in the cells with digits from 1 to 3. Each row and column must contain unique digits without any overlaps.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Cage Math:</strong> The digits placed inside the cells of a cage must compute to the target value when applying the cage&apos;s math operator.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Verification:</strong> Populated cell values are checked when clicking VERIFY. Any incorrect placement drains a matrix shield. Secure the coordinates.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
