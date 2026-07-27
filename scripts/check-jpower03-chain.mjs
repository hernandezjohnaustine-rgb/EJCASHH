/**
 * check-jpower03-chain.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Traces JPOWER03's originalReferrerId chain upward, step by step, to
 * confirm whether it's actually connected through the EJCASHH01-11
 * backbone (as intended), and counts how many users currently have a
 * chain that leads up through JPOWER03 (meaning their future activations
 * would generate Level 2-11 Referral Chain commissions for him and the
 * backbone above him).
 *
 * USAGE:
 *   node check-jpower03-chain.mjs
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const JPOWER_CODE = "JPOWER03";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log("\n=== READ-ONLY DIAGNOSTIC — nothing will be changed ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  const jpower = allUsers.find((u) => u.referralCode === JPOWER_CODE);
  if (!jpower) { log("⚠️  JPOWER03 not found."); return; }

  log(`JPOWER03 = "${jpower.displayName}" (uid ${jpower.id})\n`);
  log("--- Tracing originalReferrerId chain upward from JPOWER03 ---\n");

  let current = jpower;
  let steps = 0;
  while (current && steps < 15) {
    const parentId = current.originalReferrerId;
    if (!parentId) {
      log(`  "${current.displayName}" has NO originalReferrerId — chain ends here.`);
      break;
    }
    const parent = usersById.get(parentId);
    log(`  "${current.displayName}" → originalReferrerId → "${parent?.displayName || parentId}"`);
    current = parent;
    steps++;
  }

  // Count how many users' chain leads up through JPOWER03 at all.
  function chainReachesJpower(uid, depth = 0) {
    if (depth > 25) return false; // safety guard against cycles
    const u = usersById.get(uid);
    if (!u) return false;
    if (u.id === jpower.id) return true;
    if (!u.originalReferrerId) return false;
    return chainReachesJpower(u.originalReferrerId, depth + 1);
  }

  let reachCount = 0;
  for (const u of allUsers) {
    if (u.id === jpower.id) continue;
    if (u.originalReferrerId && chainReachesJpower(u.id)) reachCount++;
  }

  log(`\n=== SUMMARY ===`);
  log(`${reachCount} user(s) currently have an originalReferrerId chain that leads up through JPOWER03.`);
  log(`These users' FUTURE activations will generate Level 2-11 Referral Chain Credits for JPOWER03 and everyone above him in the backbone.`);
  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
