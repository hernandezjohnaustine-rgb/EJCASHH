content = '''import {
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
  sponsorId: string | null,
  packageId: string = "package_1"
): Promise<void> {
  if (!sponsorId) {
    console.log("No sponsor ID - skipping commission distribution");
    return;
  }

  console.log("Starting commission distribution for sponsor:", sponsorId, "package:", packageId);

  let currentUid = sponsorId;

  for (let level = 1; level <= 10; level++) {
    try {
      const sponsorDoc = await getDoc(doc(db, "users", currentUid));
      if (!sponsorDoc.exists()) {
        console.log("Sponsor not found at level", level, "- stopping");
        break;
      }

      const sponsorData = sponsorDoc.data();
      const commission = getCommission(level, packageId);

      console.log("Level", level, "sponsor:", currentUid, "commission:", commission);

      // Single update - no overwrite issue
      await setDoc(doc(db, "users", currentUid), {
        balance: (sponsorData.balance || 0) + commission,
        earningsWallet: (sponsorData.earningsWallet || 0) + commission,
        stats: {
          ...sponsorData.stats,
          totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
          teamSize: (sponsorData.stats?.teamSize || 0) + 1,
          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,
          ...(level === 1 ? {
            directReferrals: (sponsorData.stats?.directReferrals || 0) + 1,
          } : {}),
        }
      }, { merge: true });

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUid,
        type: "in",
        title: level === 1
          ? "Direct Referral Commission"
          : "Indirect Referral Commission (Level " + level + ")",
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

      console.log("Level", level, "commission credited successfully");

      // Move to next upline
      const nextUid = sponsorData.sponsorId || sponsorData.referredBy;
      if (!nextUid) {
        console.log("No more uplines at level", level);
        break;
      }
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
'''
open('src/services/earningsService.ts', 'w', encoding='utf-8').write(content)
print('Done!')
