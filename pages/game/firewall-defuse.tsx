import React, { useState } from "react";
import Head from "next/head";
import FirewallDefuseGame from "@/components/games/firewall-defuse-game";
import style from "@/styles/Home.module.sass";

export default function FirewallDefuseGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Firewall Defuse - Splend Game</title>
        <meta name="description" content="Toggle active nodes on the security matrix to defuse firewalls. Solve Lights Out grids before running out of operations." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>FIREWALL DEFUSE</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <FirewallDefuseGame />

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
                <div className={style.ruleText}><strong>Security Grid:</strong> The grid contains active firewall alert nodes (glowing red) and defused safe nodes (green). Your target is to deactivate every red node on the grid.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>orthogonal Toggling:</strong> Clicking any grid node flips its status (active becomes defused, defused becomes active) AND toggles its orthogonal neighbors (UP, DOWN, LEFT, RIGHT).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Complexity Levels:</strong> Grid sizes increase with difficulty profile: Easy is 3x3, Medium is 4x4, and Hard is 5x5, which requires more tactical planning.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Defuse Goal:</strong> Successfully defuse all nodes (turn the whole grid dark/green) using fewer operations than the maximum limit (15 for Easy, 20 for Medium, 30 for Hard).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Scoring:</strong> Defusing a node sequence secures points (1 for Easy, 2 for Medium, 3 for Hard) multiplied by the setup multiplier. Running out of moves causes deflection reset.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
