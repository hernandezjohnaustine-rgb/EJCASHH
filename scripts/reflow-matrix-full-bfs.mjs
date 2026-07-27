/**
 * reflow-matrix-full-bfs.mjs
 * ---------------------------------------------------------------------------
 * Performs a FULL breadth-first reflow of the entire Team Matrix under
 * JPOWER03. Collects every current member of the matrix, sorts them by
 * original createdAt (earliest first, preserving seniority/join order),
 * and re-simulates placement from scratch using proper BFS — filling
 * every available slot at a shallower level before any slot at a deeper
 * level is used. This corrects legacy irregularities where someone ended
 * up deep in one branch while a shallower slot elsewhere sat empty.
 *
 * Only WRITES a change for people whose computed correct sponsorId
 * differs from their current one — most members likely won't move at
 * all. This is a pure structural change (sponsorId field only) — it does
 * NOT touch any past commission transactions or balances.
 *
 * USAGE:
 *   node reflow-matrix-full-bfs.mjs            (dry run)
 *   node reflow-matrix-full-bfs.mjs --apply     (writes)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const JPOWER_CODE = "JPOWER03";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  const jpower = allUsers.find((u) => u.referralCode === JPOWER_CODE);
  if (!jpower) { log("⚠️  JPOWER03 not found."); return; }

  // Build the CURRENT children map, to collect everyone in JPOWER03's subtree.
  const currentChildrenOf = new Map();
  for (const u of allUsers) {
    if (u.sponsorId) {
      if (!currentChildrenOf.has(u.sponsorId)) currentChildrenOf.set(u.sponsorId, []);
      currentChildrenOf.get(u.sponsorId).push(u.id);
    }
  }

  const subtreeMembers = [];
  (function collect(uid) {
    const kids = currentChildrenOf.get(uid) || [];
    for (const kidId of kids) {
      subtreeMembers.push(kidId);
      collect(kidId);
    }
  })(jpower.id);

  log(`Found ${subtreeMembers.length} member(s) currently in JPOWER03's subtree.\n`);

  // Sort by original createdAt — earliest first, preserving seniority.
  const sortedMembers = subtreeMembers
    .map((id) => usersById.get(id))
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

  // Re-simulate placement from scratch: fresh in-memory tree, starting
  // with JPOWER03 having 0 children, BFS-placing each member in order.
  const newChildrenOf = new Map();

  function findAvailableSlot(rootId) {
    const queue = [rootId];
    const visited = new Set();
    while (queue.length > 0) {
      const uid = queue.shift();
      if (visited.has(uid)) continue;
      visited.add(uid);
      const kids = newChildrenOf.get(uid) || [];
      if (kids.length < 10) return uid;
      queue.push(...kids);
    }
    return null;
  }

  let changedCount = 0;
  let unchangedCount = 0;

  for (const member of sortedMembers) {
    const newSlot = findAvailableSlot(jpower.id);
    if (!newSlot) {
      log(`  [NO SLOT FOUND] "${member.displayName || member.id}" — matrix full. Skipped.`);
      continue;
    }

    if (!newChildrenOf.has(newSlot)) newChildrenOf.set(newSlot, []);
    newChildrenOf.get(newSlot).push(member.id);

    if (newSlot !== member.sponsorId) {
      const oldSponsorName = usersById.get(member.sponsorId)?.displayName || member.sponsorId;
      const newSlotName = usersById.get(newSlot)?.displayName || newSlot;
      log(`  [MOVE] "${member.displayName || member.id}" — sponsor: "${oldSponsorName}" → "${newSlotName}"`);
      changedCount++;

      if (APPLY) {
        await db.collection("users").doc(member.id).update({
          sponsorId: newSlot,
          reflowedAt: Timestamp.now(),
          previousSponsorId: member.sponsorId || null,
        });
      }
    } else {
      unchangedCount++;
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`${sortedMembers.length} total member(s) processed.`);
  log(`${changedCount} account(s) moved to a shallower, previously-empty slot.`);
  log(`${unchangedCount} account(s) already correctly placed — no change needed.`);
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
