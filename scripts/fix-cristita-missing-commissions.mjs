/**
 * fix-cristita-missing-commissions.mjs
 * ---------------------------------------------------------------------------
 * Cristita's account is marked isActivated=true (Package 1) but never
 * actually triggered commission distribution — no Level 1 cash, no
 * Level 2-11 referral chain Credits, no Level 12-20 team matrix Credits.
 * This script fixes her originalReferrerId/activePackage/activatedAt
 * fields, then properly runs the SAME 3-step commission distribution that
 * should have happened originally.
 *
 * USAGE:
 *   node fix-cristita-missing-commissions.mjs            (dry run)
 *   node fix-cristita-missing-commissions.mjs --apply     (writes)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const CRISTITA_EMAIL = "cristyalumno@gmail.com";
const PACKAGE_ID = "package_1";

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

async function payCommission(userId, level, amount, isCredits, titleSuffix, fromUserId, tag) {
  log(`  [PAY] Level ${level}${titleSuffix} → ₱${amount} ${isCredits ? "Credits" : "Cash"} to uid ${userId}`);
  if (!APPLY) return;

  const existing = await db.collection("transactions").where("retroLevelMigrationTag", "==", tag).limit(1).get();
  if (!existing.empty) {
    log(`    (already applied, skipping)`);
    return;
  }

  await db.runTransaction(async (t) => {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) return;
    const data = userDoc.data();

    if (isCredits) {
      t.update(userRef, {
        creditsBalance: (data.creditsBalance || 0) + amount,
        "stats.totalEarnings": (data.stats?.totalEarnings || 0) + amount,
      });
    } else {
      t.update(userRef, {
        balance: (data.balance || 0) + amount,
        earningsWallet: (data.earningsWallet || 0) + amount,
        "stats.totalEarnings": (data.stats?.totalEarnings || 0) + amount,
      });
    }

    t.set(db.collection("transactions").doc(), {
      userId,
      type: "in",
      title: "Level " + level + titleSuffix + " (Manual Fix)",
      amount,
      isCredits,
      category: "Commission",
      status: "Completed",
      referenceNo: "EJ-FIX-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      paymentMethod: "MLM Commission",
      timestamp: Timestamp.now(),
      packageId: PACKAGE_ID,
      fromUserId,
      commissionLevel: level,
      retroLevelMigrationTag: tag,
    });
  });
}

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  const usersById = new Map();
  usersSnap.forEach((d) => usersById.set(d.id, d.data()));

  const cristitaEntry = [...usersById.entries()].find(([, u]) => u.email === CRISTITA_EMAIL);
  if (!cristitaEntry) { log("⚠️  Cristita not found."); return; }
  const [cristitaId, cristita] = cristitaEntry;

  log(`Cristita: uid ${cristitaId}`);

  // Resolve her true referrer via her referredBy code (same as the app does).
  let referrerId = cristita.originalReferrerId || null;
  if (!referrerId && cristita.referredBy) {
    const referrer = [...usersById.entries()].find(([, u]) => u.referralCode === cristita.referredBy);
    if (referrer) referrerId = referrer[0];
  }
  if (!referrerId) { log("⚠️  Could not resolve her referrer. Aborting."); return; }
  log(`Resolved referrer: "${usersById.get(referrerId)?.displayName}" (uid ${referrerId})`);

  // Fix her profile fields (originalReferrerId, activePackage, activatedAt).
  log(`\n[FIX PROFILE] Setting originalReferrerId, activePackage="${PACKAGE_ID}", proper activatedAt`);
  if (APPLY) {
    await db.collection("users").doc(cristitaId).update({
      originalReferrerId: referrerId,
      activePackage: PACKAGE_ID,
      activatedAt: new Date().toISOString(),
      hasPackage1: true,
    });
  }

  // STEP 1: Level 1 cash to her true referrer.
  await payCommission(referrerId, 1, getCommission(1, PACKAGE_ID), false, " Commission - Subscription", cristitaId, `fix-cristita-L1`);

  // STEP 2: Levels 2-11, referral chain.
  let chainUid = referrerId;
  for (let level = 2; level <= 11; level++) {
    const chainData = usersById.get(chainUid);
    if (!chainData) break;
    await payCommission(chainUid, level, getCommission(level, PACKAGE_ID), true, " Referral Commission", cristitaId, `fix-cristita-L${level}`);
    chainUid = chainData.originalReferrerId || null;
    if (!chainUid) break;
  }

  // STEP 2B: Levels 12-20, referral chain bonus (continues where Step 2 left off).
  for (let level = 12; level <= 20; level++) {
    if (!chainUid) break;
    const chainData = usersById.get(chainUid);
    if (!chainData) break;
    await payCommission(chainUid, level, getCommission(level, PACKAGE_ID), true, " Referral Chain Bonus", cristitaId, `fix-cristita-L${level}-bonus`);
    chainUid = chainData.originalReferrerId || null;
  }

  // Proper BFS auto-placement into the matrix (rooted at JPOWER03).
  // Cristita's sponsorId is currently stuck at EJCASHH11 (her naive
  // registration-time value) because her activation never actually ran
  // autoPlaceUser. EJCASHH11 is deliberately excluded from the matrix, so
  // leaving her there would mean no one above him ever gets Team Matrix
  // credit. Find her a genuine open slot instead.
  const JPOWER_CODE = "JPOWER03";
  const jpower = [...usersById.entries()].find(([, u]) => u.referralCode === JPOWER_CODE);
  if (!jpower) { log("⚠️  JPOWER03 not found — cannot auto-place her into the matrix."); return; }
  const [jpowerId] = jpower;

  const childrenOf = new Map();
  for (const [uid, u] of usersById.entries()) {
    if (u.sponsorId) {
      if (!childrenOf.has(u.sponsorId)) childrenOf.set(u.sponsorId, []);
      childrenOf.get(u.sponsorId).push(uid);
    }
  }
  function findAvailableSlot(rootId) {
    const queue = [rootId];
    const visited = new Set();
    while (queue.length > 0) {
      const uid = queue.shift();
      if (visited.has(uid)) continue;
      visited.add(uid);
      const kids = childrenOf.get(uid) || [];
      if (kids.length < 10) return uid;
      queue.push(...kids);
    }
    return null;
  }
  const properSlot = findAvailableSlot(jpowerId);
  if (properSlot) {
    log(`\n[AUTO-PLACE] Moving her matrix placement: "EJCASHH11" (excluded from matrix) → "${usersById.get(properSlot)?.displayName || properSlot}" (genuine open slot)`);
    if (APPLY) {
      await db.collection("users").doc(cristitaId).update({ sponsorId: properSlot });
    }
  } else {
    log("\n⚠️  No open slot found in the matrix — leaving her placement as-is.");
  }

  // STEP 3: Levels 12-20, team matrix (sponsorId-based) — using her
  // CORRECTED placement, so everyone genuinely above her gets credit.
  let matrixUid = properSlot || cristita.sponsorId || null;
  for (let level = 12; level <= 20; level++) {
    if (!matrixUid) break;
    const matrixData = usersById.get(matrixUid);
    if (!matrixData) break;
    await payCommission(matrixUid, level, getCommission(level, PACKAGE_ID), true, " Indirect Commission", cristitaId, `fix-cristita-L${level}-matrix`);
    matrixUid = matrixData.sponsorId || null;
  }

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
