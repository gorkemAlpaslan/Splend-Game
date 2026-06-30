import React, { useState } from "react";
import Head from "next/head";
import ProtocolStackGame from "@/components/games/protocol-stack-game";
import style from "@/styles/Home.module.sass";

export default function ProtocolStackGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Protocol Stack - Splend Game</title>
        <meta name="description" content="Move stacked protocol discs from Terminal A to C. Align data buffers under bandwidth restrictions." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>PROTOCOL STACK</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <ProtocolStackGame />

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
                <div className={style.ruleText}><strong>Decryption Setup:</strong> Choose packet capacity size: Easy is 3 discs, Medium is 4 discs, Hard is 5 discs. At the start, all packets are stacked on Port A in descending order.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Stacking Rules:</strong> Move top discs between Port A, B, and C. You can only move the single top-most packet of a port. A larger packet size (e.g. 5 KB) can never be stacked on top of a smaller one (e.g. 2 KB).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Select & Shift:</strong> Click a rod to select its top packet (the rod glows blue). Then, click any other rod to shift the selected packet to that target rod. Click the source rod again to deselect.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Decryption Goal:</strong> Re-align the complete packet stack onto Port C in correct descending order using fewer moves than the allowed maximum (15 for Easy, 25 for Medium, 45 for Hard).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Scoring:</strong> Completing the stack routing secures points (1 for Easy, 2 for Medium, 3 for Hard) times the points multiplier. Going over the shift limit drops connection and resets streaks.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
