import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export interface GameStats {
  score: number;
  losses: number;
  winStreak: number;
  highScore: number;
}

export interface UserStats {
  globalScore: number;
  games: {
    [gameId: string]: GameStats;
  };
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isVisitor: boolean;
  stats: UserStats;
  signInAsVisitor: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateStats: (gameId: string, pointsAdded: number, isWin: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_STATS: UserStats = {
  globalScore: 0,
  games: {
    positive_negative: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    grid_solver: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    memory_matrix: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    wave_tuner: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    firewall_defuse: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    matrix_runner: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    protocol_stack: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    cipher_decryptor: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    },
    hex_sudoku: {
      score: 0,
      losses: 0,
      winStreak: 0,
      highScore: 0
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isVisitor, setIsVisitor] = useState<boolean>(false);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);

  // Helper to load visitor stats from localStorage (migrating legacy keys if present)
  const loadVisitorStats = (): UserStats => {
    if (typeof window === "undefined") return DEFAULT_STATS;

    const savedStats = localStorage.getItem("splend_guest_stats");
    if (savedStats) {
      try {
        return JSON.parse(savedStats);
      } catch (e) {
        console.error("Failed to parse guest stats, using default", e);
      }
    }

    // Migration logic for legacy individual keys
    const legacyWins = localStorage.getItem("splend_wins");
    const legacyLosses = localStorage.getItem("splend_losses");
    const legacyStreak = localStorage.getItem("splend_win_streak");
    const legacyHighScore = localStorage.getItem("splend_high_score");

    if (legacyWins || legacyLosses || legacyStreak || legacyHighScore) {
      const migrated: UserStats = {
        globalScore: legacyWins ? parseInt(legacyWins, 10) : 0,
        games: {
          positive_negative: {
            score: legacyWins ? parseInt(legacyWins, 10) : 0,
            losses: legacyLosses ? parseInt(legacyLosses, 10) : 0,
            winStreak: legacyStreak ? parseInt(legacyStreak, 10) : 0,
            highScore: legacyHighScore ? parseInt(legacyHighScore, 10) : 0
          }
        }
      };
      localStorage.setItem("splend_guest_stats", JSON.stringify(migrated));
      return migrated;
    }

    return DEFAULT_STATS;
  };

  // Sync visitor stats to localStorage
  const saveVisitorStats = (newStats: UserStats) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("splend_guest_stats", JSON.stringify(newStats));
      // Sync legacy keys for backward compatibility
      localStorage.setItem("splend_wins", String(newStats.games.positive_negative.score));
      localStorage.setItem("splend_losses", String(newStats.games.positive_negative.losses));
      localStorage.setItem("splend_win_streak", String(newStats.games.positive_negative.winStreak));
      localStorage.setItem("splend_high_score", String(newStats.games.positive_negative.highScore));
    }
  };

  // Load user stats from Firestore or create profile if not exists
  const syncUserStats = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserStats;
        // Merge with DEFAULT_STATS schema to ensure compatibility with new games
        const mergedStats = {
          ...DEFAULT_STATS,
          ...data,
          games: {
            ...DEFAULT_STATS.games,
            ...(data.games || {})
          },
          displayName: firebaseUser.displayName || data.displayName || "User",
          photoURL: firebaseUser.photoURL || data.photoURL || ""
        };
        setStats(mergedStats);
      } else {
        // Create new user profile in Firestore
        const initialStats: UserStats = {
          ...DEFAULT_STATS,
          displayName: firebaseUser.displayName || "User",
          photoURL: firebaseUser.photoURL || ""
        };
        await setDoc(userRef, initialStats);
        setStats(initialStats);
      }
    } catch (e) {
      console.error("Firestore sync failed, falling back to local storage representation", e);
      // Fallback: load local representation if Firestore fails (offline/config issues)
      setStats(loadVisitorStats());
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsVisitor(false);
        await syncUserStats(firebaseUser);
      } else {
        setUser(null);
        // Check if visitor session exists in sessionStorage or fallback to visitor if set
        const wasVisitor = localStorage.getItem("splend_is_visitor") === "true";
        if (wasVisitor) {
          setIsVisitor(true);
          setStats(loadVisitorStats());
        } else {
          setIsVisitor(false);
          setStats(DEFAULT_STATS);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAsVisitor = () => {
    localStorage.setItem("splend_is_visitor", "true");
    setIsVisitor(true);
    setUser(null);
    setStats(loadVisitorStats());
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    localStorage.removeItem("splend_is_visitor");
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.removeItem("splend_is_visitor");
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    
    // Save to Firestore manually after register
    const userRef = doc(db, "users", cred.user.uid);
    const initialStats: UserStats = {
      ...DEFAULT_STATS,
      displayName,
      photoURL: ""
    };
    await setDoc(userRef, initialStats);
    setStats(initialStats);
    localStorage.removeItem("splend_is_visitor");
  };

  const logout = async () => {
    localStorage.removeItem("splend_is_visitor");
    setIsVisitor(false);
    setUser(null);
    setStats(DEFAULT_STATS);
    await signOut(auth);
  };

  const updateStats = async (gameId: string, pointsAdded: number, isWin: boolean) => {
    setStats((prev) => {
      const currentGameStats = prev.games[gameId] || { score: 0, losses: 0, winStreak: 0, highScore: 0 };
      let newScore = currentGameStats.score;
      let newLosses = currentGameStats.losses;
      let newStreak = currentGameStats.winStreak;
      let newHighScore = currentGameStats.highScore;

      if (isWin) {
        newScore += pointsAdded;
        newStreak += 1;
        if (newStreak > newHighScore) {
          newHighScore = newStreak;
        }
      } else {
        newLosses += 1;
        newStreak = 0;
      }

      const updatedGameStats: GameStats = {
        score: newScore,
        losses: newLosses,
        winStreak: newStreak,
        highScore: newHighScore
      };

      const nextStats: UserStats = {
        ...prev,
        globalScore: prev.globalScore + (isWin ? pointsAdded : 0),
        games: {
          ...prev.games,
          [gameId]: updatedGameStats
        }
      };

      // Persist values
      if (isVisitor) {
        saveVisitorStats(nextStats);
      } else if (user) {
        const userRef = doc(db, "users", user.uid);
        updateDoc(userRef, {
          globalScore: nextStats.globalScore,
          [`games.${gameId}`]: updatedGameStats
        }).catch((err) => console.error("Failed to update firestore stats", err));
      }

      return nextStats;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isVisitor,
        stats,
        signInAsVisitor,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        updateStats
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
