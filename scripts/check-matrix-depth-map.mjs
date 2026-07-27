/**
 * check-matrix-depth-map.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Maps the ENTIRE matrix tree from JPOWER03 (the new root), showing every
 * user's depth level and their full ancestor chain back up to JPOWER03.
 * Plain text output — safe to copy-paste directly into chat.
 *
 * USAGE:
 *   node check-matrix-depth-map.mjs
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const JPOWER_CODE = "JPOWER03";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log("\n=== READ-ONLY DIAGNOSTIC — nothing will be changed ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  const jpower = allUsers.find((u) => u.referralCode === JPOWER_CODE);
  if (!jpower) { log("⚠️  JPOWER03 not found."); return; }

  const childrenOf = new Map();
  for (const u of allUsers) {
    if (u.sponsorId) {
      if (!childrenOf.has(u.sponsorId)) childrenOf.set(u.sponsorId, []);
      childrenOf.get(u.sponsorId).push(u.id);
    }
  }

  log(`Root: JPOWER03 = "${jpower.displayName}" (Level 12)\n`);
  log("Full tree, indented by depth (Level 12 = JPOWER03, Level 13 = his direct children, etc.):\n");

  let maxDepth = 0;
  const lines = [];

  function walk(uid, depth, path) {
    const u = usersById.get(uid);
    if (!u) return;
    const level = 12 + depth;
    maxDepth = Math.max(maxDepth, level);
    const indent = "  ".repeat(depth);
    const directCount = (childrenOf.get(uid) || []).length;
    lines.push(`${indent}L${level}: ${u.displayName || uid} (${directCount} direct) [path: ${path}]`);

    const kids = childrenOf.get(uid) || [];
    for (const kidId of kids) {
      const kid = usersById.get(kidId);
      walk(kidId, depth + 1, path + " > " + (kid?.displayName || kidId));
    }
  }

  walk(jpower.id, 0, jpower.displayName || "JPOWER03");

  lines.forEach((l) => log(l));

  log(`\n=== SUMMARY ===`);
  log(`Deepest level found: L${maxDepth}`);
  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
