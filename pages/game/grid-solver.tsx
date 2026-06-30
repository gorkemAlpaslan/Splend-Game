import React, { useState } from "react";
import Head from "next/head";
import GridSolverGame from "@/components/games/grid-solver-game";
import style from "@/styles/Home.module.sass";

export default function GridSolverGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Quantum Link - Splend Game</title>
        <meta name="description" content="Decipher optical connection conduits. Route power signals to receiver targets under collapsing grid rotation parameters." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>QUANTUM LINK</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <GridSolverGame />

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
                <div className={style.ruleText}><strong>Decryption Parameters:</strong> Choose a difficulty setting (Easy, Medium, Hard). This scales the grid dimensions, connection terminals (receivers), and places non-rotatable blocked firewalls on Hard difficulty.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Rotating Conduits:</strong> Click on any active network tile (straight, elbow, T-junction, cross, end cap) to rotate it 90 degrees clockwise. Each rotation counts as a move.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Power Propagation:</strong> The transmitter core (top pulsing blue node) distributes signals down connected tiles. Connected conduits glow neon green, signifying active signal flow.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Immutable Nodes:</strong> The transmitter node (blue), target receivers (red/green), and firewall block nodes (red locks) cannot be rotated. Signal cannot pass through locked firewalls.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Decryption Goal:</strong> Align the conduits to propagate power from the transmitter core to all receivers simultaneously. You must solve the grid before running out of rotation moves.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>6</div>
                <div className={style.ruleText}><strong>Scoring & Efficiency:</strong> Clearing a puzzle yields points based on grid size and difficulty, boosted by a speed bonus for remaining unused moves, multiplied by your parameter settings multiplier!</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
