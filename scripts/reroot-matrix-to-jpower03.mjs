/**
 * reroot-matrix-to-jpower03.mjs
 * ---------------------------------------------------------------------------
 * Re-places Office's other 9 direct matrix children (excluding JPOWER03
 * himself, who is already correctly positioned) into JPOWER03's subtree —
 * using the SAME breadth-first "find the next open slot" logic as normal
 * auto-placement, one person at a time (since each placement changes
 * what's available for the next). This keeps the matrix internally
 * consistent instead of dumping all 9 directly onto JPOWER03 regardless
 * of capacity.
 *
 * This is a pure structural change (sponsorId field only). It does NOT
 * touch any past commission transactions or balances — those remain
 * exactly as they were legitimately paid under the prior structure.
 *
 * USAGE:
 *   node reroot-matrix-to-jpower03.mjs            (dry run)
 *   node reroot-matrix-to-jpower03.mjs --apply     (writes)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const MASTER_EMAIL = "austinejohnter17@gmail.com";
const JPOWER_CODE = "JPOWER03";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const master = allUsers.find((u) => u.email === MASTER_EMAIL);
  const jpower = allUsers.find((u) => u.referralCode === JPOWER_CODE);

  if (!master) { log("⚠️  Master account not found."); return; }
  if (!jpower) { log("⚠️  JPOWER03 account not found."); return; }

  log(`Master (Office): ${master.displayName || master.id} (uid ${master.id})`);
  log(`JPOWER03: ${jpower.displayName || jpower.id} (uid ${jpower.id})\n`);

  const officeChildren = allUsers.filter((u) => u.sponsorId === master.id && u.id !== jpower.id);
  log(`Placing ${officeChildren.length} of Office's direct children into JPOWER03's subtree (excluding JPOWER03 himself):\n`);

  // Build a mutable in-memory picture of sponsorId → children, seeded from
  // the real current data, updated as we go so each placement sees the
  // effect of the previous one (matching how autoPlaceUser works live).
  const childrenOf = new Map();
  for (const u of allUsers) {
    if (u.sponsorId) {
      if (!childrenOf.has(u.sponsorId)) childrenOf.set(u.sponsorId, []);
      childrenOf.get(u.sponsorId).push(u.id);
    }
  }

  function findAvailableSlot(rootId) {
    const queue = [rootId];
    const visited = new Set();
    while (queue.length > 0) {
      const uid = queue.shift();
      if (visited.has(uid)) continue;
      visited.add(uid);
      const kids = childrenOf.get(uid) || [];
      if (kids.length < 10) return uid;
      queue.push(...kids);
    }
    return null;
  }

  let placedCount = 0;

  for (const child of officeChildren) {
    const slot = findAvailableSlot(jpower.id);
    if (!slot) {
      log(`  [NO SLOT FOUND] "${child.displayName || child.id}" — JPOWER03's entire subtree is full. Skipped.`);
      continue;
    }
    const slotName = allUsers.find((u) => u.id === slot)?.displayName || slot;
    log(`  [PLACE] "${child.displayName || child.id}" (uid ${child.id}) → under "${slotName}" (uid ${slot})`);
    placedCount++;

    // Reflect this placement in our in-memory picture immediately, so the
    // NEXT person in this loop sees this slot as now occupied.
    if (!childrenOf.has(slot)) childrenOf.set(slot, []);
    childrenOf.get(slot).push(child.id);

    if (APPLY) {
      await db.collection("users").doc(child.id).update({
        sponsorId: slot,
        rerootedToJpower03At: Timestamp.now(),
        previousSponsorId: master.id,
      });
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`${placedCount} of ${officeChildren.length} account(s) placed into JPOWER03's subtree.`);
  log(`No commission transactions or balances were touched — this is a structural change only.`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review EVERY line above carefully, then re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
