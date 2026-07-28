/**
 * check-cristita-activation.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Traces Cristita's referral data and EJCASHH11's state to understand why
 * the Level 2 referral-chain Credits payment to EJCASHH11 may not have
 * fired, despite the Level 1 cash payment succeeding.
 *
 * USAGE:
 *   node check-cristita-activation.mjs
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

  const cristita = allUsers.find((u) => u.email === "cristyalumno@gmail.com");
  const ejcashh11 = allUsers.find((u) => u.displayName === "EJCASHH11");

  if (!cristita) { log("⚠️  No user with email cristyalumno@gmail.com found."); return; }
  if (!ejcashh11) { log("⚠️  EJCASHH11 not found."); return; }

  log("--- Cristita's data ---\n");
  log(`  uid: ${cristita.id}`);
  log(`  displayName: ${cristita.displayName}`);
  log(`  email: ${cristita.email}`);
  log(`  referredBy (code used at signup): ${cristita.referredBy || "(none)"}`);
  log(`  originalReferrerId (resolved uid): ${cristita.originalReferrerId || "(none)"}`);
  log(`  That uid belongs to: "${usersById.get(cristita.originalReferrerId)?.displayName || "NOT FOUND / MISMATCH"}"`);
  log(`  sponsorId: ${cristita.sponsorId || "(none)"}`);
  log(`  isActivated: ${cristita.isActivated === true}`);
  log(`  activePackage: ${cristita.activePackage || "(none)"}`);
  log(`  activatedAt: ${cristita.activatedAt || "(none)"}`);
  log(`  createdAt: ${cristita.createdAt || "(none)"}`);

  log("\n--- EJCASHH11's data ---\n");
  log(`  uid: ${ejcashh11.id}`);
  log(`  referralCode: ${ejcashh11.referralCode}`);
  log(`  creditsBalance: ${ejcashh11.creditsBalance || 0}`);
  log(`  balance: ${ejcashh11.balance || 0}`);
  log(`  originalReferrerId: ${ejcashh11.originalReferrerId || "(none)"} — "${usersById.get(ejcashh11.originalReferrerId)?.displayName || ""}"`);

  log("\n--- Recent transactions involving Cristita (as fromUserId) ---\n");
  const txSnap = await db.collection("transactions")
    .where("fromUserId", "==", cristita.id)
    .get();

  if (txSnap.empty) {
    log("  None found — no commission transactions reference Cristita's activation at all.");
  } else {
    txSnap.forEach((d) => {
      const tx = d.data();
      const recipientName = usersById.get(tx.userId)?.displayName || tx.userId;
      log(`  tx ${d.id}: "${recipientName}" received ₱${tx.amount} — "${tx.title}" (Level ${tx.commissionLevel}, ${tx.isCredits ? "Credits" : "Cash"})`);
    });
  }

  log("\n--- Cristita's referral code lookup verification ---\n");
  if (cristita.referredBy) {
    const codeSnap = await db.collection("referralCodes").doc(cristita.referredBy).get();
    if (codeSnap.exists) {
      log(`  referralCodes/${cristita.referredBy} → uid ${codeSnap.data().uid} ("${usersById.get(codeSnap.data().uid)?.displayName || "NOT FOUND"}")`);
    } else {
      log(`  ⚠️  No referralCodes/${cristita.referredBy} lookup doc exists!`);
    }
  }

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
