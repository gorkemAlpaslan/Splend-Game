import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Header from "./Header";
import Footer from "./Footer";
import ThreeBg from "../games/ThreeBg";
import styles from "@/styles/Layout.module.sass";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isVisitor, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Route guard: if user is not authenticated and hasn't selected guest access, redirect to /auth
    if (!loading && !user && !isVisitor && router.pathname !== "/auth") {
      router.push("/auth");
    }
  }, [user, isVisitor, loading, router.pathname]);

  useEffect(() => {
    // Redirect authenticated users or visitors away from /auth to home lobby
    if (!loading && (user || isVisitor) && router.pathname === "/auth") {
      router.push("/");
    }
  }, [user, isVisitor, loading, router.pathname]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#030308",
          color: "var(--primary-color)",
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          letterSpacing: "2px",
          textShadow: "0 0 10px var(--primary-glow)",
        }}
      >
        INITIALIZING SYSTEM...
      </div>
    );
  }

  // If not logged in and not visitor, only render children (the /auth page) to prevent layout flash during redirect
  const showFullLayout = user || isVisitor;

  return (
    <div className={styles.layoutWrapper}>
      {/* Persisting 3D Background */}
      <ThreeBg />

      {showFullLayout && <Header />}

      <main className={styles.mainContent}>{children}</main>

      {/* Floating Global Chatbox */}
      {showFullLayout && <GlobalChat />}

      {showFullLayout && <Footer />}
    </div>
  );
};

import GlobalChat from "./GlobalChat";
export default Layout;

