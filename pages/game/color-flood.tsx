import React, { useState } from "react";
import Head from "next/head";
import ColorFloodGame from "@/components/games/color-flood-game";
import style from "@/styles/Home.module.sass";

export default function ColorFloodGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Color Flood - Splend Game</title>
        <meta name="description" content="Click colors to expand the flood zone from the top-left to unify the grid colors." />
      </Head>

      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>COLOR FLOOD</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <ColorFloodGame />
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
                <div className={style.ruleText}><strong>Grid Setup:</strong> You are presented with a 12x12 grid containing 6 random neon colors.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Flooding:</strong> Click any colored circle at the bottom deck to convert the top-left cell and all connected cells of its color into the new choice.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Objective:</strong> Expand your flood area outwards to unify the entire grid into a single uniform color.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Moves Limit:</strong> You must clear the grid in under 22 moves (Easy), 18 moves (Medium), or 15 moves (Hard). Running out of moves triggers failure.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
