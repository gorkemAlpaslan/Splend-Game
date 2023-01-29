import Head from "next/head";
import ScoreGame from "@/components/games/score-game";
import style from "../styles/Home.module.sass";
export default function Home() {
  return (
    <div className={style.bodyWrapper}>
      <Head>
        <title>Splend Games</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={style.gameWrapper}>
        <ScoreGame></ScoreGame>
      </div>
    </div>
  );
}
