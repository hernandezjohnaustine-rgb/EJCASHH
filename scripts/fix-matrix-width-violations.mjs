/**
 * fix-matrix-width-violations.mjs
 * ---------------------------------------------------------------------------
 * Fixes accounts with more than 10 direct children (a violation of the
 * matrix's placement rule, caused by an old registration-time sponsorId
 * assignment that bypassed proper BFS placement).
 *
 * For each violating sponsor:
 *   - Keeps their EARLIEST 10 children (by createdAt) as-is, unchanged.
 *   - For every additional (excess) child, finds the next genuinely
 *     available slot via breadth-first search from the matrix root
 *     (Office), and re-points that child's sponsorId there — exactly the
 *     same placement logic autoPlaceUser uses live.
 *
 * This is a pure structural change (sponsorId field only). It does NOT
 * touch any past commission transactions or balances.
 *
 * USAGE:
 *   node fix-matrix-width-violations.mjs            (dry run)
 *   node fix-matrix-width-violations.mjs --apply     (writes)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const MASTER_EMAIL = "austinejohnter17@gmail.com";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  const master = allUsers.find((u) => u.email === MASTER_EMAIL);
  if (!master) { log("⚠️  Master account not found."); return; }

  // Mutable in-memory picture of sponsorId → children, updated as we go.
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

  // Find every violating sponsor (more than 10 direct children).
  const violations = [];
  for (const [sponsorId, kids] of childrenOf.entries()) {
    if (kids.length > 10) violations.push(sponsorId);
  }

  log(`Found ${violations.length} account(s) with more than 10 direct children.\n`);

  let movedCount = 0;

  for (const sponsorId of violations) {
    const sponsor = usersById.get(sponsorId);
    const kidsIds = childrenOf.get(sponsorId);
    const kidsSorted = kidsIds
      .map((id) => usersById.get(id))
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });

    const keep = kidsSorted.slice(0, 10);
    const excess = kidsSorted.slice(10);

    log(`--- "${sponsor?.displayName || sponsorId}" — keeping earliest 10, redistributing ${excess.length} excess ---\n`);

    // Reflect the "keep" list in our in-memory map immediately (10 max).
    childrenOf.set(sponsorId, keep.map((k) => k.id));

    for (const child of excess) {
      const slot = findAvailableSlot(master.id);
      if (!slot) {
        log(`  [NO SLOT FOUND] "${child.displayName || child.id}" — the entire matrix is full. Skipped.`);
        continue;
      }
      const slotName = usersById.get(slot)?.displayName || slot;
      log(`  [MOVE] "${child.displayName || child.id}" (uid ${child.id}) → under "${slotName}" (uid ${slot})`);
      movedCount++;

      if (!childrenOf.has(slot)) childrenOf.set(slot, []);
      childrenOf.get(slot).push(child.id);

      if (APPLY) {
        await db.collection("users").doc(child.id).update({
          sponsorId: slot,
          fixedWidthViolationAt: Timestamp.now(),
          previousSponsorId: sponsorId,
        });
      }
    }
    log("");
  }

  log(`=== SUMMARY ===`);
  log(`${violations.length} violating account(s) processed.`);
  log(`${movedCount} excess child(ren) redistributed to genuinely available slots.`);
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
