import { collection, getDocs, doc, getDoc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Auto-placement Unilevel System
 * - Each person has 10 slots (Level 1 direct positions)
 * - If Level 1 is full, next referral goes to Level 2, etc.
 * - Max 10 levels deep
 */

// Get direct children count of a user
async function getDirectChildrenCount(userId: string): Promise<number> {
  const q = query(collection(db, "users"), where("sponsorId", "==", userId));
  const snap = await getDocs(q);
  return snap.size;
}

// Get all direct children of a user
async function getDirectChildren(userId: string): Promise<string[]> {
  const q = query(collection(db, "users"), where("sponsorId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.id);
}

// BFS to find the first available slot in the unilevel tree
async function findAvailableSlot(rootUserId: string): Promise<string | null> {
  const queue: { userId: string; level: number }[] = [{ userId: rootUserId, level: 1 }];
  
  while (queue.length > 0) {
    const { userId, level } = queue.shift()!;
    if (level > 10) continue;
    
    const childCount = await getDirectChildrenCount(userId);
    if (childCount < 10) {
      return userId; // This user has an available slot
    }
    
    // Add children to queue for next level search
    if (level < 10) {
      const children = await getDirectChildren(userId);
      for (const childId of children) {
        queue.push({ userId: childId, level: level + 1 });
      }
    }
  }
  
  return null; // No available slot found
}

// Main auto-placement function
export async function autoPlaceUser(
  newUserId: string,
  referrerId: string
): Promise<{ placedUnder: string; isAutoPlaced: boolean }> {
  try {
    // Check if referrer has available slots
    const referrerChildCount = await getDirectChildrenCount(referrerId);
    
    if (referrerChildCount < 10) {
      // Referrer has space — place directly under referrer
      return { placedUnder: referrerId, isAutoPlaced: false };
    }
    
    // Referrer is full — find next available slot in their downline
    const availableSlot = await findAvailableSlot(referrerId);
    
    if (availableSlot) {
      // Update new user's sponsorId to the available slot
      await updateDoc(doc(db, "users", newUserId), {
        sponsorId: availableSlot,
        originalReferrerId: referrerId, // Keep track of original referrer
        isAutoPlaced: true,
      });
      return { placedUnder: availableSlot, isAutoPlaced: true };
    }
    
    // All 10 levels full — place under referrer anyway
    return { placedUnder: referrerId, isAutoPlaced: false };
    
  } catch (error) {
    console.error("Auto-placement error:", error);
    return { placedUnder: referrerId, isAutoPlaced: false };
  }
}
