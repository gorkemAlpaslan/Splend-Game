import React, { useState } from "react";
import Head from "next/head";
import SlitherlinkLoopGame from "@/components/games/slitherlink-game";
import style from "@/styles/Home.module.sass";

export default function SlitherlinkLoopGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Slitherlink Loop - Splend Game</title>
        <meta name="description" content="Connect grid dots to form a single continuous loop matching numeric cell border requirements." />
      </Head>

      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>SLITHERLINK LOOP</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <SlitherlinkLoopGame />
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
                <div className={style.ruleText}><strong>Dotted Framework:</strong> You see a 4x4 coordinate map of glowing dots. The spaces between dots are clickable segment wires.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Numerical Clues:</strong> Numbers displayed inside grid cells dictate exactly how many of its 4 surrounding borders must be drawn as lines. Cells with no numbers have no border constraints.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Closed Loop:</strong> Draw lines by clicking/tapping cell edges. All lines must link up to form a **single, continuous, closed loop** with no crossings or branches.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Validation:</strong> Populate lines and tap VERIFY. Any error compiles as shield damage. Secure the parameters.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
