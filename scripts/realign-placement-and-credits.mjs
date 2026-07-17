/**
 * realign-placement-and-credits.mjs
 * ---------------------------------------------------------------------------
 * Rebuilds the ENTIRE global matrix placement and recomputes ALL Credits
 * (Level 2-10) balances from scratch, based on the new rules:
 *
 *   1. ONE global matrix, rooted at the master account (by email below).
 *      Every activated user is placed via breadth-first search — Level 1
 *      (10 slots) fills completely before Level 2 (100 slots) starts, etc.
 *   2. Level 1 (cash) is UNCHANGED by this script — it already goes to the
 *      true direct referrer and isn't affected by placement. This script
 *      does NOT touch `balance` or `earningsWallet`.
 *   3. Level 2-10 (Credits) requires the recipient to have already reached
 *      that level's team-size threshold (10, 100, 1,000 ... 10B). If the
 *      person at that position isn't qualified, the Credits roll up to the
 *      next qualified person further up the SAME chain.
 *
 * HOW IT WORKS:
 *   - Reconstructs every activation event (chronological order) from the
 *     existing "Level 1 Commission..." transactions (category=Commission,
 *     commissionLevel=1), since each one records {fromUserId, packageId,
 *     timestamp}. The first event per user = their first activation.
 *   - Replays every event in order through an IN-MEMORY simulation of the
 *     new placement + commission rules, building up: sponsorId, teamSize,
 *     totalReferrals, directReferrals, and creditsBalance per user.
 *   - Compares the final simulated state against what's currently stored
 *     in Firestore, and reports every difference.
 *   - Only writes changes (and only creditsBalance/team-size/sponsorId
 *     fields — never balance/earningsWallet) when run with --apply.
 *
 * WHAT THIS SCRIPT DOES NOT TOUCH:
 *   - balance, earningsWallet (Level 1 cash) — already correct, untouched.
 *   - Certificate Reward claims already made (milestoneRewardClaimed_L*) —
 *     left as-is. If a user's recomputed creditsBalance ends up lower than
 *     what they've already spent on claimed certificates, this script will
 *     still set creditsBalance to the mathematically correct (possibly
 *     negative-looking) recomputed value — REVIEW THE REPORT CAREFULLY for
 *     any such cases before applying, since that likely needs a manual
 *     business decision, not an automatic fix.
 *
 * USAGE (same pattern as fix-commission-data.mjs):
 *   node realign-placement-and-credits.mjs            (dry run, default)
 *   node realign-placement-and-credits.mjs --apply     (writes for real)
 *
 * ALWAYS run a fresh backup (backup-firestore.mjs) immediately before
 * using --apply. This is the highest-risk migration in this project —
 * read the full dry-run report before proceeding.
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const MASTER_EMAIL = "austinejohnter17@gmail.com";

// Same team-size thresholds as screens/DirectsCertificate.tsx MILESTONES.
// Kept in sync manually here since this script runs outside the app bundle.
const LEVEL_TEAM_SIZE_REQUIREMENT = {
  1: 10, 2: 100, 3: 1000, 4: 10000, 5: 100000,
  6: 1000000, 7: 10000000, 8: 100000000, 9: 1000000000, 10: 10000000000,
};

function getCommission(level, packageId) {
  if (packageId === "package_1") return level === 1 ? 100 : 3;
  if (packageId === "package_2") return level === 1 ? 1000 : 30;
  if (packageId === "combined") {
    const p1 = level === 1 ? 100 : 3;
    const p2 = level === 1 ? 1000 : 30;
    return p1 + p2;
  }
  return 0;
}

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  // ---------------------------------------------------------------------
  // Load users + find master
  // ---------------------------------------------------------------------
  const usersSnap = await db.collection("users").get();
  const usersById = new Map();
  usersSnap.forEach((d) => usersById.set(d.id, d.data()));
  log(`Loaded ${usersById.size} users.`);

  let masterUid = null;
  for (const [uid, data] of usersById.entries()) {
    if (data.email === MASTER_EMAIL) { masterUid = uid; break; }
  }
  if (!masterUid) {
    console.error(`FATAL: master account (${MASTER_EMAIL}) not found. Aborting.`);
    process.exit(1);
  }
  log(`Master account resolved: ${masterUid} (${MASTER_EMAIL})`);

  // ---------------------------------------------------------------------
  // Reconstruct activation events. Transaction logs ALONE are not a
  // complete source — some accounts were manually activated via the Admin
  // Panel's "Activate" button, which sets isActivated:true directly and
  // creates NO transaction record at all (no Activation tx, no Commission
  // tx). Relying only on transactions silently drops those accounts.
  //
  // Ground truth instead: every truly activated user has isActivated,
  // activatedAt, and activePackage on their own doc, regardless of how
  // they got activated. We use that as a guaranteed-complete base event
  // per user, then OVERRIDE it with real Activation transactions where
  // they exist — those capture the full upgrade sequence (e.g. package_1
  // then later package_2) that a single "current state" snapshot can't.
  // ---------------------------------------------------------------------
  function inferPackageId(amount) {
    if (amount === 360) return "package_1";
    if (amount === 3600) return "package_2";
    if (amount === 3960) return "combined";
    return null;
  }

  const activationTxSnap = await db.collection("transactions").where("category", "==", "Activation").get();
  const txEventsByUser = new Map();
  let skippedUnknownAmount = 0;
  activationTxSnap.forEach((txSnap) => {
    const tx = txSnap.data();
    if (!tx.userId) return;
    const packageId = inferPackageId(tx.amount);
    if (!packageId) { skippedUnknownAmount++; return; }
    const ts = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp);
    if (!txEventsByUser.has(tx.userId)) txEventsByUser.set(tx.userId, []);
    txEventsByUser.get(tx.userId).push({ userId: tx.userId, packageId, timestamp: ts });
  });

  let noTransactionTrailCount = 0;
  const events = [];
  for (const [uid, data] of usersById.entries()) {
    if (uid === masterUid) continue; // the master account is the ROOT — never placed under anyone, including itself
    if (!data.isActivated) continue;
    const real = txEventsByUser.get(uid);
    if (real && real.length > 0) {
      events.push(...real);
    } else {
      // No transaction trail at all (e.g. manually activated by admin) —
      // fall back to their current recorded state as a single event.
      noTransactionTrailCount++;
      events.push({
        userId: uid,
        packageId: data.activePackage || "package_1",
        timestamp: data.activatedAt ? new Date(data.activatedAt) : new Date(0),
      });
    }
  }
  events.sort((a, b) => a.timestamp - b.timestamp);
  log(`Reconstructed ${events.length} activation events (${noTransactionTrailCount} user(s) had no transaction trail — likely manually activated — and were included using their current activation state instead).`);
  if (skippedUnknownAmount > 0) {
    log(`WARNING: ${skippedUnknownAmount} Activation transaction(s) had an amount that didn't match any known package (360/3600/3960) and were skipped. Investigate these manually.`);
  }

  const seenActivation = new Set();

  // ---------------------------------------------------------------------
  // In-memory simulation state
  // ---------------------------------------------------------------------
  const sponsorId = new Map();     // userId -> placement sponsor (global matrix)
  const children = new Map();      // userId -> [childUserId, ...] (placement children)
  const teamSize = new Map();      // userId -> count
  const totalReferrals = new Map();// userId -> count
  const directReferrals = new Map();// userId -> count
  const creditsBalance = new Map();// userId -> amount
  const bump = (map, id, n = 1) => map.set(id, (map.get(id) || 0) + n);
  children.set(masterUid, []);

  function findAvailableSlot() {
    const queue = [masterUid];
    const visited = new Set();
    while (queue.length > 0) {
      const uid = queue.shift();
      if (visited.has(uid)) continue;
      visited.add(uid);
      const kids = children.get(uid) || [];
      if (kids.length < 10) return uid;
      for (const k of kids) queue.push(k);
    }
    return null;
  }

  function placeUser(userId) {
    const slot = findAvailableSlot();
    if (!slot) { console.error(`No available slot for ${userId} — matrix full?!`); return null; }
    sponsorId.set(userId, slot);
    if (!children.has(slot)) children.set(slot, []);
    children.get(slot).push(userId);
    if (!children.has(userId)) children.set(userId, []);
    return slot;
  }

  function getChainUpward(startId) {
    const chain = [];
    let walker = startId;
    const seen = new Set();
    while (walker && chain.length < 30) {
      if (seen.has(walker)) break;
      seen.add(walker);
      chain.push(walker);
      walker = sponsorId.get(walker) || null;
    }
    return chain;
  }

  // ---------------------------------------------------------------------
  // Replay every event in chronological order
  // ---------------------------------------------------------------------
  for (const ev of events) {
    const { userId, packageId } = ev;
    const isFirstActivation = !seenActivation.has(userId);
    seenActivation.add(userId);

    const userData = usersById.get(userId);
    const referrerId = userData?.referredBy
      ? [...usersById.entries()].find(([, d]) => d.referralCode === userData.referredBy)?.[0]
      : userData?.sponsorId || null;

    if (isFirstActivation) {
      if (referrerId) bump(directReferrals, referrerId);
      placeUser(userId);
    }

    const placement = sponsorId.get(userId);
    if (!placement) continue;

    const chain = getChainUpward(placement);

    if (isFirstActivation) {
      for (let i = 0; i < Math.min(chain.length, 9); i++) {
        bump(teamSize, chain[i]);
        bump(totalReferrals, chain[i]);
      }
    }

    for (let level = 2; level <= 10; level++) {
      const commission = getCommission(level, packageId);
      const required = LEVEL_TEAM_SIZE_REQUIREMENT[level] ?? Infinity;
      let recipient = null;
      for (let idx = level - 1; idx < chain.length; idx++) {
        if ((teamSize.get(chain[idx]) || 0) >= required) { recipient = chain[idx]; break; }
      }
      if (recipient) bump(creditsBalance, recipient, commission);
    }
  }

  log(`Simulation complete. ${seenActivation.size} unique users activated at least once.`);

  // ---------------------------------------------------------------------
  // Compare simulated state vs current Firestore state, report + apply
  // ---------------------------------------------------------------------
  let changedCount = 0;
  const allTouchedIds = new Set([
    ...sponsorId.keys(), ...teamSize.keys(), ...totalReferrals.keys(),
    ...directReferrals.keys(), ...creditsBalance.keys(),
  ]);

  for (const uid of allTouchedIds) {
    const current = usersById.get(uid);
    if (!current) continue;
    const name = current.displayName || uid;

    const newSponsor = sponsorId.get(uid) ?? current.sponsorId ?? null;
    const newTeamSize = teamSize.get(uid) || 0;
    const newTotalReferrals = totalReferrals.get(uid) || 0;
    const newDirectReferrals = directReferrals.get(uid) || 0;
    const newCredits = creditsBalance.get(uid) || 0;

    const oldSponsor = current.sponsorId || null;
    const oldTeamSize = current.stats?.teamSize || 0;
    const oldTotalReferrals = current.stats?.totalReferrals || 0;
    const oldDirectReferrals = current.stats?.directReferrals || 0;
    const oldCredits = current.creditsBalance || 0;

    const diffs = [];
    if (newSponsor !== oldSponsor) diffs.push(`sponsorId: ${oldSponsor} -> ${newSponsor}`);
    if (newTeamSize !== oldTeamSize) diffs.push(`teamSize: ${oldTeamSize} -> ${newTeamSize}`);
    if (newTotalReferrals !== oldTotalReferrals) diffs.push(`totalReferrals: ${oldTotalReferrals} -> ${newTotalReferrals}`);
    if (newDirectReferrals !== oldDirectReferrals) diffs.push(`directReferrals: ${oldDirectReferrals} -> ${newDirectReferrals}`);
    if (newCredits !== oldCredits) diffs.push(`creditsBalance: ${oldCredits} -> ${newCredits}`);

    if (diffs.length === 0) continue;
    changedCount++;
    log(`  [DIFF] ${name} (${uid}): ${diffs.join(" | ")}`);

    if (APPLY) {
      await db.collection("users").doc(uid).update({
        sponsorId: newSponsor,
        creditsBalance: newCredits,
        "stats.teamSize": newTeamSize,
        "stats.totalReferrals": newTotalReferrals,
        "stats.directReferrals": newDirectReferrals,
      });
      if (newCredits !== oldCredits) {
        await db.collection("transactions").add({
          userId: uid,
          type: newCredits > oldCredits ? "in" : "out",
          title: "Correction: Matrix realignment recompute",
          amount: Math.abs(newCredits - oldCredits),
          isCredits: true,
          category: "Correction",
          status: "Completed",
          referenceNo: "EJ-REALIGN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          paymentMethod: "System Correction",
          timestamp: FieldValue.serverTimestamp(),
        });
      }
    }
  }

  log(`\n${changedCount} user(s) had differences${APPLY ? " — corrected." : " (dry run, not written)."}`);
  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Realignment script failed:", err);
  process.exit(1);
});
