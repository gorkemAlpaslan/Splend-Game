import React, { useState } from "react";
import Head from "next/head";
import FutoshikiInequalityGame from "@/components/games/futoshiki-game";
import style from "@/styles/Home.module.sass";

export default function FutoshikiInequalityGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Futoshiki Inequality - Splend Game</title>
        <meta name="description" content="Fill grid values 1-3 satisfying row/col uniqueness and math inequality pointers." />
      </Head>

      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>FUTOSHIKI INEQUALITY</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <FutoshikiInequalityGame />
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
                <div className={style.ruleText}><strong>Matrix Numbers:</strong> Fill the 3x3 cells grid with digits from 1 to 3.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Uniqueness:</strong> No duplicate numbers are allowed in any horizontal row or vertical column (Latin Square constraint).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Inequality Signs:</strong> The arrows (&lt;, &gt;, ▲, ▼) displayed between adjacent cells dictate which number must be greater or smaller. For example, 1 &lt; 2 or 3 &gt; 2.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Secure Code:</strong> Complete the grid matching all inequality pointers and click VERIFY. Faulty codes damage shields.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
