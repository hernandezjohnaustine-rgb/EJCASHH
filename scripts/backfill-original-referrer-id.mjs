/**
 * backfill-original-referrer-id.mjs
 * ---------------------------------------------------------------------------
 * Sets originalReferrerId for every user currently missing it — using the
 * SAME resolution logic the app itself uses live (App.tsx's
 * handleActivationComplete):
 *   1. Try to resolve via their referredBy code (look up who owns that
 *      referral code).
 *   2. If that doesn't resolve, fall back to their current sponsorId
 *      (their matrix placement).
 *
 * This connects previously-orphaned matrix members up through the tree —
 * since the matrix now roots at JPOWER03 (after the recent re-root +
 * reflow), most of these fallback chains will naturally lead up through
 * JPOWER03 and into the EJCASHH01-11 backbone. This affects FUTURE
 * referral-chain (Level 2-11) commissions only — it does not touch any
 * past transactions or balances.
 *
 * USAGE:
 *   node backfill-original-referrer-id.mjs            (dry run)
 *   node backfill-original-referrer-id.mjs --apply     (writes)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  log(`Loaded ${allUsers.length} users.`);

  const byReferralCode = new Map();
  allUsers.forEach((u) => {
    if (u.referralCode) byReferralCode.set(u.referralCode, u.id);
  });
  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  const missing = allUsers.filter((u) => !u.originalReferrerId);
  log(`${missing.length} user(s) currently missing originalReferrerId.\n`);

  let resolvedViaCode = 0;
  let resolvedViaSponsor = 0;
  let unresolvable = 0;

  for (const u of missing) {
    let resolved = null;
    let method = "";

    if (u.referredBy && byReferralCode.has(u.referredBy)) {
      resolved = byReferralCode.get(u.referredBy);
      method = "referredBy code";
      resolvedViaCode++;
    } else if (u.sponsorId) {
      resolved = u.sponsorId;
      method = "sponsorId fallback";
      resolvedViaSponsor++;
    } else {
      unresolvable++;
      log(`  [UNRESOLVABLE] "${u.displayName || u.id}" — no referredBy match, no sponsorId either. Skipped.`);
      continue;
    }

    const resolvedName = usersById.get(resolved)?.displayName || resolved;
    log(`  [BACKFILL] "${u.displayName || u.id}" → originalReferrerId = "${resolvedName}" (via ${method})`);

    if (APPLY) {
      await db.collection("users").doc(u.id).update({
        originalReferrerId: resolved,
        originalReferrerBackfilledAt: Timestamp.now(),
        originalReferrerBackfillMethod: method,
      });
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`Resolved via referredBy code: ${resolvedViaCode}`);
  log(`Resolved via sponsorId fallback: ${resolvedViaSponsor}`);
  log(`Unresolvable (no referredBy, no sponsorId): ${unresolvable}`);
  log(`Total backfilled: ${resolvedViaCode + resolvedViaSponsor}`);
  log(`No commission transactions or balances were touched — this only affects FUTURE activations.`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
