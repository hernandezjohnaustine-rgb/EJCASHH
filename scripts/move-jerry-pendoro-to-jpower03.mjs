/**
 * move-jerry-pendoro-to-jpower03.mjs
 * ---------------------------------------------------------------------------
 * Changes Jerry G Pendoro's originalReferrerId from EJCASHH02 to
 * JPOWER03 directly — removing the EJCASHH02 connection entirely.
 * His own referral-chain children (Sheryllyn gayo, etc.) are untouched;
 * only HIS OWN parent link moves.
 *
 * This only affects FUTURE Level 2-11 Referral Chain commissions — it
 * does not touch any past transactions or balances.
 *
 * USAGE:
 *   node move-jerry-pendoro-to-jpower03.mjs            (dry run)
 *   node move-jerry-pendoro-to-jpower03.mjs --apply     (writes)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const JPOWER_CODE = "JPOWER03";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const jpower = allUsers.find((u) => u.referralCode === JPOWER_CODE);
  const jerry = allUsers.find((u) => u.displayName === "Jerry G Pendoro" && u.sponsorId === jpower?.id);

  if (!jpower) { log("⚠️  JPOWER03 not found."); return; }
  if (!jerry) { log("⚠️  Jerry G Pendoro not found (matching the one placed under JPOWER03 in the matrix)."); return; }

  const oldReferrer = allUsers.find((u) => u.id === jerry.originalReferrerId);

  log(`Jerry G Pendoro (uid ${jerry.id})`);
  log(`Current originalReferrerId: "${oldReferrer?.displayName || jerry.originalReferrerId}"`);
  log(`\n[FIX] originalReferrerId: "${oldReferrer?.displayName}" → "${jpower.displayName}" (JPOWER03)`);

  if (APPLY) {
    await db.collection("users").doc(jerry.id).update({
      originalReferrerId: jpower.id,
      previousOriginalReferrerId: jerry.originalReferrerId || null,
      movedToJpower03At: Timestamp.now(),
    });
  }

  log(`\n=== SUMMARY ===`);
  log(`Jerry G Pendoro is now directly connected to JPOWER03 in the Referral Chain.`);
  log(`His own referral-chain children (Sheryllyn gayo, etc.) are unaffected.`);
  log(`No commission transactions or balances were touched — this only affects FUTURE activations.`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review carefully, then re-run with --apply to write this change.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
