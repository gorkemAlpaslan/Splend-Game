import React, { useState } from "react";
import Head from "next/head";
import HashiBridgesGame from "@/components/games/hashi-bridges-game";
import style from "@/styles/Home.module.sass";

export default function HashiBridgesGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Hashi Bridges - Splend Game</title>
        <meta name="description" content="Draw bridges connecting isolated islands according to their required link numbers." />
      </Head>

      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>HASHI BRIDGES</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <HashiBridgesGame />
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
                <div className={style.ruleText}><strong>Island Targets:</strong> You see circular islands containing target numbers (1-4). Click an island to select/highlight it.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Drawing Bridges:</strong> Click a second island aligned straight horizontally or vertically to connect them. Connections cycle: 0 &rarr; 1 &rarr; 2 &rarr; 0 bridges.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>No Intersecting:</strong> Bridges cannot cross other bridges or span diagonally.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Decryption Target:</strong> Tap VERIFY. If all island bridge counts match their targets, the network is bridged successfully. Faulty weights cause shield depletion.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
