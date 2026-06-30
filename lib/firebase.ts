import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDt509Ytrxk1BM1rCmap_pRIr17ebSH67A",
  authDomain: "splendgame-2ac4d.firebaseapp.com",
  projectId: "splendgame-2ac4d",
  storageBucket: "splendgame-2ac4d.firebasestorage.app",
  messagingSenderId: "575101205323",
  appId: "1:575101205323:web:30b6de6cdc8490c600c6ce"
};

// Initialize Firebase (safeguarded for SSR and hot-reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
