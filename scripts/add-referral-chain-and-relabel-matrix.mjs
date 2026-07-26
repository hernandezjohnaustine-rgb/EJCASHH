/**
 * add-referral-chain-and-relabel-matrix.mjs
 * ---------------------------------------------------------------------------
 * Three-phase retroactive migration, matching the new numbering scheme:
 *   Level 1        = direct referral cash bonus (UNCHANGED, untouched)
 *   Levels 2-10    = NEW referral-chain tier (originalReferrerId, unilevel)
 *   Levels 11-20   = the ORIGINAL team matrix tier (previously labeled 2-10)
 *
 * PHASE 0 — Relabel existing matrix transactions:
 *   Every historical Commission transaction with commissionLevel 2-10 was
 *   from the OLD team matrix. Since that tier is now labeled 11-20, this
 *   phase shifts commissionLevel by +10 and updates the title text on
 *   those existing transactions. Pure relabeling — does NOT touch amounts
 *   or balances.
 *
 * PHASE 1 — Package 2 rate correction (on the newly-relabeled 11-20 range):
 *   Package 2 (and Combined) matrix levels used to pay ₱30/level (₱33 for
 *   Combined). The new rate is ₱10/level (₱13 for Combined). Corrects both
 *   the transaction record and the recipient's creditsBalance, deducting
 *   the ₱20/level excess.
 *
 * PHASE 2 — New Levels 2-10 (referral chain):
 *   For every historical activation event, walks up the activating user's
 *   TRUE direct referrer chain (originalReferrerId) nine levels beyond
 *   their own direct referrer (who already got the Level 1 cash bonus),
 *   crediting each with Credits at the same flat per-level rate.
 *   Idempotent — tagged so re-running this script never double-pays.
 *
 * RUN PHASE 0 BEFORE PHASE 1 — order matters. This script always runs all
 * three phases together in the correct order.
 *
 * USAGE:
 *   node add-referral-chain-and-relabel-matrix.mjs            (dry run)
 *   node add-referral-chain-and-relabel-matrix.mjs --apply     (writes)
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

function getNewCommission(level, packageId) {
  if (packageId === "package_1") return level === 1 ? 100 : 3;
  if (packageId === "package_2") return level === 1 ? 1000 : 10;
  if (packageId === "combined") return (level === 1 ? 100 : 3) + (level === 1 ? 1000 : 10);
  return 0;
}

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  const usersById = new Map();
  usersSnap.forEach((d) => usersById.set(d.id, d.data()));
  log(`Loaded ${usersSnap.size} users.`);

  // ── PHASE 0: Relabel existing matrix transactions (Level 2-10 → 11-20) ──
  log("\n--- PHASE 0: Relabeling existing matrix transactions from Level 2-10 to Level 11-20 ---\n");

  const allCommissionTxSnap = await db.collection("transactions")
    .where("category", "==", "Commission")
    .where("isCredits", "==", true)
    .get();

  let relabelCount = 0;

  for (const txDoc of allCommissionTxSnap.docs) {
    const tx = txDoc.data();
    const level = tx.commissionLevel;
    if (!level || level < 2 || level > 10) continue; // only the old matrix range
    if (tx.relabeledToMatrixTier) continue; // already relabeled by a previous run
    if (tx.title && tx.title.includes("Referral Commission")) continue; // safety: never touch the new tier's own transactions

    const newLevel = level + 10;
    const recipientName = usersById.get(tx.userId)?.displayName || tx.userId;
    log(`  [RELABEL] "${recipientName}" — tx ${txDoc.id}: Level ${level} → Level ${newLevel} (matrix tier)`);
    relabelCount++;

    if (APPLY) {
      await db.collection("transactions").doc(txDoc.id).update({
        commissionLevel: newLevel,
        title: "Level " + newLevel + " Indirect Commission",
        relabeledToMatrixTier: true,
        relabeledAt: Timestamp.now(),
      });
    }
  }

  log(`\nPhase 0: ${relabelCount} transaction(s) relabeled.`);

  // ── PHASE 1: Package 2 / Combined rate correction (now on 11-20) ───────
  log("\n--- PHASE 1: Correcting old Package 2 / Combined matrix rate (₱30→₱10, ₱33→₱13) ---\n");

  // Re-fetch so we see the just-relabeled commissionLevel values.
  const matrixTxSnap = await db.collection("transactions")
    .where("category", "==", "Commission")
    .where("isCredits", "==", true)
    .get();

  let clawbackCount = 0;
  let clawbackTotal = 0;

  for (const txDoc of matrixTxSnap.docs) {
    const tx = txDoc.data();
    // In dry-run, levels are still 2-10 (not actually relabeled yet) — check both ranges.
    const effectiveLevel = APPLY ? tx.commissionLevel : (tx.commissionLevel >= 2 && tx.commissionLevel <= 10 ? tx.commissionLevel + 10 : tx.commissionLevel);
    if (!effectiveLevel || effectiveLevel < 11 || effectiveLevel > 20) continue;
    if (tx.retroRateCorrected) continue;

    let oldExpected = null, newAmount = null;
    if (tx.packageId === "package_2") { oldExpected = 30; newAmount = 10; }
    else if (tx.packageId === "combined") { oldExpected = 33; newAmount = 13; }
    else continue;

    if (tx.amount !== oldExpected) continue;

    const excess = oldExpected - newAmount;
    const recipientName = usersById.get(tx.userId)?.displayName || tx.userId;
    log(`  [CLAWBACK] "${recipientName}" — L${effectiveLevel} tx ${txDoc.id}: ₱${oldExpected} → ₱${newAmount} (refund ₱${excess} deducted)`);
    clawbackCount++;
    clawbackTotal += excess;

    if (APPLY) {
      await db.runTransaction(async (t) => {
        const userRef = db.collection("users").doc(tx.userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) return;
        const currentCredits = userDoc.data().creditsBalance || 0;
        t.update(userRef, { creditsBalance: Math.max(0, currentCredits - excess) });
        t.update(db.collection("transactions").doc(txDoc.id), {
          amount: newAmount,
          retroRateCorrected: true,
          retroRateCorrectedAt: Timestamp.now(),
        });
      });
    }
  }

  log(`\nPhase 1: ${clawbackCount} transaction(s) corrected, ₱${clawbackTotal.toLocaleString()} total clawed back.`);

  // ── PHASE 2: New Levels 2-10 (referral chain) ──────────────────────────
  log("\n--- PHASE 2: Adding new Levels 2-10 (referral chain) ---\n");

  const activationTxSnap = await db.collection("transactions")
    .where("category", "==", "Activation")
    .get();

  const eventsByUser = new Map();
  activationTxSnap.forEach((d) => {
    const tx = d.data();
    if (!eventsByUser.has(tx.userId)) eventsByUser.set(tx.userId, []);
    eventsByUser.get(tx.userId).push({
      packageId: tx.packageId || "package_1",
      timestamp: tx.timestamp,
      sourceId: d.id,
    });
  });

  for (const [uid, data] of usersById.entries()) {
    if (data.isActivated && !eventsByUser.has(uid)) {
      eventsByUser.set(uid, [{
        packageId: data.activePackage || "package_1",
        timestamp: data.activatedAt || null,
        sourceId: "manual-" + uid,
      }]);
    }
  }

  let totalEvents = 0;
  eventsByUser.forEach((list) => (totalEvents += list.length));
  log(`Found ${totalEvents} activation event(s) across ${eventsByUser.size} user(s).`);

  let newTierCount = 0;
  let newTierTotal = 0;

  for (const [uid, events] of eventsByUser.entries()) {
    const userData = usersById.get(uid);
    if (!userData) continue;
    const referrerId = userData.originalReferrerId || null;
    if (!referrerId) continue;

    for (const event of events) {
      let chainUid = referrerId;
      for (let level = 2; level <= 10; level++) {
        if (!chainUid) break;
        const chainData = usersById.get(chainUid);
        if (!chainData) break;

        const tag = `retro-L${level}-${uid}-${event.sourceId}`;
        const commission = getNewCommission(level, event.packageId);
        const recipientName = chainData.displayName || chainUid;

        log(`  [L${level}] "${recipientName}" earns ₱${commission} Credits (from ${userData.displayName || uid}'s ${event.packageId} activation)`);
        newTierCount++;
        newTierTotal += commission;

        if (APPLY) {
          const existing = await db.collection("transactions")
            .where("retroLevelMigrationTag", "==", tag)
            .limit(1)
            .get();
          if (existing.empty) {
            await db.runTransaction(async (t) => {
              const chainRef = db.collection("users").doc(chainUid);
              const freshChainDoc = await t.get(chainRef);
              if (!freshChainDoc.exists) return;
              const freshCredits = freshChainDoc.data().creditsBalance || 0;
              t.update(chainRef, {
                creditsBalance: freshCredits + commission,
                "stats.totalEarnings": (freshChainDoc.data().stats?.totalEarnings || 0) + commission,
              });
              t.set(db.collection("transactions").doc(), {
                userId: chainUid,
                type: "in",
                title: "Level " + level + " Referral Commission (Retroactive)",
                amount: commission,
                isCredits: true,
                category: "Commission",
                status: "Completed",
                referenceNo: "EJ-RETRO-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
                paymentMethod: "MLM Commission",
                timestamp: Timestamp.now(),
                packageId: event.packageId,
                fromUserId: uid,
                commissionLevel: level,
                retroLevelMigrationTag: tag,
              });
            });
          }
        }

        chainUid = chainData.originalReferrerId || null;
      }
    }
  }

  log(`\nPhase 2: ${newTierCount} new Level 2-10 commission(s), ₱${newTierTotal.toLocaleString()} total Credits to be added.`);

  log("\n=== SUMMARY ===");
  log(`Phase 0 (relabel): ${relabelCount} transactions relabeled to the 11-20 range.`);
  log(`Phase 1 (clawback): ${clawbackCount} corrections, ₱${clawbackTotal.toLocaleString()} deducted.`);
  log(`Phase 2 (new 2-10 tier): ${newTierCount} commissions, ₱${newTierTotal.toLocaleString()} added.`);
  log(`Net effect on total Credits in the system: ₱${(newTierTotal - clawbackTotal).toLocaleString()}`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
