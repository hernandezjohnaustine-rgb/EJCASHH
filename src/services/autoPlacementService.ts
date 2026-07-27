import { collection, getDocs, doc, updateDoc, query, where, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Global Unilevel Matrix — Breadth-First Placement
 * -----------------------------------------------------------------------
 * There is exactly ONE matrix for the entire platform, rooted at
 * JPOWER03 (not the master account — the master account and the 11
 * accounts above JPOWER03 form a separate, dedicated Referral Chain
 * backbone, outside the matrix). Every activated user — regardless of
 * who literally referred them — is placed via breadth-first search into
 * the next open slot in THIS global tree, starting from JPOWER03.
 *
 * IMPORTANT: this placement is used ONLY for indirect (Level 12-20)
 * Credits commission and for Milestone/team-size tracking. The Level 1
 * CASH commission always goes to the person's true, literal direct
 * referrer (tracked separately as originalReferrerId in
 * earningsService.ts) and is never affected by this placement.
 *
 * SCALABILITY NOTE: this does a live BFS over Firestore on every new
 * activation. That's cheap while the network is small, but as it grows
 * toward thousands/millions of members, this will become slow and
 * read-expensive. If/when that becomes a problem, consider maintaining a
 * denormalized "next open slot per level" pointer instead of searching
 * from scratch each time.
 */
const MATRIX_ROOT_CODE = "JPOWER03";

let cachedMasterUid: string | null = null;

async function getMasterUid(): Promise<string | null> {
  if (cachedMasterUid) return cachedMasterUid;
  const q = query(collection(db, "users"), where("referralCode", "==", MATRIX_ROOT_CODE), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.error("Matrix root account not found for referralCode:", MATRIX_ROOT_CODE);
    return null;
  }
  cachedMasterUid = snap.docs[0].id;
  return cachedMasterUid;
}

async function getDirectChildrenCount(userId: string): Promise<number> {
  const q = query(collection(db, "users"), where("sponsorId", "==", userId));
  const snap = await getDocs(q);
  return snap.size;
}

async function getDirectChildren(userId: string): Promise<string[]> {
  const q = query(collection(db, "users"), where("sponsorId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.id);
}

// Breadth-first search across the WHOLE global matrix, starting at the
// master account, for the first node with fewer than 10 direct children.
async function findAvailableSlotGlobal(rootUserId: string): Promise<string | null> {
  const queue: string[] = [rootUserId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const userId = queue.shift()!;
    if (visited.has(userId)) continue;
    visited.add(userId);

    const childCount = await getDirectChildrenCount(userId);
    if (childCount < 10) return userId;

    const children = await getDirectChildren(userId);
    for (const childId of children) queue.push(childId);
  }
  return null;
}

/**
 * Places a newly-activating user into the global matrix.
 *
 * `referrerId` (the true direct referrer) is kept as a parameter for
 * backward compatibility and is stored as `originalReferrerId` for Level 1
 * cash commission — but it no longer determines WHERE the user is placed.
 * Placement always searches the global matrix from the master account.
 */
export async function autoPlaceUser(
  newUserId: string,
  referrerId: string
): Promise<{ placedUnder: string; isAutoPlaced: boolean }> {
  try {
    const masterUid = await getMasterUid();
    if (!masterUid) {
      // Safety fallback: if the master account can't be resolved, place
      // under the referrer directly rather than blocking the activation.
      return { placedUnder: referrerId, isAutoPlaced: false };
    }

    const availableSlot = await findAvailableSlotGlobal(masterUid);
    if (!availableSlot) {
      // Entire matrix full — extremely unlikely (10 billion capacity at
      // Level 10), but handled safely.
      return { placedUnder: referrerId, isAutoPlaced: false };
    }

    await updateDoc(doc(db, "users", newUserId), {
      sponsorId: availableSlot,
      originalReferrerId: referrerId,
      isAutoPlaced: availableSlot !== referrerId,
    });

    return { placedUnder: availableSlot, isAutoPlaced: availableSlot !== referrerId };
  } catch (error) {
    console.error("Auto-placement error:", error);
    return { placedUnder: referrerId, isAutoPlaced: false };
  }
}
