/**
 * audit-office-transfers.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY reconciliation report. Does not write or change anything.
 *
 * For the "Office" account, this checks every "out" Send Money transaction
 * against the matching "in" transaction on the receiver's side (same
 * referenceNo — the same pairing signature used by fix-duplicate-send-money.mjs).
 * It reports:
 *   - Every transfer Office sent, and whether the receiver actually got a
 *     matching credit for it
 *   - Total amount Office sent (based on legitimate, paired transactions)
 *   - Total amount receivers actually received from Office
 *   - Any remaining orphaned/unpaired transactions (should be ZERO after the
 *     fix-duplicate-send-money.mjs correction was applied)
 *
 * USAGE:
 *   node audit-office-transfers.mjs
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
  log("\n=== READ-ONLY AUDIT — nothing will be changed ===\n");

  // Find the "Office" account.
  const usersSnap = await db.collection("users").get();
  let officeUid = null;
  let officeEmail = null;
  usersSnap.forEach((d) => {
    const data = d.data();
    if ((data.displayName || "").trim() === "Office") {
      officeUid = d.id;
      officeEmail = data.email;
    }
  });

  if (!officeUid) {
    log('No account with displayName "Office" was found. Aborting.');
    return;
  }
  log(`Found "Office" account: uid=${officeUid}, email=${officeEmail}\n`);

  const usersById = new Map();
  usersSnap.forEach((d) => usersById.set(d.id, d.data()));

  // All Transfer transactions in the system, grouped by referenceNo.
  const txSnap = await db.collection("transactions").where("category", "==", "Transfer").get();
  const byRefNo = new Map();
  txSnap.forEach((d) => {
    const tx = { id: d.id, ...d.data() };
    const ref = tx.referenceNo || "(none)";
    if (!byRefNo.has(ref)) byRefNo.set(ref, []);
    byRefNo.get(ref).push(tx);
  });

  // Every "out" Transfer transaction that belongs to Office.
  const officeOuts = [];
  txSnap.forEach((d) => {
    const tx = { id: d.id, ...d.data() };
    if (tx.userId === officeUid && tx.type === "out") officeOuts.push(tx);
  });
  officeOuts.sort((a, b) => {
    const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
    const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
    return aTime - bTime;
  });

  log(`Office has ${officeOuts.length} "out" Transfer transaction(s) on record.\n`);

  let totalSentLegit = 0;
  let totalReceivedByOthers = 0;
  let orphanedCount = 0;
  let orphanedTotal = 0;
  let correctedCount = 0;

  for (const tx of officeOuts) {
    const group = byRefNo.get(tx.referenceNo || "(none)") || [];
    const matchingIn = group.find((t) => t.type === "in" && t.id !== tx.id);
    const receiverName = (tx.title || "").replace(/^Sent to /, "");

    if (tx.correctionApplied) {
      correctedCount++;
      log(`  [ALREADY CORRECTED] ₱${(tx.amount || 0).toLocaleString()} → "${receiverName}" (ref ${tx.referenceNo}) — refunded to Office, not counted as a real send.`);
      continue;
    }

    if (matchingIn) {
      totalSentLegit += tx.amount || 0;
      totalReceivedByOthers += matchingIn.amount || 0;
      const match = (tx.amount || 0) === (matchingIn.amount || 0) ? "✅ amounts match" : "⚠️ AMOUNT MISMATCH";
      log(`  [OK] ₱${(tx.amount || 0).toLocaleString()} → "${receiverName}" (ref ${tx.referenceNo}) — receiver credited ₱${(matchingIn.amount || 0).toLocaleString()} ${match}`);
    } else {
      orphanedCount++;
      orphanedTotal += tx.amount || 0;
      log(`  [⚠️ ORPHANED — NO RECEIVER CREDIT FOUND] ₱${(tx.amount || 0).toLocaleString()} → "${receiverName}" (ref ${tx.referenceNo}, tx ${tx.id}) — this should NOT exist after the fix; investigate.`);
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`Legitimate transfers (receiver confirmed credited): ${officeOuts.length - orphanedCount - correctedCount}`);
  log(`Total Office genuinely sent: ₱${totalSentLegit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  log(`Total receivers actually received from Office: ₱${totalReceivedByOthers.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  log(`Already-corrected duplicates (excluded from totals above): ${correctedCount}`);
  log(`Remaining orphaned/unpaired transactions found: ${orphanedCount} (total ₱${orphanedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })})`);

  if (totalSentLegit !== totalReceivedByOthers) {
    log(`\n⚠️  MISMATCH: sent total does not equal received total — needs manual review.`);
  } else {
    log(`\n✅ Sent and received totals match exactly — every legitimate transfer was correctly credited once.`);
  }

  if (orphanedCount > 0) {
    log(`\n⚠️  There are still ${orphanedCount} orphaned transaction(s) not yet corrected. Consider re-running fix-duplicate-send-money.mjs.`);
  }

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
