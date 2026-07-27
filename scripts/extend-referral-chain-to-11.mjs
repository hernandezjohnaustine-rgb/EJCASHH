/**
 * extend-referral-chain-to-11.mjs
 * ---------------------------------------------------------------------------
 * Three-phase retroactive migration for the new numbering:
 *   Level 1        = direct referral cash bonus (UNCHANGED)
 *   Levels 2-11    = REFERRAL CHAIN (originalReferrerId) — extended by 1 level
 *   Levels 12-20   = TEAM MATRIX (sponsorId) — shrunk by 1 level (was 11-20)
 *
 * PHASE 0 — Claw back the deepest matrix position (old Level 20):
 *   The matrix now only pays 9 levels deep (12-20) instead of 10 (11-20).
 *   Whoever was previously paid at the deepest position (old Level 20, the
 *   10th matrix hop) has no equivalent position in the new scheme. This
 *   phase fully claws back those Credits — deducts the full amount from
 *   the recipient's creditsBalance and voids the transaction record.
 *
 * PHASE 1 — Shift remaining matrix transactions (old 11-19 → new 12-20):
 *   Every other existing matrix transaction shifts up by exactly one
 *   level (old Level 11 → new Level 12, ..., old Level 19 → new Level 20).
 *   Pure relabeling — does not touch amounts or balances.
 *
 * PHASE 2 — Add new Level 11 (the newly extended referral chain step):
 *   For every historical activation event, walks 9 hops up the activating
 *   user's TRUE direct referrer chain (originalReferrerId) beyond their
 *   own direct referrer, crediting whoever is there with Credits at the
 *   standard flat per-level rate. Idempotent — tagged to prevent
 *   double-payment on re-runs.
 *
 * USAGE:
 *   node extend-referral-chain-to-11.mjs            (dry run)
 *   node extend-referral-chain-to-11.mjs --apply     (writes)
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

  // Snapshot ALL matrix-range Commission transactions ONCE, capturing their
  // ORIGINAL level, so Phase 0/1 never accidentally re-processes a
  // just-shifted transaction in the same run.
  const commissionTxSnap = await db.collection("transactions")
    .where("category", "==", "Commission")
    .where("isCredits", "==", true)
    .get();

  const matrixTxs = [];
  commissionTxSnap.forEach((d) => {
    const tx = d.data();
    if (tx.title && tx.title.includes("Referral Commission")) return; // never touch referral-chain's own transactions
    if (tx.commissionLevel >= 11 && tx.commissionLevel <= 20 && !tx.shiftedForLevel11Extension) {
      matrixTxs.push({ id: d.id, ...tx });
    }
  });

  // ── PHASE 0: Claw back old Level 20 (deepest matrix position) ──────────
  log("\n--- PHASE 0: Clawing back old Level 20 (matrix no longer reaches this deep) ---\n");

  const level20Txs = matrixTxs.filter((t) => t.commissionLevel === 20);
  let clawbackCount = 0;
  let clawbackTotal = 0;

  for (const tx of level20Txs) {
    const recipientName = usersById.get(tx.userId)?.displayName || tx.userId;
    log(`  [CLAWBACK] "${recipientName}" — tx ${tx.id}: ₱${tx.amount} fully voided (old Level 20 no longer exists)`);
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
          shiftedForLevel11Extension: true,
          clawedBackAt: Timestamp.now(),
        });
      });
    }
  }

  log(`\nPhase 0: ${clawbackCount} transaction(s) voided, ₱${clawbackTotal.toLocaleString()} total clawed back.`);

  // ── PHASE 1: Shift old Level 11-19 → new Level 12-20 ────────────────────
  log("\n--- PHASE 1: Shifting matrix transactions (old 11-19 → new 12-20) ---\n");

  const shiftTxs = matrixTxs.filter((t) => t.commissionLevel >= 11 && t.commissionLevel <= 19);
  let shiftCount = 0;

  for (const tx of shiftTxs) {
    const newLevel = tx.commissionLevel + 1;
    const recipientName = usersById.get(tx.userId)?.displayName || tx.userId;
    log(`  [SHIFT] "${recipientName}" — tx ${tx.id}: Level ${tx.commissionLevel} → Level ${newLevel}`);
    shiftCount++;

    if (APPLY) {
      await db.collection("transactions").doc(tx.id).update({
        commissionLevel: newLevel,
        title: "Level " + newLevel + " Indirect Commission",
        shiftedForLevel11Extension: true,
        shiftedAt: Timestamp.now(),
      });
    }
  }

  log(`\nPhase 1: ${shiftCount} transaction(s) shifted.`);

  // ── PHASE 2: New Level 11 (extended referral chain step) ───────────────
  log("\n--- PHASE 2: Adding new Level 11 (referral chain, 9 hops beyond direct referrer) ---\n");

  const activationTxSnap = await db.collection("transactions")
    .where("category", "==", "Activation")
    .get();

  const eventsByUser = new Map();
  activationTxSnap.forEach((d) => {
    const tx = d.data();
    if (!eventsByUser.has(tx.userId)) eventsByUser.set(tx.userId, []);
    eventsByUser.get(tx.userId).push({
      packageId: tx.packageId || "package_1",
      sourceId: d.id,
    });
  });
  for (const [uid, data] of usersById.entries()) {
    if (data.isActivated && !eventsByUser.has(uid)) {
      eventsByUser.set(uid, [{ packageId: data.activePackage || "package_1", sourceId: "manual-" + uid }]);
    }
  }

  let l11Count = 0;
  let l11Total = 0;

  for (const [uid, events] of eventsByUser.entries()) {
    const userData = usersById.get(uid);
    if (!userData) continue;
    const referrerId = userData.originalReferrerId || null;
    if (!referrerId) continue;

    for (const event of events) {
      // Walk 9 hops up from referrerId (Level 2 = referrerId itself, so
      // Level 11 = referrerId + 9 more hops up the chain).
      let chainUid = referrerId;
      for (let hop = 0; hop < 9; hop++) {
        const chainData = usersById.get(chainUid);
        if (!chainData) { chainUid = null; break; }
        const nextUid = chainData.originalReferrerId || null;
        if (!nextUid) { chainUid = null; break; }
        chainUid = nextUid;
      }
      if (!chainUid) continue;
      const chainData = usersById.get(chainUid);
      if (!chainData) continue;

      const tag = `retro-L11ext-${uid}-${event.sourceId}`;
      const commission = getNewCommission(11, event.packageId);
      const recipientName = chainData.displayName || chainUid;

      log(`  [L11] "${recipientName}" earns ₱${commission} Credits (from ${userData.displayName || uid}'s ${event.packageId} activation)`);
      l11Count++;
      l11Total += commission;

      if (APPLY) {
        const existing = await db.collection("transactions").where("retroLevelMigrationTag", "==", tag).limit(1).get();
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
              title: "Level 11 Referral Commission (Retroactive)",
              amount: commission,
              isCredits: true,
              category: "Commission",
              status: "Completed",
              referenceNo: "EJ-RETRO-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
              paymentMethod: "MLM Commission",
              timestamp: Timestamp.now(),
              packageId: event.packageId,
              fromUserId: uid,
              commissionLevel: 11,
              retroLevelMigrationTag: tag,
            });
          });
        }
      }
    }
  }

  log(`\nPhase 2: ${l11Count} new Level 11 commission(s), ₱${l11Total.toLocaleString()} total Credits to be added.`);

  log("\n=== SUMMARY ===");
  log(`Phase 0 (clawback old L20): ${clawbackCount} voided, ₱${clawbackTotal.toLocaleString()} deducted.`);
  log(`Phase 1 (shift 11-19 → 12-20): ${shiftCount} transactions relabeled.`);
  log(`Phase 2 (new L11): ${l11Count} commissions, ₱${l11Total.toLocaleString()} added.`);
  log(`Net effect on total Credits in the system: ₱${(l11Total - clawbackTotal).toLocaleString()}`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
