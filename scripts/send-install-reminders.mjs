/**
 * send-install-reminders.mjs
 * ---------------------------------------------------------------------------
 * Runs automatically on a schedule (see .github/workflows/send-install-reminders.yml).
 * Sends a push notification to every user who:
 *   - Signed up at least 1 day ago
 *   - Has NOT installed the app (isInstalled !== true)
 *   - Has a saved FCM token (they granted notification permission)
 *   - Has not already been reminded TODAY (avoids double-sends if the
 *     schedule ever runs twice, and naturally spaces out daily reminders)
 *
 * Uses a DEDICATED, limited-permission service account (Firebase Cloud
 * Messaging Admin + Cloud Datastore User only) — NOT the full admin key used
 * for the one-off migration scripts. This key is meant to stay in GitHub
 * Secrets long-term for the scheduled workflow to keep working.
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const messaging = getMessaging();

function log(...args) { console.log(...args); }

function daysSince(dateInput) {
  if (!dateInput) return Infinity;
  const then = new Date(dateInput).getTime();
  if (isNaN(then)) return Infinity;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

function isToday(timestamp) {
  if (!timestamp) return false;
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

async function main() {
  log("\n=== Install Reminder Run —", new Date().toISOString(), "===\n");

  const usersSnap = await db.collection("users").get();
  log(`Loaded ${usersSnap.size} users.`);

  let eligibleCount = 0;
  let sentCount = 0;
  let failedCount = 0;

  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;

    if (data.isInstalled === true) continue;
    if (!data.fcmToken) continue;
    if (daysSince(data.createdAt) < 1) continue;
    if (isToday(data.lastInstallReminderAt)) continue;

    eligibleCount++;

    try {
      await messaging.send({
        token: data.fcmToken,
        notification: {
          title: "📲 Install EJCASHH for faster access!",
          body: "Add EJCASHH to your home screen to get instant access anytime — tap to install now.",
        },
        webpush: {
          fcmOptions: { link: "https://my-ejcashh-app.web.app" },
        },
      });
      sentCount++;
      await db.collection("users").doc(uid).update({ lastInstallReminderAt: Timestamp.now() });
      log(`  [SENT] ${data.displayName || uid} <${data.email || "no email"}>`);
    } catch (err) {
      failedCount++;
      log(`  [FAILED] ${data.displayName || uid} — ${err.message || err}`);
      // A token can become permanently invalid (uninstalled, permission
      // revoked, etc.) — clear it so we stop retrying forever.
      if (err.code === "messaging/registration-token-not-registered") {
        await db.collection("users").doc(uid).update({ fcmToken: null });
      }
    }
  }

  log(`\n${eligibleCount} user(s) were eligible for a reminder today.`);
  log(`${sentCount} notification(s) sent successfully.`);
  log(`${failedCount} failed (invalid/expired tokens cleared automatically).`);
  log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("Install reminder script failed:", err);
  process.exit(1);
});
