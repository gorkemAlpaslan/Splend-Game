import Head from "next/head";
import ScoreGame from "@/components/games/score-game";
import style from "../styles/Home.module.sass";
import helpIcon from "public/help-icon.svg";
import Image from "next/image";
import { useEffect, useState } from "react";
export default function Home() {
  const [isPopupActive, SetIsPopupActive] = useState<boolean>(false);

  const infoPopupHandler = () => {
    SetIsPopupActive(!isPopupActive);
  };

  return (
    <div className={style.bodyWrapper}>
      <Head>
        <title>Splend Games</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={style.gameWrapper}>
        <div className={style.gameTitle}>
          <div>Negative & Positive</div>
          <div className={style.infoButton} onClick={infoPopupHandler}>
            How To Play
            <Image
              src={helpIcon}
              width={20}
              height={20}
              alt="help-icon"
              className={style.questionMark}
            />
          </div>
          {isPopupActive && (
            <div className={style.info} onClick={infoPopupHandler}>
              <div
                className={style.infoContent}
                onClick={(e) => e.stopPropagation()}
              >
                How to Play
                <div>1- The game consists of 16x16 (256 boxes) map.</div>
                <div>
                  2- The values in the boxes you open add up and this is you
                  score
                </div>
                <div>
                  2- The aim is to reach the target values in each round, you
                  can see the target values on the counter.
                </div>
                <div>3- You can close 10 boxes that you open in each round</div>
                <div>
                  4- You can also rest the round if you feel unlucky, but
                  beware, you cannot reset the game after you have used 5 of
                  your closes.
                </div>
                <div>
                  5- once your close rights run out, the point will add up to
                  your total win counter (+1 for first target, +2 for second
                  target, +3 for third target)
                </div>
                <div>6- you can also retreat once you reach first target</div>
                <div>
                  7- if you couldn't reach even first target, you will have a +1
                  point to your losses counter
                </div>
              </div>
            </div>
          )}
        </div>

        <ScoreGame></ScoreGame>
      </div>
    </div>
  );
}
