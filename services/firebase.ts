
import * as firebaseApp from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Using destructuring from a namespace import to resolve "no exported member" errors in some TypeScript environments
const { initializeApp, getApps, getApp } = firebaseApp;

const firebaseConfig = {
  apiKey: "AIzaSyC-co7F8usqcVEL0zN1pp3FZ2X2MkGMB9M",
  authDomain: "smartdebt-manager.firebaseapp.com",
  projectId: "smartdebt-manager",
  storageBucket: "smartdebt-manager.firebasestorage.app",
  messagingSenderId: "118594209004",
  appId: "1:118594209004:web:b6f520b07f79dfc4d5d1c9",
};

export const isFirebaseConfigured = 
  firebaseConfig.projectId !== "" && 
  !firebaseConfig.projectId.includes("YOUR_") &&
  !firebaseConfig.apiKey.includes("YOUR_");

let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const apps = getApps();
    const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    console.log("Firebase/Firestore initialized successfully");
  } catch (error) {
    console.error("Firebase Init Error:", error);
  }
}

export const db = dbInstance;
