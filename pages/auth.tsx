import React, { useState } from "react";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/Auth.module.sass";

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { loginWithEmail, registerWithEmail, loginWithGoogle, signInAsVisitor } = useAuth();

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (activeTab === "register" && !displayName)) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      if (activeTab === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google authentication failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestEntry = () => {
    signInAsVisitor();
  };

  return (
    <div className={styles.authContainer} id="auth-page">
      <Head>
        <title>Authentication - Splend Game</title>
        <meta name="description" content="Sign in or join Splend Game to track your high scores and compete on global leaderboards." />
      </Head>

      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>SPLEND GAME</h1>

        <div className={styles.tabs} id="auth-tabs">
          <button
            className={`${styles.tab} ${activeTab === "login" ? styles.activeTab : ""}`}
            onClick={() => handleTabChange("login")}
            id="tab-sign-in"
          >
            SIGN IN
          </button>
          <button
            className={`${styles.tab} ${activeTab === "register" ? styles.activeTab : ""}`}
            onClick={() => handleTabChange("register")}
            id="tab-sign-up"
          >
            SIGN UP
          </button>
        </div>

        {error && (
          <div className={styles.errorAlert} id="auth-error-alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} id="auth-form">
          {activeTab === "register" && (
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="displayName">Player Name</label>
              <input
                className={styles.input}
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter player name"
                disabled={submitting}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email Address</label>
            <input
              className={styles.input}
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              disabled={submitting}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              className={styles.input}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={submitting}
            />
          </div>

          <button
            className={styles.btnSubmit}
            type="submit"
            disabled={submitting}
            id="btn-auth-submit"
          >
            {submitting ? "AUTHENTICATING..." : activeTab === "login" ? "SIGN IN" : "SIGN UP"}
          </button>
        </form>

        <div className={styles.divider}>OR</div>

        <button
          className={styles.btnGoogle}
          onClick={handleGoogleLogin}
          disabled={submitting}
          id="btn-google-login"
        >
          {/* Custom vector Google Icon */}
          <svg className={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Sign In
        </button>

        <button
          className={styles.btnGuest}
          onClick={handleGuestEntry}
          disabled={submitting}
          id="btn-guest-entry"
        >
          Play as Guest (Local Save Only)
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
