/**
 * check-all-broken-directs.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Scans EVERY user for broken "direct" (referrer) connections:
 *   A) Has a referredBy code but originalReferrerId is missing/empty
 *   B) Has a referredBy code that doesn't resolve to any real account
 *   C) Is activated but has no sponsorId (never got auto-placed in the matrix)
 *   D) originalReferrerId points to a uid that doesn't actually exist
 *
 * USAGE:
 *   node check-all-broken-directs.mjs
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
  const usersById = new Map(allUsers.map((u) => [u.id, u]));
  const byReferralCode = new Map();
  allUsers.forEach((u) => { if (u.referralCode) byReferralCode.set(u.referralCode, u); });

  log(`Loaded ${allUsers.length} users.\n`);

  // Sort by createdAt, most recent first, so newest accounts show up top.
  const sorted = [...allUsers].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  log("--- A) Has referredBy code but originalReferrerId is missing ---\n");
  let countA = 0;
  for (const u of sorted) {
    if (u.referredBy && !u.originalReferrerId) {
      countA++;
      const resolved = byReferralCode.get(u.referredBy);
      log(`  "${u.displayName || u.id}" (created ${u.createdAt || "unknown"}) — referredBy: "${u.referredBy}" → ${resolved ? `resolves to "${resolved.displayName}"` : "DOES NOT RESOLVE TO ANY ACCOUNT"}`);
    }
  }
  if (countA === 0) log("  None found.");

  log("\n--- B) referredBy code that doesn't resolve to any real account ---\n");
  let countB = 0;
  for (const u of sorted) {
    if (u.referredBy && !byReferralCode.has(u.referredBy)) {
      countB++;
      log(`  "${u.displayName || u.id}" — referredBy code "${u.referredBy}" has NO matching account`);
    }
  }
  if (countB === 0) log("  None found.");

  log("\n--- C) Activated but has no sponsorId (never auto-placed in matrix) ---\n");
  let countC = 0;
  for (const u of sorted) {
    if (u.isActivated === true && !u.sponsorId) {
      countC++;
      log(`  "${u.displayName || u.id}" (activated ${u.activatedAt || "unknown"}) — no sponsorId`);
    }
  }
  if (countC === 0) log("  None found.");

  log("\n--- D) originalReferrerId points to a uid that doesn't exist ---\n");
  let countD = 0;
  for (const u of sorted) {
    if (u.originalReferrerId && !usersById.has(u.originalReferrerId)) {
      countD++;
      log(`  "${u.displayName || u.id}" — originalReferrerId "${u.originalReferrerId}" does not exist`);
    }
  }
  if (countD === 0) log("  None found.");

  log("\n--- Most recently created accounts (last 10), for quick eyeballing ---\n");
  sorted.slice(0, 10).forEach((u) => {
    log(`  "${u.displayName || u.id}" — created ${u.createdAt || "unknown"} | referredBy: ${u.referredBy || "(none)"} | originalReferrerId: ${u.originalReferrerId ? (usersById.get(u.originalReferrerId)?.displayName || "MISMATCH") : "(none)"} | sponsorId: ${u.sponsorId ? (usersById.get(u.sponsorId)?.displayName || "MISMATCH") : "(none)"} | isActivated: ${u.isActivated === true}`);
  });

  log(`\n=== SUMMARY ===`);
  log(`A) Missing originalReferrerId despite having referredBy: ${countA}`);
  log(`B) referredBy code that doesn't resolve: ${countB}`);
  log(`C) Activated but no sponsorId: ${countC}`);
  log(`D) originalReferrerId points to nonexistent uid: ${countD}`);

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
