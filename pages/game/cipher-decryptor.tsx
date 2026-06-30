import React, { useState } from "react";
import Head from "next/head";
import CipherDecryptorGame from "@/components/games/cipher-decryptor-game";
import style from "@/styles/Home.module.sass";

export default function CipherDecryptorGamePage() {
  const [isPopupActive, setIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    setIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.gameWrapper} id="game-page-wrapper">
      <Head>
        <title>Cipher Decryptor - Splend Game</title>
        <meta name="description" content="Crack hexadecimal security codes using locking clues. Solve alphanumeric matrices within attempt limits." />
      </Head>

      {/* Local Game Header */}
      <header className={style.gameHeader} style={{ background: "transparent", borderBottom: "none" }} id="game-header">
        <div className={style.logoTitle}>CIPHER DECRYPTOR</div>
        <button className={style.infoButton} onClick={infoPopupHandler} id="btn-how-to-play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5h-2a3.5 3.5 0 1 1 5 3.355z"/>
          </svg>
          How To Play
        </button>
      </header>

      {/* Game Area Component */}
      <CipherDecryptorGame />

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
                <div className={style.ruleText}><strong>Alphanumeric Encryption:</strong> The target is a hidden 4-digit hexadecimal code comprising characters 0-9 and A-F (e.g. A 5 4 D). Duplicates are allowed.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>2</div>
                <div className={style.ruleText}><strong>Entering Guesses:</strong> Click on each input box in the active slot to cycle through the 16 hexadecimal digits. Press the DECRYPT button to submit.</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>3</div>
                <div className={style.ruleText}><strong>Decryption Clues:</strong> Submitted guesses return marker results:
                  <br />- **LCK (Locked/Correct):** Indicates a digit is correct in value AND in its grid position.
                  <br />- **ALT (Alert/Present):** Indicates a digit is correct in value but in the WRONG grid position.
                </div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>4</div>
                <div className={style.ruleText}><strong>Defuse Goal:</strong> Work out the secret code using previous feedback within the attempt limit (10 for Easy, 8 for Medium, 6 for Hard).</div>
              </div>

              <div className={style.ruleItem}>
                <div className={style.ruleNum}>5</div>
                <div className={style.ruleText}><strong>Scoring:</strong> Cracking the cipher grants points (1 for Easy, 2 for Medium, 3 for Hard) multiplied by difficulty settings. Failures reset streak counts.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
