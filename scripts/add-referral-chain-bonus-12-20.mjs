/**
 * add-referral-chain-bonus-12-20.mjs
 * ---------------------------------------------------------------------------
 * Retroactively pays "Referral Chain Bonus" Credits for Levels 12-20 —
 * continuing the SAME originalReferrerId walk used for Levels 2-11, all
 * the way to Level 20. This runs independently of the Team Matrix
 * (sponsorId-based) Level 12-20 payouts — it exists specifically so
 * accounts deliberately excluded from the Team Matrix (like the
 * EJCASHH01-11 backbone) can still earn at these levels via the referral
 * chain instead.
 *
 * Titled "Level X Referral Chain Bonus" (never "Indirect Commission") so
 * these transactions are never confused with real Team Matrix payouts.
 * Idempotent — tagged to prevent double-payment on re-runs.
 *
 * USAGE:
 *   node add-referral-chain-bonus-12-20.mjs            (dry run)
 *   node add-referral-chain-bonus-12-20.mjs --apply     (writes)
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

function getCommission(level, packageId) {
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

  const activationTxSnap = await db.collection("transactions")
    .where("category", "==", "Activation")
    .get();

  const eventsByUser = new Map();
  activationTxSnap.forEach((d) => {
    const tx = d.data();
    if (!eventsByUser.has(tx.userId)) eventsByUser.set(tx.userId, []);
    eventsByUser.get(tx.userId).push({ packageId: tx.packageId || "package_1", sourceId: d.id });
  });
  for (const [uid, data] of usersById.entries()) {
    if (data.isActivated && !eventsByUser.has(uid)) {
      eventsByUser.set(uid, [{ packageId: data.activePackage || "package_1", sourceId: "manual-" + uid }]);
    }
  }

  let totalEvents = 0;
  eventsByUser.forEach((list) => (totalEvents += list.length));
  log(`Found ${totalEvents} activation event(s) across ${eventsByUser.size} user(s).\n`);

  let paidCount = 0;
  let paidTotal = 0;

  for (const [uid, events] of eventsByUser.entries()) {
    const userData = usersById.get(uid);
    if (!userData) continue;
    const referrerId = userData.originalReferrerId || null;
    if (!referrerId) continue;

    for (const event of events) {
      // Walk 10 hops from referrerId to reach the same endpoint Level 11
      // ends at (referrerId itself = Level 2, so 10 hops = Level 11),
      // THEN continue 9 more hops for Levels 12-20.
      let chainUid = referrerId;
      for (let hop = 0; hop < 10; hop++) {
        const chainData = usersById.get(chainUid);
        if (!chainData) { chainUid = null; break; }
        const nextUid = chainData.originalReferrerId || null;
        if (!nextUid) { chainUid = null; break; }
        chainUid = nextUid;
      }
      if (!chainUid) continue;

      for (let level = 12; level <= 20; level++) {
        const chainData = usersById.get(chainUid);
        if (!chainData) break;

        const tag = `retro-L${level}-bonus-${uid}-${event.sourceId}`;
        const commission = getCommission(level, event.packageId);
        const recipientName = chainData.displayName || chainUid;

        log(`  [L${level}] "${recipientName}" earns ₱${commission} Referral Chain Bonus (from ${userData.displayName || uid}'s ${event.packageId} activation)`);
        paidCount++;
        paidTotal += commission;

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
                title: "Level " + level + " Referral Chain Bonus (Retroactive)",
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
                chainType: "referral",
                retroLevelMigrationTag: tag,
              });
            });
          }
        }

        const nextUid = chainData.originalReferrerId || null;
        if (!nextUid) break;
        chainUid = nextUid;
      }
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`${paidCount} Referral Chain Bonus commission(s), ₱${paidTotal.toLocaleString()} total Credits to be added.`);
  log(`No Team Matrix (sponsorId-based) transactions were touched — this is a fully separate mechanism.`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
