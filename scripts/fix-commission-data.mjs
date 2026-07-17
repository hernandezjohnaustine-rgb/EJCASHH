/**
 * fix-commission-data.mjs
 * ---------------------------------------------------------------------------
 * One-time audit + correction script for two known historical bugs:
 *
 *   BUG A — L1 misattribution: On a Package 2 upgrade for an already-active
 *   account, the app could recompute "who is the real referrer" using a
 *   fallback that had already been corrupted by auto-placement, crediting
 *   L1 cash commission to the wrong person.
 *
 *   BUG B — Stats double-counting: directReferrals / teamSize / totalReferrals
 *   were incremented on EVERY package purchase, not just the first — so a
 *   user who bought Package 1 then upgraded to Package 2 was counted as two
 *   separate referrals in their upline's network stats.
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Rebuilds the correct L1 referrer for every user from `referredBy` +
 *      `referralCode` (ground truth, unaffected by either bug).
 *   2. Compares that to who actually received each Level-1 commission
 *      transaction, and reverses/reassigns the cash (balance + earningsWallet)
 *      for any mismatch found.
 *   3. Recomputes directReferrals / teamSize / totalReferrals for every user
 *      from scratch (deduplicated — once per person, not once per package),
 *      using each user's CURRENT sponsorId for the placement (L2-10) chain.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *   - It does NOT attempt to reconstruct or correct past L2-10 (indirect)
 *     commission payouts. Those depended on the unilevel tree's placement
 *     state at the exact moment each activation happened, and sponsorId may
 *     have been overwritten more than once with no historical log. There is
 *     no reliable ground truth to correct against, so this script leaves
 *     those transactions untouched rather than guessing. Recomputed stats
 *     (step 3) use the CURRENT sponsorId as the best available approximation
 *     of tree structure — this is a best-effort snapshot, not a guaranteed
 *     historical reconstruction.
 *
 * USAGE:
 *   1. Put your Firebase service account JSON key next to this script,
 *      named `serviceAccountKey.json` (Firebase Console > Project Settings
 *      > Service Accounts > Generate new private key). Never commit this
 *      file to git.
 *   2. npm install firebase-admin
 *   3. DRY RUN (default, makes no changes):
 *        node fix-commission-data.mjs
 *   4. Review the printed report carefully.
 *   5. APPLY the corrections for real:
 *        node fix-commission-data.mjs --apply
 *
 * SAFETY:
 *   - Back up your Firestore data (export) before running with --apply.
 *   - This script is idempotent for step 2 as long as it also marks each
 *     corrected transaction with `correctionApplied: true` and skips any
 *     transaction that already has that flag, so re-running --apply won't
 *     double-correct the same transaction.
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) {
  console.log(...args);
}

async function main() {
  log(APPLY ? "\n=== RUNNING IN APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  // ---------------------------------------------------------------------
  // Load all users + build referralCode -> uid lookup (ground truth)
  // ---------------------------------------------------------------------
  const usersSnap = await db.collection("users").get();
  const usersById = new Map();
  const uidByReferralCode = new Map();

  usersSnap.forEach((docSnap) => {
    const data = docSnap.data();
    usersById.set(docSnap.id, data);
    if (data.referralCode) {
      uidByReferralCode.set(data.referralCode, docSnap.id);
    }
  });

  log(`Loaded ${usersById.size} users.`);

  // Ground-truth correct referrer per user, derived from referredBy (stable,
  // set once at signup, never touched by the placement bug).
  const correctReferrerOf = new Map(); // uid -> referrerUid | null
  for (const [uid, data] of usersById.entries()) {
    if (data.referredBy && uidByReferralCode.has(data.referredBy)) {
      correctReferrerOf.set(uid, uidByReferralCode.get(data.referredBy));
    } else {
      correctReferrerOf.set(uid, null);
    }
  }

  // ---------------------------------------------------------------------
  // PART A: Audit + correct L1 commission misattribution
  // ---------------------------------------------------------------------
  log("\n--- PART A: Auditing Level 1 commission transactions ---\n");

  const l1TxSnap = await db
    .collection("transactions")
    .where("category", "==", "Commission")
    .where("commissionLevel", "==", 1)
    .get();

  let mismatchCount = 0;
  let alreadyCorrected = 0;
  const corrections = []; // { txId, fromUserId, wrongRecipient, correctRecipient, amount }

  l1TxSnap.forEach((txSnap) => {
    const tx = txSnap.data();
    if (tx.correctionApplied) {
      alreadyCorrected++;
      return;
    }
    const fromUserId = tx.fromUserId;
    const creditedTo = tx.userId;
    if (!fromUserId || !creditedTo) return;

    const correctRecipient = correctReferrerOf.get(fromUserId);
    if (!correctRecipient) return; // no resolvable referrer — nothing to compare against

    if (correctRecipient !== creditedTo) {
      mismatchCount++;
      corrections.push({
        txId: txSnap.id,
        fromUserId,
        wrongRecipient: creditedTo,
        correctRecipient,
        amount: tx.amount || 0,
      });
    }
  });

  log(`Checked ${l1TxSnap.size} L1 transactions (${alreadyCorrected} already corrected in a prior run).`);
  log(`Found ${mismatchCount} misattributed L1 commission(s).\n`);

  for (const c of corrections) {
    const fromName = usersById.get(c.fromUserId)?.displayName || c.fromUserId;
    const wrongName = usersById.get(c.wrongRecipient)?.displayName || c.wrongRecipient;
    const correctName = usersById.get(c.correctRecipient)?.displayName || c.correctRecipient;
    log(
      `  [MISMATCH] From "${fromName}" activation — credited "${wrongName}" ` +
      `(should be "${correctName}") — ₱${c.amount.toLocaleString()} — tx ${c.txId}`
    );
  }

  if (APPLY && corrections.length > 0) {
    log("\nApplying L1 corrections...");
    for (const c of corrections) {
      await db.runTransaction(async (t) => {
        const wrongRef = db.collection("users").doc(c.wrongRecipient);
        const correctRef = db.collection("users").doc(c.correctRecipient);
        const txRef = db.collection("transactions").doc(c.txId);

        const wrongDoc = await t.get(wrongRef);
        const correctDoc = await t.get(correctRef);
        if (!wrongDoc.exists || !correctDoc.exists) return;

        const wrongData = wrongDoc.data();
        const correctData = correctDoc.data();

        // Reverse from the wrong recipient
        t.update(wrongRef, {
          balance: Math.max(0, (wrongData.balance || 0) - c.amount),
          earningsWallet: Math.max(0, (wrongData.earningsWallet || 0) - c.amount),
        });

        // Credit the correct recipient
        t.update(correctRef, {
          balance: (correctData.balance || 0) + c.amount,
          earningsWallet: (correctData.earningsWallet || 0) + c.amount,
        });

        // Mark original transaction as corrected (idempotency guard)
        t.update(txRef, { correctionApplied: true, correctedAt: FieldValue.serverTimestamp() });

        // Audit trail: a paired correction transaction on each side
        const refNo = "EJ-CORR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        t.set(db.collection("transactions").doc(), {
          userId: c.wrongRecipient,
          type: "out",
          title: "Correction: Level 1 Commission Reassigned",
          amount: c.amount,
          isCredits: false,
          category: "Correction",
          status: "Completed",
          referenceNo: refNo,
          paymentMethod: "System Correction",
          timestamp: FieldValue.serverTimestamp(),
          relatedTxId: c.txId,
        });
        t.set(db.collection("transactions").doc(), {
          userId: c.correctRecipient,
          type: "in",
          title: "Correction: Level 1 Commission Reassigned",
          amount: c.amount,
          isCredits: false,
          category: "Correction",
          status: "Completed",
          referenceNo: refNo,
          paymentMethod: "System Correction",
          timestamp: FieldValue.serverTimestamp(),
          relatedTxId: c.txId,
        });
      });
    }
    log(`Applied ${corrections.length} correction(s).`);
  } else if (corrections.length > 0) {
    log("\n(Dry run — no changes written. Re-run with --apply to correct these.)");
  }

  // ---------------------------------------------------------------------
  // PART B: Recompute directReferrals / teamSize / totalReferrals
  // ---------------------------------------------------------------------
  log("\n--- PART B: Recomputing network stats (deduplicated) ---\n");

  const directReferrals = new Map(); // uid -> count
  const teamSize = new Map(); // uid -> count
  const totalReferrals = new Map(); // uid -> count
  const bump = (map, uid) => map.set(uid, (map.get(uid) || 0) + 1);

  const activatedUsers = [...usersById.entries()].filter(([, d]) => d.isActivated);
  log(`Simulating placement/referral chains for ${activatedUsers.length} activated users...`);

  for (const [uid, data] of activatedUsers) {
    // L1 step: credit the true referrer once.
    const referrerId = correctReferrerOf.get(uid);
    if (referrerId) {
      bump(directReferrals, referrerId);
      bump(teamSize, referrerId);
      bump(totalReferrals, referrerId);
    }

    // L2-10 step: walk the CURRENT placement chain (sponsorId), mirroring
    // processActivation's traversal, skipping straight to upline if
    // placement sponsor === direct referrer (same rule the app uses).
    let currentUid = data.sponsorId || null;
    if (currentUid === referrerId) {
      const placementDoc = usersById.get(currentUid);
      currentUid = placementDoc?.sponsorId || placementDoc?.referredBy || null;
    }
    const visited = new Set();
    for (let level = 2; level <= 10 && currentUid; level++) {
      if (visited.has(currentUid)) break; // guard against any accidental cycle
      visited.add(currentUid);
      const sponsorData = usersById.get(currentUid);
      if (!sponsorData) break;
      bump(teamSize, currentUid);
      bump(totalReferrals, currentUid);
      currentUid = sponsorData.sponsorId || sponsorData.referredBy || null;
    }
  }

  let statsChanged = 0;
  for (const [uid, data] of usersById.entries()) {
    const newDirect = directReferrals.get(uid) || 0;
    const newTeam = teamSize.get(uid) || 0;
    const newTotal = totalReferrals.get(uid) || 0;
    const oldDirect = data.stats?.directReferrals || 0;
    const oldTeam = data.stats?.teamSize || 0;
    const oldTotal = data.stats?.totalReferrals || 0;

    if (newDirect !== oldDirect || newTeam !== oldTeam || newTotal !== oldTotal) {
      statsChanged++;
      const name = data.displayName || uid;
      log(
        `  [STATS] ${name}: directReferrals ${oldDirect}→${newDirect}, ` +
        `teamSize ${oldTeam}→${newTeam}, totalReferrals ${oldTotal}→${newTotal}`
      );
      if (APPLY) {
        await db.collection("users").doc(uid).update({
          "stats.directReferrals": newDirect,
          "stats.teamSize": newTeam,
          "stats.totalReferrals": newTotal,
        });
      }
    }
  }

  log(`\n${statsChanged} user(s) had incorrect stats${APPLY ? " — corrected." : " (dry run, not written)."}`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review the output above, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
