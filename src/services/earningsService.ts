import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Commission structure
// Package 1 (360): L1=100, L2-L10=3 each
// Package 2 (3600): L1=1000, L2-L10=30 each

function getCommission(level: number, packageId: string): number {
  if (packageId === "package_1") {
    return level === 1 ? 100 : 3;
  } else if (packageId === "package_2") {
    return level === 1 ? 1000 : 30;
  } else if (packageId === "combined") {
    // Both packages combined
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
  if (!placementSponsorId && !originalReferrerId) {
    console.log("No sponsor ID - skipping commission distribution");
    return;
  }

  console.log("Starting commission distribution. Referrer:", originalReferrerId, "Placement:", placementSponsorId, "Package:", packageId);

  // ✅ Step 1: Credit Level 1 commission to ORIGINAL REFERRER (who shared the link)
  const referrerId = originalReferrerId || placementSponsorId;
  if (referrerId) {
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
          title: "Direct Referral Commission",
          amount: l1Commission,
          category: "Commission",
          status: "Completed",
          referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          paymentMethod: "MLM Commission",
          timestamp: Timestamp.now(),
          packageId,
          fromUserId: userId,
          commissionLevel: 1,
        });
        }
    } catch (error) {
      console.error("Level 1 referrer commission error:", error);
    }
  }

  // ✅ Step 2: Credit Levels 2-10 to PLACEMENT UPLINES (matrix chain)
  console.log("L2-10 start - placementSponsorId:", placementSponsorId, "referrerId:", referrerId, "same?", placementSponsorId === referrerId);
  if (!placementSponsorId) return;

  // Start from placement sponsor upline (skip level 1 since already credited)
  let currentUid = placementSponsorId;
  // If placement is same as referrer, skip to their upline for level 2
  if (currentUid === referrerId) {
    const placementDoc = await getDoc(doc(db, "users", currentUid));
    if (placementDoc.exists()) {
      const placementData = placementDoc.data();
      currentUid = placementData.sponsorId || placementData.referredBy || "";
    }
  }

  for (let level = 2; level <= 10; level++) {
    if (!currentUid) break;
    try {
      const sponsorDoc = await getDoc(doc(db, "users", currentUid));
      if (!sponsorDoc.exists()) {
          break;
      }
      const sponsorData = sponsorDoc.data();
      const commission = getCommission(level, packageId);
      await setDoc(doc(db, "users", currentUid), {
        balance: (sponsorData.balance || 0) + commission,
        earningsWallet: (sponsorData.earningsWallet || 0) + commission,
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
        title: "Indirect Referral Commission (Level " + level + ")",
        amount: commission,
        category: "Commission",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "MLM Commission",
        timestamp: Timestamp.now(),
        packageId,
        fromUserId: userId,
        commissionLevel: level,
      });
      const nextUid = sponsorData.sponsorId || sponsorData.referredBy;
      if (!nextUid) break;
      currentUid = nextUid;
    } catch (error) {
      console.error("Commission error at level " + level + ":", error);
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
    await setDoc(fromRef, { balance: (fromData.balance || 0) - amount }, { merge: true });
    await setDoc(toRef, { balance: (toData.balance || 0) + amount }, { merge: true });
  } catch (error) {
    console.error("Transfer error:", error);
    throw error;
  }
}

export const REWARD_STRUCTURE = [
  { level: 1, percent: 0.2778, amount: 100.00 },
];
