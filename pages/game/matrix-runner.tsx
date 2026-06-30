import React, { useState } from "react";
import Head from "next/head";
import MatrixRunnerGame from "@/components/games/matrix-runner-game";
import style from "@/styles/Home.module.sass";

export default function MatrixRunnerGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Matrix Runner - Splend Game</title>
        <meta name="description" content="Steer a datastream light cycle through grid coordinates. Compile file packets and dodge firewall boundaries." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>MATRIX RUNNER</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <MatrixRunnerGame />

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
                <div className={style.ruleText}><strong>Light Stream Navigation:</strong> Use Arrow Keys or W-A-S-D to steer the light cycle (snake). Press any direction key to initialize stream movement.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Packet Compilation:</strong> Steer the stream head into flashing blue nodes (data packets). Each packet consumed extends your datastream length.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Decryption Threshold:</strong> Complete the mission by compiling a target length (8 for Easy, 12 for Medium, 16 for Hard). Speed increments with difficulty profile.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Collision Hazards:</strong> Hitting the grid boundaries (firewall) or crashing into your own light stream segments drops your connection (defeat).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Scoring:</strong> Compiling the target packet stack clears the anomaly and secures points (1 for Easy, 2 for Medium, 3 for Hard) times the setup multiplier. Collisions reset streaks.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
