import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/Layout.module.sass";

const Header: React.FC = () => {
  const router = useRouter();
  const { user, isVisitor, logout } = useAuth();

  const handleLogoClick = () => {
    router.push("/");
  };

  const isActive = (path: string) => {
    return router.pathname === path ? styles.activeNavLink : "";
  };

  const getDisplayName = () => {
    if (user) {
      return user.displayName || user.email?.split("@")[0] || "User";
    }
    if (isVisitor) {
      return "Guest Player";
    }
    return "";
  };

  return (
    <header className={styles.header} id="app-header">
      <div className={styles.logoContainer} onClick={handleLogoClick} id="logo-container">
        <span className={styles.logoText}>SPLEND GAME</span>
      </div>

      <nav className={styles.nav} id="nav-links">
        <Link href="/" className={`${styles.navLink} ${isActive("/")}`} id="nav-home">
          Games
        </Link>
        <Link href="/leaderboard" className={`${styles.navLink} ${isActive("/leaderboard")}`} id="nav-leaderboard">
          Leaderboard
        </Link>
      </nav>

      <div className={styles.authWidget} id="auth-widget">
        {(user || isVisitor) ? (
          <>
            <div className={styles.userBadge} id="user-badge">
              <span
                className={`${styles.statusDot} ${user ? styles.statusDotOnline : styles.statusDotGuest}`}
              />
              <span className={styles.userName}>{getDisplayName()}</span>
            </div>
            <button className={styles.btnSignOut} onClick={logout} id="btn-sign-out">
              Exit
            </button>
          </>
        ) : (
          <button
            className={styles.btnSignIn}
            onClick={() => router.push("/auth")}
            id="btn-sign-in"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
