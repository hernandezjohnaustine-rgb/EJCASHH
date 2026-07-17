import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { MILESTONES } from "../screens/DirectsCertificate";

// Team-size requirement per commission level, sourced from the same
// MILESTONES table used for Certificate Rewards — kept as a single source
// of truth so the two systems can never drift out of sync.
const LEVEL_TEAM_SIZE_REQUIREMENT: Record<number, number> = MILESTONES.reduce(
  (acc, m) => { acc[m.level] = m.teamSize; return acc; },
  {} as Record<number, number>
);

function getCommission(level: number, packageId: string): number {
  if (packageId === "package_1") {
    return level === 1 ? 100 : 3;
  } else if (packageId === "package_2") {
    return level === 1 ? 1000 : 30;
  } else if (packageId === "combined") {
    const p1 = level === 1 ? 100 : 3;
    const p2 = level === 1 ? 1000 : 30;
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

  // STEP 2: Levels 2-10 follow the GLOBAL PLACEMENT chain (not the literal
  // referral chain). Two sub-steps:
  //   2a. Team size grows structurally for everyone in the placement chain
  //       (this is a fact about the matrix, independent of qualification).
  //   2b. Credits are paid out per level, but ONLY to someone who has
  //       already reached that level's required team size. If the person
  //       at that exact position isn't qualified yet, the Credits roll up
  //       to the next qualified person further up the SAME chain.
  if (!placementSponsorId) return;

  // Walk the placement chain upward, far enough that we can always find a
  // qualified recipient to roll up to (the master account's team size
  // covers the whole network, so the chain will always terminate
  // successfully there at the latest).
  const chain: string[] = [];
  {
    let walker: string | null = placementSponsorId;
    const seen = new Set<string>();
    while (walker && chain.length < 30) {
      if (seen.has(walker)) break;
      seen.add(walker);
      chain.push(walker);
      const wDoc = await getDoc(doc(db, "users", walker));
      if (!wDoc.exists()) break;
      walker = wDoc.data().sponsorId || wDoc.data().referredBy || null;
    }
  }

  // Snapshot each chain member's CURRENT team size once, up front. Used
  // both for qualification checks below and for the increments in step
  // 2a — one consistent snapshot avoids re-reading (and double-counting)
  // mid-loop.
  const chainSnapshot: { id: string; teamSize: number }[] = [];
  for (const id of chain) {
    const d = await getDoc(doc(db, "users", id));
    chainSnapshot.push({ id, teamSize: d.exists() ? (d.data().stats?.teamSize || 0) : 0 });
  }

  // STEP 2a: structural team-size growth for levels 2-10 (first 9 chain
  // positions), regardless of who ends up qualified to be PAID.
  if (isFirstActivation) {
    for (let i = 0; i < Math.min(chain.length, 9); i++) {
      const id = chain[i];
      try {
        const d = await getDoc(doc(db, "users", id));
        if (!d.exists()) continue;
        const data = d.data();
        await setDoc(doc(db, "users", id), {
          stats: {
            ...data.stats,
            teamSize: (data.stats?.teamSize || 0) + 1,
            totalReferrals: (data.stats?.totalReferrals || 0) + 1,
          }
        }, { merge: true });
      } catch (error) {
        console.error("Team size increment error at", id, error);
      }
    }
  }

  // STEP 2b: gated Credits payout per level, with roll-up.
  for (let level = 2; level <= 10; level++) {
    const commission = getCommission(level, packageId);
    const requiredTeamSize = LEVEL_TEAM_SIZE_REQUIREMENT[level] ?? Infinity;

    let recipientId: string | null = null;
    for (let idx = level - 1; idx < chainSnapshot.length; idx++) {
      if (chainSnapshot[idx].teamSize >= requiredTeamSize) {
        recipientId = chainSnapshot[idx].id;
        break;
      }
    }

    if (!recipientId) {
      console.log("L" + level + ": no qualified recipient found (required team size " + requiredTeamSize + ") — skipped.");
      continue;
    }

    try {
      const recipientDoc = await getDoc(doc(db, "users", recipientId));
      if (!recipientDoc.exists()) continue;
      const recipientData = recipientDoc.data();

      await setDoc(doc(db, "users", recipientId), {
        creditsBalance: (recipientData.creditsBalance || 0) + commission,
        stats: {
          ...recipientData.stats,
          totalEarnings: (recipientData.stats?.totalEarnings || 0) + commission,
        }
      }, { merge: true });

      await addDoc(collection(db, "transactions"), {
        userId: recipientId,
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

      console.log("L" + level + " commission credited (Credits) to:", recipientId, "amount:", commission);

      await addDoc(collection(db, "users", recipientId, "notifications"), {
        title: "Level " + level + " Matrix Commission",
        message: commission.toLocaleString() + " Credits added to your Credits balance (Level " + level + ")",
        type: "credits",
        read: false,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("L" + level + " commission error:", error);
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
