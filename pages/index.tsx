import Head from "next/head";
import ScoreGame from "@/components/games/score-game";
import ThreeBg from "@/components/games/ThreeBg";
import style from "../styles/Home.module.sass";
import { useState } from "react";

export default function Home() {
  const [isPopupActive, SetIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    SetIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.bodyWrapper}>
      <Head>
        <title>Negative & Positive - Splend Games</title>
        <meta name="description" content="A strategic game of numbers, goals, and risk management. Reach positive or negative targets before you run out of closes." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 3D Rotating Particle Background */}
      <ThreeBg />

      <div className={style.gameWrapper}>
        {/* Sleek Glassmorphism Header */}
        <header className={style.gameHeader}>
          <div className={style.logoTitle}>NEGATIVE & POSITIVE</div>
          <button className={style.infoButton} onClick={infoPopupHandler}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
            </svg>
            How To Play
          </button>
        </header>

        {/* Game Area Component */}
        <ScoreGame />

        {/* Rules Information Modal */}
        {isPopupActive && (
          <div className={style.infoModal} onClick={infoPopupHandler}>
            <div
              className={style.infoContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={style.modalHeader}>
                <span className={style.modalTitle}>HOW TO PLAY</span>
                <button className={style.closeButton} onClick={infoPopupHandler}>×</button>
              </div>

              <div className={style.rulesList}>
                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>1</div>
                  <div className={style.ruleText}><strong>Setup:</strong> Select grid size (12x12, 16x16, 20x20) and difficulty (Easy, Medium, Hard) before deploying. These settings adjust grid cell numbers, values, and scoring multipliers.</div>
                </div>

                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>2</div>
                  <div className={style.ruleText}><strong>Proximity Radar:</strong> If enabled, hover over any box to scan its 3x3 surroundings. Scanner displays coordinates, neighbor sum, and P/N composition. Cells glow green (positive sum), red (negative), or purple (neutral).</div>
                </div>

                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>3</div>
                  <div className={style.ruleText}><strong>Revealing & Clues:</strong> Click a box to reveal its value. If radar is enabled, opened cells display their value and a small corner subscript showing their neighbor sum clue.</div>
                </div>

                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>4</div>
                  <div className={style.ruleText}><strong>Undos:</strong> Click an opened box again to close (undo) it. You have 10 Closes per round. Round ends automatically when closes reach 0.</div>
                </div>

                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>5</div>
                  <div className={style.ruleText}><strong>Targets:</strong> Reach the Easy, Medium, or Hard target values shown in the HUD. Targets can be positive or negative. Use neighbor sums to deduce and target high-value cells safely!</div>
                </div>

                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>6</div>
                  <div className={style.ruleText}><strong>Manual Reset:</strong> You can reset the grid at any time if you have 6 or more closes remaining (used 4 or fewer closes).</div>
                </div>

                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>7</div>
                  <div className={style.ruleText}><strong>Retreating:</strong> Once you reach at least the Easy target, choose "Retreat Now" to claim your points (+1 for Easy, +2 for Medium, +3 for Hard multiplied by your setup multiplier) and secure your win streak.</div>
                </div>

                <div className={style.ruleItem}>
                  <div className={style.ruleNum}>8</div>
                  <div className={style.ruleText}><strong>Multipliers:</strong> Playing on larger grids, harder difficulties, or disabling the Proximity Radar applies a <strong>reward multiplier</strong>. Disabling radar gives a flat 2.0x multiplier boost!</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
