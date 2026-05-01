import { 
  doc, 
  runTransaction, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  Timestamp,
  increment
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";

const REWARD_STRUCTURE = [
  { level: 1, percent: 0.30, amount: 108.00 }, // Direct
  { level: 2, percent: 0.10, amount: 36.00 },
  { level: 3, percent: 0.05, amount: 18.00 },
  { level: 4, percent: 0.03, amount: 10.80 },
  { level: 5, percent: 0.02, amount: 7.20 },
  { level: 6, percent: 0.01, amount: 3.60 },
  { level: 7, percent: 0.01, amount: 3.60 },
  { level: 8, percent: 0.01, amount: 3.60 },
  { level: 9, percent: 0.01, amount: 3.60 },
  { level: 10, percent: 0.01, amount: 3.60 },
];

export async function processActivation(userId: string) {
  const path = `activation/${userId}`;
  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();

      if (userData.isActivated) throw new Error("User already activated");

      // 1. Activate the user
      transaction.update(userRef, { 
        isActivated: true,
        activatedAt: Timestamp.now() 
      });

      let currentSponsorCode = userData.referredBy;
      let depth = 1;

      // 2. Traverse up the tree to distribute rewards (Up to 10 levels)
      while (currentSponsorCode && depth <= 10) {
        const sponsorQuery = query(
          collection(db, "users"), 
          where("referralCode", "==", currentSponsorCode), 
          limit(1)
        );
        const sponsorDocs = await getDocs(sponsorQuery);

        if (sponsorDocs.empty) break;

        const sponsorDoc = sponsorDocs.docs[0];
        const sponsorRef = doc(db, "users", sponsorDoc.id);
        const sponsorData = sponsorDoc.data();

        const reward = REWARD_STRUCTURE.find(r => r.level === depth);
        if (reward) {
          transaction.update(sponsorRef, {
            balance: increment(reward.amount),
            earningsWallet: increment(reward.amount),
            "stats.teamSize": increment(1)
          });
          if (depth === 1) {
            transaction.update(sponsorRef, {
              "stats.directReferrals": increment(1)
            });
          }

          const txRef = doc(collection(db, "transactions"));
          transaction.set(txRef, {
            userId: sponsorDoc.id,
            title: depth === 1 ? "Direct Referral Bonus" : `Indirect Bonus (L${depth})`,
            amount: reward.amount,
            type: "in",
            category: "Commission",
            status: "Completed",
            timestamp: Timestamp.now(),
            fromUser: userData.displayName || "New Member",
            referenceNo: "EJ-REF-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          });
        }

        currentSponsorCode = sponsorData.referredBy;
        depth++;
      }
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
