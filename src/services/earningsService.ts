import { 
  doc, 
  getDoc,
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
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef); // Read user first to find sponsor info if needed

    if (!userSnap.exists()) throw new Error("User not found");
    const userData = userSnap.data();
    if (userData.isActivated) throw new Error("User already activated");

    let initialSponsorId = userData.sponsorId;

    // Fallback: If sponsorId is missing, try to find it using the referredBy code
    if (!initialSponsorId && userData.referredBy) {
      const q = query(
        collection(db, "users"), 
        where("referralCode", "==", userData.referredBy), 
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        initialSponsorId = snap.docs[0].id;
      }
    }

    await runTransaction(db, async (transaction) => {
      const freshUserSnap = await transaction.get(userRef);
      if (!freshUserSnap.exists()) throw new Error("User not found");
      const freshUserData = freshUserSnap.data();
      if (freshUserData.isActivated) throw new Error("User already activated");
      
      const ACTIVATION_FEE = 360.00;
      const currentBalance = freshUserData.balance || 0;
      
      if (currentBalance < ACTIVATION_FEE) {
        throw new Error(`Insufficient Balance. You need ₱${ACTIVATION_FEE.toLocaleString()} to activate your account.`);
      }

      // 1. Collect all sponsors in the chain (up to 10 levels)
      const sponsors: { ref: any, id: string, data: any }[] = [];
      let nextSponsorId = initialSponsorId;
      
      let depth = 1;
      while (nextSponsorId && depth <= 10) {
        const sponsorRef = doc(db, "users", nextSponsorId);
        const sponsorSnap = await transaction.get(sponsorRef);
        
        if (!sponsorSnap.exists()) break;
        
        const sponsorData = sponsorSnap.data();
        sponsors.push({ 
          ref: sponsorRef, 
          id: sponsorSnap.id, 
          data: sponsorData 
        });
        
        nextSponsorId = sponsorData.sponsorId;
        depth++;
      }

      // 2. NOW perform all updates
      transaction.update(userRef, { 
        isActivated: true,
        activatedAt: Timestamp.now(),
        balance: increment(-ACTIVATION_FEE)
      });

      // Add activation fee transaction
      const feeTxRef = doc(collection(db, "transactions"));
      transaction.set(feeTxRef, {
        userId: userId,
        title: "Account Activation Fee",
        amount: ACTIVATION_FEE,
        type: "out",
        category: "System",
        status: "Completed",
        timestamp: Timestamp.now(),
        referenceNo: "EJ-ACT-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      });

      // Distribute rewards to sponsors
      sponsors.forEach((sponsor, index) => {
        const currentDepth = index + 1;
        const reward = REWARD_STRUCTURE.find(r => r.level === currentDepth);
        
        if (reward) {
          const updateData: any = {
            balance: increment(reward.amount),
            earningsWallet: increment(reward.amount),
            "stats.teamSize": increment(1),
            "stats.totalEarnings": increment(reward.amount)
          };

          if (currentDepth === 1) {
            updateData["stats.directReferrals"] = increment(1);
          }

          transaction.update(sponsor.ref, updateData);

          const txRef = doc(collection(db, "transactions"));
          transaction.set(txRef, {
            userId: sponsor.id,
            title: currentDepth === 1 ? "Direct Referral Bonus" : `Indirect Bonus (L${currentDepth})`,
            amount: reward.amount,
            type: "in",
            category: "Commission",
            status: "Completed",
            timestamp: Timestamp.now(),
            fromUser: userData.displayName || "New Member",
            referenceNo: "EJ-REF-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          });
        }
      });
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
