import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Using initializeFirestore with experimentalForceLongPolling to handle potential network blocks
// in restricted environments. This often fixes the "client is offline" error.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
