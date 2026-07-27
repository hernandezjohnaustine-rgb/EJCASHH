/**
 * exclude-ejcashh-backbone-from-matrix.mjs
 * ---------------------------------------------------------------------------
 * The EJCASHH01-11 accounts (Office through the account directly above
 * JPOWER03) form a dedicated Referral Chain backbone and should NEVER
 * appear inside the Team Matrix (sponsorId-based) structure — only
 * JPOWER03 (EJCASHH12) is the matrix's root.
 *
 * This script:
 *   1. Finds every EJCASHH01-11 account.
 *   2. Clears their sponsorId if they somehow have one (removes them
 *      from the matrix entirely).
 *   3. For any of them that currently have real matrix members placed
 *      as children under them, re-places those members via proper BFS
 *      elsewhere in JPOWER03's subtree (never back into the backbone).
 *
 * Pure structural change (sponsorId only) — does not touch commissions
 * or balances.
 *
 * USAGE:
 *   node exclude-ejcashh-backbone-from-matrix.mjs            (dry run)
 *   node exclude-ejcashh-backbone-from-matrix.mjs --apply     (writes)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const JPOWER_CODE = "JPOWER03";
const BACKBONE_NAMES = ["EJCASHH01", "EJCASHH02", "EJCASHH03", "EJCASHH04", "EJCASHH05", "EJCASHH06", "EJCASHH07", "EJCASHH08", "EJCASHH09", "EJCASHH10", "EJCASHH11"];

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

  const backboneAccounts = allUsers.filter((u) => BACKBONE_NAMES.includes(u.displayName));
  log(`Found ${backboneAccounts.length} of the ${BACKBONE_NAMES.length} expected backbone accounts:`);
  backboneAccounts.forEach((b) => log(`  - ${b.displayName} (uid ${b.id}), sponsorId: ${b.sponsorId || "(none)"}`));

  const backboneIds = new Set(backboneAccounts.map((b) => b.id));

  // Current children map, excluding the backbone as valid parents going forward.
  const childrenOf = new Map();
  for (const u of allUsers) {
    if (u.sponsorId && !backboneIds.has(u.id)) {
      if (!childrenOf.has(u.sponsorId)) childrenOf.set(u.sponsorId, []);
      childrenOf.get(u.sponsorId).push(u.id);
    }
  }

  function findAvailableSlot(rootId) {
    const queue = [rootId];
    const visited = new Set();
    while (queue.length > 0) {
      const uid = queue.shift();
      if (visited.has(uid) || backboneIds.has(uid)) continue; // never route through the backbone
      visited.add(uid);
      const kids = childrenOf.get(uid) || [];
      if (kids.length < 10) return uid;
      queue.push(...kids);
    }
    return null;
  }

  log(`\n--- Checking each backbone account for matrix involvement ---\n`);

  let clearedCount = 0;
  let redistributedCount = 0;

  for (const backbone of backboneAccounts) {
    const hadSponsor = !!backbone.sponsorId;
    const currentChildren = allUsers.filter((u) => u.sponsorId === backbone.id);

    if (!hadSponsor && currentChildren.length === 0) {
      log(`  "${backbone.displayName}" — clean, no matrix involvement. Skipped.`);
      continue;
    }

    if (hadSponsor) {
      log(`  [CLEAR SPONSOR] "${backbone.displayName}" — removing sponsorId (was placed under "${usersById.get(backbone.sponsorId)?.displayName || backbone.sponsorId}")`);
      clearedCount++;
      if (APPLY) {
        await db.collection("users").doc(backbone.id).update({ sponsorId: null, removedFromMatrixAt: Timestamp.now() });
      }
    }

    if (currentChildren.length > 0) {
      log(`  "${backbone.displayName}" has ${currentChildren.length} real matrix member(s) under them — redistributing:`);
      for (const child of currentChildren) {
        const slot = findAvailableSlot(jpower.id);
        if (!slot) {
          log(`    [NO SLOT FOUND] "${child.displayName || child.id}" — matrix full. Skipped.`);
          continue;
        }
        const slotName = usersById.get(slot)?.displayName || slot;
        log(`    [MOVE] "${child.displayName || child.id}" → under "${slotName}"`);
        redistributedCount++;

        if (!childrenOf.has(slot)) childrenOf.set(slot, []);
        childrenOf.get(slot).push(child.id);

        if (APPLY) {
          await db.collection("users").doc(child.id).update({
            sponsorId: slot,
            removedFromBackboneAt: Timestamp.now(),
            previousSponsorId: backbone.id,
          });
        }
      }
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`${clearedCount} backbone account(s) had their sponsorId cleared.`);
  log(`${redistributedCount} real matrix member(s) redistributed away from the backbone.`);
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
