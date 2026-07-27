/**
 * check-reroot-to-jpower03.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Reports:
 *   - How many direct children (sponsorId) the master/Office account
 *     currently has in the matrix
 *   - How many direct children JPOWER03 currently has
 *   - Whether re-pointing Office's direct children onto JPOWER03 would
 *     violate the 10-wide placement invariant (more than 10 combined)
 *   - A safe proposed plan either way
 *
 * USAGE:
 *   node check-reroot-to-jpower03.mjs
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const MASTER_EMAIL = "austinejohnter17@gmail.com";
const JPOWER_CODE = "JPOWER03";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log("\n=== READ-ONLY DIAGNOSTIC — nothing will be changed ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  log(`Loaded ${allUsers.length} users.`);

  const master = allUsers.find((u) => u.email === MASTER_EMAIL);
  const jpower = allUsers.find((u) => u.referralCode === JPOWER_CODE);

  if (!master) { log("\n⚠️  Master account not found."); return; }
  if (!jpower) { log("\n⚠️  JPOWER03 account not found (check referralCode value)."); return; }

  log(`\nMaster (Office): ${master.displayName || master.id} (uid ${master.id})`);
  log(`JPOWER03: ${jpower.displayName || jpower.id} (uid ${jpower.id})`);

  const officeChildren = allUsers.filter((u) => u.sponsorId === master.id);
  const jpowerChildren = allUsers.filter((u) => u.sponsorId === jpower.id);

  log(`\nOffice's current direct children in the matrix: ${officeChildren.length}`);
  officeChildren.forEach((c) => log(`  - ${c.displayName || c.id} (uid ${c.id})`));

  log(`\nJPOWER03's current direct children in the matrix: ${jpowerChildren.length}`);
  jpowerChildren.forEach((c) => log(`  - ${c.displayName || c.id} (uid ${c.id})`));

  const combined = officeChildren.length + jpowerChildren.length;
  log(`\n=== ANALYSIS ===`);
  log(`Combined direct children if merged under JPOWER03: ${combined} / 10 max`);

  if (combined <= 10) {
    log(`✅ SAFE — re-pointing Office's ${officeChildren.length} direct children to JPOWER03 stays within the 10-wide limit.`);
    log(`Proposed action: set sponsorId = JPOWER03's uid (${jpower.id}) on each of Office's current direct children.`);
  } else {
    log(`⚠️  WOULD EXCEED THE 10-WIDE LIMIT by ${combined - 10}.`);
    log(`Re-pointing all of Office's direct children directly onto JPOWER03 would break the placement-width rule.`);
    log(`Recommend discussing an alternative plan (e.g., re-running BFS placement for the excess children elsewhere in JPOWER03's subtree) before applying anything.`);
  }

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
