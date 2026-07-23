import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db, getMessagingIfSupported } from "../lib/firebase";

const VAPID_KEY = "BK9WlPcSFtyRVjwH-CUVIHMmClTRDGZdkdtyMwz6Q8e7rVwf6q20NVNjH0Us2eTbFFIorSEAgcBBWrRiyTDgdqU";

/**
 * Asks the user for notification permission, gets their FCM token, and saves
 * it on their user doc. Safe to call every time the app loads — if permission
 * was already granted, this just re-confirms the token (tokens can change).
 */
export async function setupPushNotifications(userId: string) {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return; // unsupported browser — silently skip, not an error

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

    if (token) {
      await setDoc(doc(db, "users", userId), { fcmToken: token, fcmTokenUpdatedAt: Timestamp.now() }, { merge: true });
    }

    // Foreground messages (app open + focused) — show a simple browser
    // notification manually, since onBackgroundMessage only covers
    // background/closed-tab cases.
    onMessage(messaging, (payload) => {
      if (payload.notification) {
        new Notification(payload.notification.title || "EJCASHH", {
          body: payload.notification.body || "",
          icon: "/logo192.png",
        });
      }
    });
  } catch (err) {
    console.error("Push notification setup failed:", err);
  }
}

/**
 * Detects whether the app is currently running as an installed PWA
 * (standalone display mode) and marks the user's account accordingly.
 * Called once on load, and again if the user installs mid-session via the
 * 'appinstalled' event.
 */
export async function detectAndSaveInstallStatus(userId: string) {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true; // iOS Safari

  if (isStandalone) {
    await setDoc(doc(db, "users", userId), { isInstalled: true }, { merge: true });
  }

  window.addEventListener("appinstalled", async () => {
    await setDoc(doc(db, "users", userId), { isInstalled: true }, { merge: true });
  });
}
