/**
 * check-matrix-width-violations.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Scans every user's sponsorId and reports ANY account with more than 10
 * direct children — a violation of the matrix's 10-wide placement rule.
 * Also reports each affected account's createdAt / activatedAt dates, to
 * help pinpoint WHEN these anomalies were introduced.
 *
 * USAGE:
 *   node check-matrix-width-violations.mjs
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log("\n=== READ-ONLY DIAGNOSTIC — nothing will be changed ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  log(`Loaded ${allUsers.length} users.`);

  const childrenOf = new Map();
  for (const u of allUsers) {
    if (u.sponsorId) {
      if (!childrenOf.has(u.sponsorId)) childrenOf.set(u.sponsorId, []);
      childrenOf.get(u.sponsorId).push(u);
    }
  }

  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  log("\n--- Accounts with MORE than 10 direct children (rule violations) ---\n");

  let violationCount = 0;
  for (const [sponsorId, kids] of childrenOf.entries()) {
    if (kids.length <= 10) continue;
    violationCount++;
    const sponsor = usersById.get(sponsorId);
    log(`⚠️  "${sponsor?.displayName || sponsorId}" (uid ${sponsorId}) has ${kids.length} direct children:`);
    kids
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      })
      .forEach((k, i) => {
        log(`     ${i + 1}. "${k.displayName || k.id}" — created ${k.createdAt ? new Date(k.createdAt).toLocaleString() : "unknown"}, activated ${k.activatedAt ? new Date(k.activatedAt).toLocaleString() : "not activated"}, isAutoPlaced: ${k.isAutoPlaced === undefined ? "field missing" : k.isAutoPlaced}`);
      });
    log("");
  }

  if (violationCount === 0) {
    log("None found — every account has 10 or fewer direct children.");
  }

  log(`\n=== SUMMARY ===`);
  log(`${violationCount} account(s) found with more than 10 direct children.`);
  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
