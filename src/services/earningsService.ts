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
  originalReferrerId?: string | null
): Promise<void> {
  const referrerId = originalReferrerId || placementSponsorId;

  if (!referrerId) {
    console.log("No referrer - skipping commission");
    return;
  }

  console.log("Commission start - Referrer:", referrerId, "Placement:", placementSponsorId, "Package:", packageId);

  // STEP 1: Level 1 commission always goes to REFERRER (owner of referral link)
  // NOTE: L1 is cash — credited to the Main Wallet (balance) and the
  // withdrawable earningsWallet, same as before Credits existed.
  // Only L2-10 (below) are credited to creditsBalance.
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
          directReferrals: (referrerData.stats?.directReferrals || 0) + 1,
          teamSize: (referrerData.stats?.teamSize || 0) + 1,
          totalReferrals: (referrerData.stats?.totalReferrals || 0) + 1,
        }
      }, { merge: true });

      await addDoc(collection(db, "transactions"), {
        userId: referrerId,
        type: "in",
        title: "Level 1 Direct Referral Commission",
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

  // STEP 2: Levels 2-10 follow PLACEMENT SPONSOR upline chain
  if (!placementSponsorId) return;

  // Start from placement sponsor for L2
  // If placement is same as referrer, start from their upline
  let currentUid = placementSponsorId;
  if (currentUid === referrerId) {
    const doc1 = await getDoc(doc(db, "users", currentUid));
    if (doc1.exists()) {
      currentUid = doc1.data().sponsorId || doc1.data().referredBy || "";
    }
  }

  for (let level = 2; level <= 10; level++) {
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
          teamSize: (sponsorData.stats?.teamSize || 0) + 1,
          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,
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

      console.log("L" + level + " commission credited (Credits) to:", currentUid, "amount:", commission);

      await addDoc(collection(db, "users", currentUid, "notifications"), {
        title: "Level " + level + " Matrix Commission",
        message: commission.toLocaleString() + " Credits added to your Credits balance (Level " + level + ")",
        type: "credits",
        read: false,
        createdAt: Timestamp.now(),
      });

      const nextUid = sponsorData.sponsorId || sponsorData.referredBy;
      if (!nextUid) break;
      currentUid = nextUid;

    } catch (error) {
      console.error("L" + level + " commission error:", error);
      break;
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
