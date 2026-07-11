import React from "react";
import Footer from "./Footer";
import ThreeBg from "../games/ThreeBg";
import styles from "@/styles/Layout.module.sass";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.layoutWrapper}>
      {/* Persisting 3D Background */}
      <ThreeBg />

      <main className={styles.mainContent}>{children}</main>

      <Footer />
    </div>
  );
};

export default Layout;

