import Head from "next/head";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.sass";
import Image from "next/image";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import ScoreGame from "@/components/games/score-game";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <Head>
        <title>My App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <Image
              src=""
              alt="Logo"
              width="100"
              height="100"
              className={styles.logoImg}
            />
          </div>
          <nav className={styles.nav}>
            <a href="#home" className={styles.navLink}>
              Home
            </a>
            <a href="#games" className={styles.navLink}>
              Games
            </a>
            <a href="#about" className={styles.navLink}>
              About
            </a>
          </nav>
        </header>
        <main className={styles.body}>
          <section id="games" className={styles.section}>
            <ScoreGame></ScoreGame>
          </section>
        </main>
        <footer className={styles.footer}>
          <p>This is the footer</p>
        </footer>
      </div>
    </>
  );
}
