import React, { useState } from "react";
import Head from "next/head";
import MemoryMatrixGame from "@/components/games/memory-matrix-game";
import style from "@/styles/Home.module.sass";

export default function MemoryMatrixGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Memory Matrix - Splend Game</title>
        <meta name="description" content="Decrypt high-speed alphanumeric memory maps. Re-align active coordinates under collapsing shield capacities." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>MEMORY MATRIX</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <MemoryMatrixGame />

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
                <div className={style.ruleText}><strong>Decryption Calibration:</strong> Select a difficulty setting. This changes the initial grid sizes (3x3 or 4x4), scanner flash times, and points multiplier (up to 2.0x).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Scanner Study:</strong> At the start of each level, a countdown runs, and then target tiles flash blue for a brief interval. Study and memorize their grid coordinates!</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Matrix Restoration:</strong> Click on the tiles that flashed blue. Correct clicks lock the tile in green. Click all target tiles to successfully clear the level.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Shield Buffer:</strong> You possess 3 active shields. Clicking an incorrect tile flashes red and consumes a shield. Depleting all shields causes grid lockout (defeat).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Sequential Decryption:</strong> Solved levels yield points. Levels increment in complexity, widening grid sizes (up to 7x7) and increasing target tiles sequentially up to Level 10.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>6</div>
                <div className={style.ruleText}><strong>Winning & Streaks:</strong> Successfully clearing all 10 levels grants a sector victory. Scores are added to streaks and global stats. Failures reset streaks.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
