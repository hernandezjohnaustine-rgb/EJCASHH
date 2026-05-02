import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Use simple getFirestore — no persistence (fixes the multi-tab error)
export const db = getFirestore(app);

export const auth = getAuth(app);