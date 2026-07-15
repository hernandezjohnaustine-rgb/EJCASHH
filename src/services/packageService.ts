import { doc, getDoc, setDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export const PACKAGES = {
  PACKAGE_1: {
    id: "package_1",
    name: "EJCASHH Subscription",
    price: 360,
    multiplier: 1,
    description: "Starter activation package",
    color: "#10B981",
  },
  PACKAGE_2: {
    id: "package_2",
    name: "Activation Livelihood Program",
    price: 3600,
    multiplier: 10,
    description: "10x earnings on all commissions",
    color: "#F59E0B",
  },
  COMBINED: {
    id: "combined",
    name: "Complete Activation Bundle",
    price: 3960,
    multiplier: 10,
    description: "Package 1 + Package 2 combined",
    color: "#8B5CF6",
  },
};

// Commission structure
const COMMISSION_RATES: Record<number, number> = {
  1: 100,   // Fixed ₱100
  2: 0.05,  // 5%
  3: 0.03,  // 3%
  4: 0.02,  // 2%
  5: 0.01,  // 1%
  6: 0.01,
  7: 0.01,
  8: 0.01,
  9: 0.01,
  10: 0.01,
};

// Calculate commission for a level
function calculateCommission(
  level: number,
  packagePrice: number,
  multiplier: number
): number {
  if (level === 1) {
    return 100 * multiplier; // Fixed ₱100 for L1, x10 for Package 2
  }
  return packagePrice * COMMISSION_RATES[level] * multiplier;
}

// Distribute commissions up to 10 levels
export async function distributePackageCommission(
  buyerId: string,
  packageId: string,
  originalReferrerId?: string
) {
  const pkg = Object.values(PACKAGES).find(p => p.id === packageId);
  if (!pkg) return;

  const multiplier = pkg.multiplier;
  const basePrice = packageId === "combined" ? 3600 : pkg.price;

  // Start from original referrer (who referred the buyer)
  // Commission always goes to the referrer chain, not placement chain
  let currentUid = originalReferrerId || buyerId;

  for (let level = 1; level <= 10; level++) {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUid));
      if (!userDoc.exists()) break;

      const userData = userDoc.data();
      // Use originalReferrerId for L1, then go up the sponsor chain
      const nextUid = level === 1
        ? userData.sponsorId || userData.referredBy
        : userData.sponsorId || userData.referredBy;

      if (!nextUid) break;

      const sponsorDoc = await getDoc(doc(db, "users", nextUid));
      if (!sponsorDoc.exists()) break;

      const sponsorData = sponsorDoc.data();
      const commission = calculateCommission(level, basePrice, multiplier);

      // Update sponsor balance
      await setDoc(doc(db, "users", nextUid), {
        balance: (sponsorData.balance || 0) + commission,
        earningsWallet: (sponsorData.earningsWallet || 0) + commission,
        stats: {
          ...sponsorData.stats,
          totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
        }
      }, { merge: true });

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: nextUid,
        type: "in",
        title: `Level ${level} Commission — ${pkg.name}`,
        amount: commission,
        category: "Commission",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "MLM Commission",
        timestamp: Timestamp.now(),
        packageId,
        fromUserId: buyerId,
        commissionLevel: level,
      });

      currentUid = nextUid;
    } catch (error) {
      console.error(`Commission L${level} error:`, error);
      break;
    }
  }
}

