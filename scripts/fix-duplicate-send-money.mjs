/**
 * fix-duplicate-send-money.mjs
 * ---------------------------------------------------------------------------
 * Fixes the "Send Money double-deduction" bug: SendMoneyScreen.tsx called
 * processTransfer() (which correctly moves money and creates ONE paired
 * "out"/"in" transaction sharing a single referenceNo) AND THEN also called
 * onConfirm -> addTransaction() in App.tsx, which deducted the SAME amount
 * from the sender a second time and created an extra, unpaired "out"
 * transaction with its own random referenceNo. The receiver was only ever
 * credited once (by processTransfer).
 *
 * DETECTION SIGNATURE:
 *   Every legitimate transfer from processTransfer() produces exactly TWO
 *   transactions sharing the same referenceNo — one "out" (sender) and one
 *   "in" (receiver). The buggy extra deduction from addTransaction() has NO
 *   matching "in" transaction anywhere with that referenceNo — it stands
 *   alone. That's the fingerprint this script looks for.
 *
 * WHAT THIS SCRIPT DOES:
 *   For every "out" transaction with category "Transfer", checks whether a
 *   matching "in" transaction (same referenceNo, category "Transfer") exists
 *   anywhere in the transactions collection. If not, that "out" transaction
 *   is a duplicate-deduction bug artifact — the script refunds that amount
 *   back to the sender's balance and marks the transaction as corrected.
 *
 * USAGE:
 *   node fix-duplicate-send-money.mjs            (dry run, default)
 *   node fix-duplicate-send-money.mjs --apply      (writes for real)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const txSnap = await db.collection("transactions").where("category", "==", "Transfer").get();
  log(`Loaded ${txSnap.size} Transfer-category transactions.`);

  // Build a lookup: referenceNo -> list of transactions sharing it.
  const byRefNo = new Map();
  txSnap.forEach((d) => {
    const tx = { id: d.id, ...d.data() };
    const ref = tx.referenceNo || "(none)";
    if (!byRefNo.has(ref)) byRefNo.set(ref, []);
    byRefNo.get(ref).push(tx);
  });

  const duplicates = [];
  for (const [ref, group] of byRefNo.entries()) {
    const hasIn = group.some((t) => t.type === "in");
    const outs = group.filter((t) => t.type === "out");
    if (!hasIn && outs.length > 0) {
      // No matching "in" anywhere with this referenceNo — every "out" in
      // this group is an orphaned, buggy duplicate deduction.
      for (const t of outs) duplicates.push(t);
    }
  }

  duplicates.sort((a, b) => {
    const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
    const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
    return aTime - bTime;
  });

  log(`\nFound ${duplicates.length} orphaned "out" Transfer transaction(s) — refund candidates.\n`);

  const usersSnap = await db.collection("users").get();
  const usersById = new Map();
  usersSnap.forEach((d) => usersById.set(d.id, d.data()));

  let totalRefunded = 0;
  for (const tx of duplicates) {
    const userName = usersById.get(tx.userId)?.displayName || tx.userId;
    log(`  [DUPLICATE] "${userName}" — ₱${(tx.amount || 0).toLocaleString()} on ${tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : "?"} (ref ${tx.referenceNo}, tx ${tx.id})`);
    totalRefunded += tx.amount || 0;

    if (APPLY) {
      await db.runTransaction(async (t) => {
        const userRef = db.collection("users").doc(tx.userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) return;
        const currentBalance = userDoc.data().balance || 0;

        t.update(userRef, { balance: currentBalance + (tx.amount || 0) });
        t.update(db.collection("transactions").doc(tx.id), {
          correctionApplied: true,
          correctedAt: FieldValue.serverTimestamp(),
          correctionNote: "Refunded — duplicate deduction from Send Money bug",
        });
        t.set(db.collection("transactions").doc(), {
          userId: tx.userId,
          type: "in",
          title: "Correction: Duplicate Send Money Refund",
          amount: tx.amount || 0,
          category: "Correction",
          status: "Completed",
          referenceNo: "EJ-REFUND-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          paymentMethod: "System Correction",
          timestamp: FieldValue.serverTimestamp(),
          relatedTxId: tx.id,
        });
      });
    }
  }

  log(`\nTotal to refund: ₱${totalRefunded.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  log(`${duplicates.length} correction(s) ${APPLY ? "applied." : "needed (dry run, not written)."}`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these refunds.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
