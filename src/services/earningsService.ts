import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

function getCommission(level: number, packageId: string): number {
  if (packageId === "package_1") {
    return level === 1 ? 100 : 3;
  } else if (packageId === "package_2") {
    return level === 1 ? 1000 : 10;
  } else if (packageId === "combined") {
    const p1 = level === 1 ? 100 : 3;
    const p2 = level === 1 ? 1000 : 10;
    return p1 + p2;
  }
  return 0;
}

export async function processActivation(
  userId: string,
  placementSponsorId: string | null,
  packageId: string = "package_1",
  originalReferrerId?: string | null,
  isFirstActivation: boolean = true
): Promise<void> {
  const referrerId = originalReferrerId || placementSponsorId;

  if (!referrerId) {
    console.log("No referrer - skipping commission");
    return;
  }

  console.log("Commission start - Referrer:", referrerId, "Placement:", placementSponsorId, "Package:", packageId);

  // STEP 1: Level 1 commission — ALWAYS goes to the true direct referrer,
  // in cash, with NO team-size gate. Unaffected by everything below; does
  // not depend on placement position at all.
  let l1Title: string;
  if (packageId === "package_1") {
    l1Title = "Level 1 Commission - Subscription";
  } else if (packageId === "package_2") {
    l1Title = "Level 1 Commission (10x) - Activation";
  } else {
    l1Title = "Level 1 Commission (10x) — New Activation";
  }
  try {
    const referrerDoc = await getDoc(doc(db, "users", referrerId));
    if (referrerDoc.exists()) {
      const referrerData = referrerDoc.data();
      const l1Commission = getCommission(1, packageId);

      await setDoc(doc(db, "users", referrerId), {
        balance: (referrerData.balance || 0) + l1Commission,
        earningsWallet: (referrerData.earningsWallet || 0) + l1Commission,
        stats: {
          ...referrerData.stats,
          totalEarnings: (referrerData.stats?.totalEarnings || 0) + l1Commission,
          directReferrals: (referrerData.stats?.directReferrals || 0) + (isFirstActivation ? 1 : 0),
        }
      }, { merge: true });

      await addDoc(collection(db, "transactions"), {
        userId: referrerId,
        type: "in",
        title: l1Title,
        amount: l1Commission,
        isCredits: false,
        category: "Commission",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "MLM Commission",
        timestamp: Timestamp.now(),
        packageId,
        fromUserId: userId,
        commissionLevel: 1,
      });

      console.log("L1 commission credited (cash) to referrer:", referrerId, "amount:", l1Commission);

      await addDoc(collection(db, "users", referrerId, "notifications"), {
        title: "Direct Referral Commission",
        message: "You earned \u20B1" + l1Commission.toLocaleString() + " from a new direct referral!",
        type: "commission",
        read: false,
        createdAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("L1 commission error:", error);
  }

  // STEP 2: Levels 2-10 — the REFERRAL CHAIN tier. Walks up each person's
  // TRUE direct referrer (originalReferrerId) one link at a time: your
  // referrer, their referrer, their referrer's referrer, and so on, nine
  // levels deep. Only ONE direct connection needed to link each level —
  // unlike the placement matrix below, this doesn't require 10 people to
  // fill a level before the next unlocks. Paid in Credits (same shared
  // creditsBalance that Certificate Rewards already draws from).
  // Level 2 here starts at the SAME person who received the Level 1 cash
  // commission above — they now additionally receive Level 2 Credits too.
  let chainUid: string | null = referrerId;

  for (let level = 2; level <= 11; level++) {
    if (!chainUid) break;
    try {
      const chainDoc = await getDoc(doc(db, "users", chainUid));
      if (!chainDoc.exists()) break;

      const chainData = chainDoc.data();
      const commission = getCommission(level, packageId);

      await setDoc(doc(db, "users", chainUid), {
        creditsBalance: (chainData.creditsBalance || 0) + commission,
        stats: {
          ...chainData.stats,
          totalEarnings: (chainData.stats?.totalEarnings || 0) + commission,
          // Intentionally NOT incrementing teamSize/totalReferrals here —
          // this same activation already counts toward those stats via
          // Step 3's placement walk below. Counting again here would
          // silently inflate team size and could break Certificate Reward
          // gating (which checks teamSize thresholds).
        }
      }, { merge: true });

      await addDoc(collection(db, "transactions"), {
        userId: chainUid,
        type: "in",
        title: "Level " + level + " Referral Commission",
        amount: commission,
        isCredits: true,
        category: "Commission",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "MLM Commission",
        timestamp: Timestamp.now(),
        packageId,
        fromUserId: userId,
        commissionLevel: level,
      });

      console.log("L" + level + " referral-chain commission credited (Credits) to:", chainUid, "amount:", commission);

      await addDoc(collection(db, "users", chainUid, "notifications"), {
        title: "Level " + level + " Referral Commission",
        message: commission.toLocaleString() + " Credits added to your Credits balance (Level " + level + ")",
        type: "credits",
        read: false,
        createdAt: Timestamp.now(),
      });

      const nextUid = chainData.originalReferrerId || null;
      if (!nextUid) break;
      chainUid = nextUid;

    } catch (error) {
      console.error("L" + level + " referral-chain commission error:", error);
    }
  }

  // STEP 2B: Levels 12-20 — REFERRAL CHAIN BONUS. Continues the EXACT SAME
  // originalReferrerId walk from where Step 2 left off, all the way to
  // Level 20. This runs independently of — and in ADDITION to — Step 3's
  // Team Matrix below. It exists specifically so people who are
  // deliberately excluded from the Team Matrix (like the dedicated
  // EJCASHH01-11 referral-chain backbone, which only ever has ONE direct
  // connection each and never gets auto-placed) can still earn at these
  // levels, without affecting the separate, sponsorId-based Team Matrix
  // payouts in Step 3. Titled "Referral Chain Bonus" (not "Indirect
  // Commission") specifically so these transactions are never confused
  // with real Team Matrix Level 12-20 payouts in reports or exports.
  for (let level = 12; level <= 20; level++) {
    if (!chainUid) break;
    try {
      const chainDoc = await getDoc(doc(db, "users", chainUid));
      if (!chainDoc.exists()) break;

      const chainData = chainDoc.data();
      const commission = getCommission(level, packageId);

      await setDoc(doc(db, "users", chainUid), {
        creditsBalance: (chainData.creditsBalance || 0) + commission,
        stats: {
          ...chainData.stats,
          totalEarnings: (chainData.stats?.totalEarnings || 0) + commission,
          // Intentionally NOT incrementing teamSize/totalReferrals here,
          // same reasoning as Step 2 above.
        }
      }, { merge: true });

      await addDoc(collection(db, "transactions"), {
        userId: chainUid,
        type: "in",
        title: "Level " + level + " Referral Chain Bonus",
        amount: commission,
        isCredits: true,
        category: "Commission",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "MLM Commission",
        timestamp: Timestamp.now(),
        packageId,
        fromUserId: userId,
        commissionLevel: level,
        chainType: "referral", // distinguishes from Step 3's Team Matrix payouts at the same level numbers
      });

      console.log("L" + level + " referral-chain BONUS credited (Credits) to:", chainUid, "amount:", commission);

      await addDoc(collection(db, "users", chainUid, "notifications"), {
        title: "Level " + level + " Referral Chain Bonus",
        message: commission.toLocaleString() + " Credits added to your Credits balance (Level " + level + " Referral Chain Bonus)",
        type: "credits",
        read: false,
        createdAt: Timestamp.now(),
      });

      const nextUid2 = chainData.originalReferrerId || null;
      if (!nextUid2) break;
      chainUid = nextUid2;

    } catch (error) {
      console.error("L" + level + " referral-chain bonus error:", error);
    }
  }

  // STEP 3: Levels 11-20 — the TEAM MATRIX tier (previously labeled 2-10).
  // Follows the GLOBAL PLACEMENT chain (not the literal referral chain).
  // Credits are paid to whoever occupies each position in the GLOBAL
  // PLACEMENT chain, unconditionally — no team-size gate or roll-up: the
  // global placement structure itself already prevents anyone from
  // occupying a deep level without the whole network actually being large
  // enough to have filled every shallower level first.
  if (placementSponsorId) {
    let currentUid: string | null = placementSponsorId;

    for (let level = 12; level <= 20; level++) {
      if (!currentUid) break;
      try {
        const sponsorDoc = await getDoc(doc(db, "users", currentUid));
        if (!sponsorDoc.exists()) break;

        const sponsorData = sponsorDoc.data();
        const commission = getCommission(level, packageId);

        await setDoc(doc(db, "users", currentUid), {
          creditsBalance: (sponsorData.creditsBalance || 0) + commission,
          stats: {
            ...sponsorData.stats,
            totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
            teamSize: (sponsorData.stats?.teamSize || 0) + (isFirstActivation ? 1 : 0),
            totalReferrals: (sponsorData.stats?.totalReferrals || 0) + (isFirstActivation ? 1 : 0),
          }
        }, { merge: true });

        await addDoc(collection(db, "transactions"), {
          userId: currentUid,
          type: "in",
          title: "Level " + level + " Indirect Commission",
          amount: commission,
          isCredits: true,
          category: "Commission",
          status: "Completed",
          referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          paymentMethod: "MLM Commission",
          timestamp: Timestamp.now(),
          packageId,
          fromUserId: userId,
          commissionLevel: level,
        });

        console.log("L" + level + " matrix commission credited (Credits) to:", currentUid, "amount:", commission);

        await addDoc(collection(db, "users", currentUid, "notifications"), {
          title: "Level " + level + " Matrix Commission",
          message: commission.toLocaleString() + " Credits added to your Credits balance (Level " + level + ")",
          type: "credits",
          read: false,
          createdAt: Timestamp.now(),
        });

        const nextUid = sponsorData.sponsorId || null;
        if (!nextUid) break;
        currentUid = nextUid;

      } catch (error) {
        console.error("L" + level + " matrix commission error:", error);
      }
    }
  }

  console.log("Commission distribution complete");
}

export async function processTransfer(fromUserId: string, toUserId: string, amount: number) {
  try {
    const fromRef = doc(db, "users", fromUserId);
    const toRef = doc(db, "users", toUserId);
    const fromSnap = await getDoc(fromRef);
    const toSnap = await getDoc(toRef);
    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("User not found");
    const fromData = fromSnap.data();
    const toData = toSnap.data();
    if ((fromData.balance || 0) < amount) throw new Error("Insufficient balance");
    const now = Timestamp.now();
    const refNo = "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const senderName = fromData.displayName || fromData.username || "Unknown";
    const recipientName = toData.displayName || toData.username || "Unknown";
    await setDoc(fromRef, { balance: (fromData.balance || 0) - amount }, { merge: true });
    await setDoc(toRef, { balance: (toData.balance || 0) + amount }, { merge: true });
    await addDoc(collection(db, "transactions"), {
      userId: fromUserId, type: "out", title: "Sent to " + recipientName,
      amount: amount, category: "Transfer", status: "Completed",
      referenceNo: refNo, paymentMethod: "EJCASHH Wallet", timestamp: now,
    });
    await addDoc(collection(db, "transactions"), {
      userId: toUserId, type: "in", title: "Received from " + senderName,
      amount: amount, category: "Transfer", status: "Completed",
      referenceNo: refNo, paymentMethod: "EJCASHH Wallet", timestamp: now,
    });
    await addDoc(collection(db, "users", toUserId, "notifications"), {
      title: "Money Received",
      message: senderName + " sent you \u20B1" + amount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      type: "transfer", read: false, createdAt: now,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    throw error;
  }
}

// Retained for reference; not used by the Credits-based commission flow.
export const REWARD_STRUCTURE = [
  { level: 1, percent: 0.2778, amount: 100.00 },
];
