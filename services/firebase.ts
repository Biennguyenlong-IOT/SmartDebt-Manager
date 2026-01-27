
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-co7F8usqcVEL0zN1pp3FZ2X2MkGMB9M",
  authDomain: "smartdebt-manager.firebaseapp.com",
  projectId: "smartdebt-manager",
  storageBucket: "smartdebt-manager.firebasestorage.app",
  messagingSenderId: "118594209004",
  appId: "1:118594209004:web:b6f520b07f79dfc4d5d1c9",
};

// Kiểm tra tính hợp lệ của cấu hình
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
    console.log("Firebase initialized successfully for project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

export const db = dbInstance;
