/**
 * check-ejcashh02-collision.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Checks for ANY user documents with displayName or referralCode matching
 * "EJCASHH02" (there may be more than one — an old pre-existing account
 * and our newly created backbone account could collide), and shows
 * exactly which account Jerry G Pendoro's originalReferrerId points to.
 *
 * USAGE:
 *   node check-ejcashh02-collision.mjs
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

  log("--- Every account with displayName or referralCode matching 'EJCASHH02' ---\n");
  const matches = allUsers.filter((u) =>
    (u.displayName || "").toUpperCase().includes("EJCASHH02") ||
    (u.referralCode || "").toUpperCase().includes("EJCASHH02")
  );

  if (matches.length === 0) {
    log("None found.");
  } else {
    matches.forEach((u) => {
      log(`  uid: ${u.id}`);
      log(`    displayName: ${u.displayName}`);
      log(`    referralCode: ${u.referralCode}`);
      log(`    email: ${u.email}`);
      log(`    sponsorId: ${u.sponsorId || "(none)"}`);
      log(`    originalReferrerId: ${u.originalReferrerId || "(none)"}`);
      log(`    createdAt: ${u.createdAt || "unknown"}`);
      log("");
    });
  }

  log("--- Jerry G Pendoro's exact originalReferrerId ---\n");
  const jerryPendoro = allUsers.find((u) => u.displayName === "Jerry G Pendoro");
  if (jerryPendoro) {
    log(`  Jerry G Pendoro uid: ${jerryPendoro.id}`);
    log(`  referredBy (raw code used at signup): ${jerryPendoro.referredBy || "(none)"}`);
    log(`  originalReferrerId (resolved uid): ${jerryPendoro.originalReferrerId || "(none)"}`);
    const resolved = usersById.get(jerryPendoro.originalReferrerId);
    log(`  That uid belongs to: "${resolved?.displayName || "NOT FOUND"}" (createdAt: ${resolved?.createdAt || "unknown"})`);
  } else {
    log("  Jerry G Pendoro not found.");
  }

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
