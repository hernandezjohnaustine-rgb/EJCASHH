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
  { level: 1, percent: 0.2778, amount: 100.00 }, // Direct

];

export async function processActivation(
  userId: string,
  sponsorId: string | null,
  packageId: string = "package_1"
): Promise<void> {
  const PACKAGE_PRICES: Record<string, number> = {
    package_1: 360,
    package_2: 3600,
    combined: 3600, // Commission base is 3600 for combined
  };

  const MULTIPLIERS: Record<string, number> = {
    package_1: 1,
    package_2: 10,
    combined: 10,
  };

  const basePrice = PACKAGE_PRICES[packageId] || 360;
  const multiplier = MULTIPLIERS[packageId] || 1;

  if (!sponsorId) return;

  let currentUid = sponsorId;

  for (let level = 1; level <= 10; level++) {
    try {
      const sponsorDoc = await getDoc(doc(db, "users", currentUid));
      if (!sponsorDoc.exists()) break;

      const sponsorData = sponsorDoc.data();

      // Calculate commission
      let commission = 0;
      if (level === 1) {
        commission = REWARD_STRUCTURE[0].amount * multiplier; // ₱100 * multiplier
      } else {
        const rate = REWARD_STRUCTURE.find(r => r.level === level)?.percent || 0.01;
        commission = basePrice * rate * multiplier;
      }

      // Update sponsor
      await setDoc(doc(db, "users", currentUid), {
        balance: (sponsorData.balance || 0) + commission,
        earningsWallet: (sponsorData.earningsWallet || 0) + commission,
        stats: {
          ...sponsorData.stats,
          totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
          ...(level === 1 ? {
            directReferrals: (sponsorData.stats?.directReferrals || 0) + 1,
          } : {}),
        }
      }, { merge: true });

      // Update team size for all uplines
      await setDoc(doc(db, "users", currentUid), {
        stats: {
          ...sponsorData.stats,
          teamSize: (sponsorData.stats?.teamSize || 0) + 1,
          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,
        }
      }, { merge: true });

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUid,
        type: "in",
        title: `Level ${level} Commission${multiplier > 1 ? ` (${multiplier}x)` : ''} — New Activation`,
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
      console.error(`Level ${level} commission error:`, error);
      break;
    }
  }
}

export async function processTransfer(fromUserId: string, toUserId: string, amount: number) {
  const path = `transfer/${fromUserId}/${toUserId}`;
  try {
    const fromUserRef = doc(db, "users", fromUserId);
    const toUserRef = doc(db, "users", toUserId);

    await runTransaction(db, async (transaction) => {
      const fromSnap = await transaction.get(fromUserRef);
      const toSnap = await transaction.get(toUserRef);

      if (!fromSnap.exists()) throw new Error("Sender not found");
      if (!toSnap.exists()) throw new Error("Recipient not found");

      const fromData = fromSnap.data();
      const toData = toSnap.data();

      if ((fromData.balance || 0) < amount) throw new Error("Insufficient balance");

      transaction.update(fromUserRef, { balance: increment(-amount) });
      transaction.update(toUserRef, { balance: increment(amount) });

      // Transaction for sender
      const fromTxRef = doc(collection(db, "transactions"));
      transaction.set(fromTxRef, {
        userId: fromUserId,
        title: `Sent to ${toData.displayName || toData.email || "User"}`,
        amount: amount,
        type: "out",
        category: "Transfer",
        status: "Completed",
        timestamp: Timestamp.now(),
        targetUserId: toUserId,
        referenceNo: "EJ-TX-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      });

      // Transaction for recipient
      const toTxRef = doc(collection(db, "transactions"));
      transaction.set(toTxRef, {
        userId: toUserId,
        title: `Received from ${fromData.displayName || fromData.email || "User"}`,
        amount: amount,
        type: "in",
        category: "Transfer",
        status: "Completed",
        timestamp: Timestamp.now(),
        sourceUserId: fromUserId,
        referenceNo: "EJ-RX-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      });
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}


