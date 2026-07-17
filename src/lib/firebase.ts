import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ── App Check (reCAPTCHA v3) ────────────────────────────────────────────────
// Protects your Firebase resources (Firestore, Auth, Storage) from abuse by
// verifying that requests are coming from your real app, not a script or bot.
// The site key below is PUBLIC and safe to expose in frontend code — it's
// meant to be visible, unlike the secret key you entered in Firebase Console.
//
// For local development (localhost), App Check will block requests unless a
// debug token is registered — see the note below the code.
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
} else {
  console.warn("App Check not initialized: VITE_RECAPTCHA_SITE_KEY is missing.");
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
