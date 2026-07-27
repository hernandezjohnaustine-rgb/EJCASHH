/**
 * connect-jpower03-to-ejcashh11.mjs
 * ---------------------------------------------------------------------------
 * Fixes JPOWER03's originalReferrerId to point to EJCASHH11 — completing
 * the intended EJCASHH01 → 02 → ... → 11 → JPOWER03 backbone chain.
 * JPOWER03 previously kept his real, pre-existing referrer ("Jerry G
 * Pendoro") since he's an existing account, not one created through the
 * "+" Add User flow (which only sets this field on brand-new accounts).
 *
 * This only affects FUTURE Level 2-11 Referral Chain commissions — it
 * does not touch any past transactions or balances.
 *
 * USAGE:
 *   node connect-jpower03-to-ejcashh11.mjs            (dry run)
 *   node connect-jpower03-to-ejcashh11.mjs --apply     (writes)
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
  const ejcashh11 = allUsers.find((u) => u.displayName === "EJCASHH11");

  if (!jpower) { log("⚠️  JPOWER03 not found."); return; }
  if (!ejcashh11) { log("⚠️  EJCASHH11 not found."); return; }

  log(`JPOWER03 = "${jpower.displayName}" (uid ${jpower.id})`);
  log(`Current originalReferrerId: ${jpower.originalReferrerId || "(none)"} ("${allUsers.find(u => u.id === jpower.originalReferrerId)?.displayName || "unknown"}")`);
  log(`EJCASHH11 = uid ${ejcashh11.id}\n`);

  log(`[FIX] JPOWER03's originalReferrerId: "${allUsers.find(u => u.id === jpower.originalReferrerId)?.displayName || jpower.originalReferrerId}" → "EJCASHH11"`);

  if (APPLY) {
    await db.collection("users").doc(jpower.id).update({
      originalReferrerId: ejcashh11.id,
      previousOriginalReferrerId: jpower.originalReferrerId || null,
      connectedToBackboneAt: Timestamp.now(),
    });
  }

  log(`\n=== SUMMARY ===`);
  log(`JPOWER03 is now connected to EJCASHH11 in the Referral Chain.`);
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
