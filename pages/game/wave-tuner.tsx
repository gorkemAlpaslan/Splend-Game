import React, { useState } from "react";
import Head from "next/head";
import WaveTunerGame from "@/components/games/wave-tuner-game";
import style from "@/styles/Home.module.sass";

export default function WaveTunerGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Wave Tuner - Splend Game</title>
        <meta name="description" content="Match and adjust sine waves to align the digital signal. Bypass firewall frequencies under high-speed oscilloscope parameters." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>WAVE TUNER</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <WaveTunerGame />

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
                <div className={style.ruleText}><strong>Signal Oscilloscope:</strong> The canvas renders two scrolling waves. The green wave is the target pattern, and the blue wave is your player-controlled wave.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Parameter Tuning:</strong> Use the three range sliders in the control deck to adjust Amplitude (height), Frequency (spacing), and Phase (horizontal offset) of your blue wave.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Resonance Match:</strong> Your objective is to superimpose the blue wave perfectly over the green wave. A &quot;Signal Coincidence&quot; percentage gauges alignment in real-time.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Decryption Goal:</strong> Match the waves to exceed the accuracy target (90% for Easy, 93% for Medium, 96% for Hard) before the time countdown reaches zero.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Scoring:</strong> Successfully tuning and matching the signal yields points (1 for Easy, 2 for Medium, 3 for Hard) scaled by the setup points multiplier. Timeouts count as failures and reset streaking stats.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
