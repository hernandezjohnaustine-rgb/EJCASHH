/**
 * fix-duplicate-chain-bonus.mjs
 * ---------------------------------------------------------------------------
 * Fixes the "chain termination" bug in earningsService.ts's Step 2, which
 * caused Step 2B (Referral Chain Bonus, Level 12-20) to incorrectly re-pay
 * whoever was the LAST recipient of a short referral chain a SECOND time,
 * mislabeled as "Level 12" (or higher).
 *
 * DETECTION: a "Level X Referral Chain Bonus" transaction (X 12-20) that:
 *   - Has NO retroLevelMigrationTag (i.e. it came from a LIVE activation,
 *     not the retroactive migration script, which never had this bug), AND
 *   - Was paid to the SAME userId, from the SAME fromUserId (same
 *     activation event), as an existing "Level Y Referral Commission"
 *     transaction (Y 2-11) — proving this person was already correctly
 *     paid as the chain's genuine endpoint, and the Level 12+ payment is
 *     the erroneous duplicate.
 *
 * Refunds (claws back) the erroneous amount and voids the transaction.
 *
 * USAGE:
 *   node fix-duplicate-chain-bonus.mjs            (dry run)
 *   node fix-duplicate-chain-bonus.mjs --apply     (writes)
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
  const usersById = new Map();
  usersSnap.forEach((d) => usersById.set(d.id, d.data()));

  const txSnap = await db.collection("transactions")
    .where("category", "==", "Commission")
    .where("isCredits", "==", true)
    .get();

  // Build a lookup of Level 2-11 "Referral Commission" payments, keyed by
  // userId + fromUserId, so we can check if the same person/event pair
  // also has an erroneous Level 12+ "Referral Chain Bonus" payment.
  const shortChainPayments = new Set();
  const bonusPayments = [];

  txSnap.forEach((d) => {
    const tx = d.data();
    const key = `${tx.userId}|${tx.fromUserId}`;
    if (tx.commissionLevel >= 2 && tx.commissionLevel <= 11) {
      shortChainPayments.add(key);
    } else if (tx.commissionLevel >= 12 && tx.commissionLevel <= 20 && !tx.retroLevelMigrationTag && (tx.title || "").includes("Referral Chain Bonus")) {
      bonusPayments.push({ id: d.id, ...tx, key });
    }
  });

  let clawbackCount = 0;
  let clawbackTotal = 0;

  for (const tx of bonusPayments) {
    if (!shortChainPayments.has(tx.key)) continue; // not a duplicate — genuinely earned via a long chain

    const recipientName = usersById.get(tx.userId)?.displayName || tx.userId;
    log(`  [CLAWBACK] "${recipientName}" — tx ${tx.id}: ₱${tx.amount} Level ${tx.commissionLevel} Referral Chain Bonus (duplicate of their own short-chain payment from the same activation)`);
    clawbackCount++;
    clawbackTotal += tx.amount || 0;

    if (APPLY) {
      await db.runTransaction(async (t) => {
        const userRef = db.collection("users").doc(tx.userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) return;
        const currentCredits = userDoc.data().creditsBalance || 0;
        t.update(userRef, { creditsBalance: Math.max(0, currentCredits - (tx.amount || 0)) });
        t.update(db.collection("transactions").doc(tx.id), {
          amount: 0,
          originalAmount: tx.amount,
          fullyClawedBack: true,
          clawbackReason: "duplicate-chain-termination-bug",
          clawedBackAt: Timestamp.now(),
        });
      });
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`${clawbackCount} duplicate transaction(s) found, ₱${clawbackTotal.toLocaleString()} total clawed back.`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
