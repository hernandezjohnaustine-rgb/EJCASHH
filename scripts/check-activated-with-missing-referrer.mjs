/**
 * check-activated-with-missing-referrer.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Among users missing originalReferrerId (despite having a resolvable
 * referredBy code), flags which ones are ALREADY activated — these need
 * a manual retroactive commission fix (like Cristita's), not just a
 * structural backfill, since their activation already happened without
 * distributing any commissions.
 *
 * USAGE:
 *   node check-activated-with-missing-referrer.mjs
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log("\n=== READ-ONLY DIAGNOSTIC — nothing will be changed ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const byReferralCode = new Map();
  allUsers.forEach((u) => { if (u.referralCode) byReferralCode.set(u.referralCode, u); });

  const missing = allUsers.filter((u) => u.referredBy && !u.originalReferrerId);
  log(`Found ${missing.length} user(s) with a referredBy code but no originalReferrerId.\n`);

  log("--- ALREADY ACTIVATED (need a manual commission fix, like Cristita's) ---\n");
  let activatedCount = 0;
  for (const u of missing) {
    if (u.isActivated === true) {
      activatedCount++;
      const resolved = byReferralCode.get(u.referredBy);
      log(`  ⚠️  "${u.displayName || u.id}" (uid ${u.id}) — activated ${u.activatedAt || "unknown"}, package: ${u.activePackage || "(none)"}, referrer: "${resolved?.displayName || "UNRESOLVED"}"`);
    }
  }
  if (activatedCount === 0) log("  None — good, no one in this state has activated yet.");

  log("\n--- NOT yet activated (safe — just need the structural backfill) ---\n");
  let notActivatedCount = 0;
  for (const u of missing) {
    if (u.isActivated !== true) {
      notActivatedCount++;
      log(`  "${u.displayName || u.id}" — not activated yet, no commission concern.`);
    }
  }
  if (notActivatedCount === 0) log("  None.");

  log(`\n=== SUMMARY ===`);
  log(`${activatedCount} already-activated account(s) need a manual commission fix.`);
  log(`${notActivatedCount} not-yet-activated account(s) just need the structural backfill (safe, no commission impact).`);

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
