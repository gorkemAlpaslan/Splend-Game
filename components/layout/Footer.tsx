import React from "react";
import styles from "@/styles/Layout.module.sass";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="app-footer">
      <div className={styles.footerContent}>
        <span>&copy; {currentYear} Positive & Negative. All rights reserved. Created with</span>
        <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a>
        <span>&</span>
        <a href="https://threejs.org" target="_blank" rel="noopener noreferrer">Three.js</a>
      </div>
    </footer>
  );
};

export default Footer;
